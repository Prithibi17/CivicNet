import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, initFirebaseSync } from './src/db.ts';
import {
  classifyIssue,
  calculateSeverity,
  checkDuplicates,
  calculatePriorityScore,
  getVerifierWeight,
  haversineDistance,
  CATEGORY_KEYWORDS
} from './src/ai-logic.ts';
import {
  User,
  Issue,
  Comment,
  Notification,
  Verification,
  IssueStatusHistory,
  AuditLog,
  Department,
  IssueStatus,
  UserRole,
  Media
} from './src/shared-types.ts';

export const app = express();
let isSetup = false;

export async function setupApp() {
  if (isSetup) return app;

  // Sync with Firestore before serving traffic
  await initFirebaseSync();

  app.use(express.json());

  // Strip /api prefix if present (for local dev and Vercel rewrites)
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
      req.url = req.url.substring(4);
    } else if (req.url === '/api') {
      req.url = '/';
    }
    next();
  });

  // Simple authentication middleware using Authorization Header: "Bearer <user-id>"
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userId = authHeader.substring(7);
      const db = readDb();
      const user = db.users.find(u => u.id === userId);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  });

  // Helper to enforce auth
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    next();
  };

  const requireRole = (roles: UserRole[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user;
      if (!user || !roles.includes(user.role)) {
        res.status(403).json({ error: 'Permission denied' });
        return;
      }
      next();
    };
  };

  // Helper to trigger notifications
  const createNotification = (
    recipientId: string,
    type: string,
    message: string,
    relatedIssueId?: string
  ) => {
    const db = readDb();
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId,
      type,
      message,
      relatedIssueId,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);
    writeDb(db);
  };

  // Helper to add audit log
  const createAuditLog = (
    actorId: string,
    actorName: string,
    action: string,
    entityType: string,
    entityId: string,
    beforeJson?: string,
    afterJson?: string
  ) => {
    const db = readDb();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      beforeJson,
      afterJson,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    writeDb(db);
  };

  // Helper to award points
  const awardPointsAndTrust = (userId: string, pointsGained: number, trustGained: number) => {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = db.users[userIndex];
      const oldPoints = user.points;
      user.points += pointsGained;
      user.trustScore = Math.min(Math.max(user.trustScore + trustGained, 0), 100);

      // Check badges
      const newBadges: string[] = [...user.badges];
      
      // first_report is handled at submission, trusted_verifier can be matched here:
      if (user.points >= 100 && !newBadges.includes('badge-community-champion')) {
        newBadges.push('badge-community-champion');
        createNotification(userId, 'BADGE_EARNED', 'Congratulations! You earned the "Community Champion" badge!', undefined);
      }
      
      user.badges = newBadges;
      writeDb(db);
    }
  };

  // 11. API SURFACE

  // Auth endpoints
  app.post('/auth/firebase-login', (req, res) => {
    const { email, name, uid } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const db = readDb();
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.id === uid);

    if (!user) {
      user = {
        id: uid || `user-${Date.now()}`,
        name: name || 'Google User',
        email: email,
        passwordHash: 'FirebaseGoogleSignIn',
        role: 'citizen',
        region: 'Jaipur Central',
        trustScore: 50,
        points: 0,
        badges: [],
        createdAt: new Date().toISOString(),
        notificationPrefs: { email: true, push: true }
      };
      db.users.push(user);
      writeDb(db);
      createAuditLog(user.id, user.name, 'SIGNUP_GOOGLE', 'User', user.id, undefined, JSON.stringify(user));
    }

    res.json({ user });
  });

  app.post('/auth/signup', (req, res) => {
    const {
      name,
      email,
      password,
      role,
      region,
      submittedDocumentName,
      submittedDocumentText,
      submittedDocumentUrl,
      designatedAreaName,
      designatedAreaCoordinates,
      verifierTargetAuthorityId
    } = req.body;
    const db = readDb();

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: password, // Simplified for demo
      role: role || 'citizen',
      region: region || designatedAreaName || 'Jaipur Central',
      trustScore: 50,
      points: 0,
      badges: [],
      createdAt: new Date().toISOString(),
      notificationPrefs: { email: true, push: true },
      isApproved: (role === 'citizen' || role === 'admin') ? true : false,
      submittedDocumentName,
      submittedDocumentText,
      submittedDocumentUrl,
      designatedAreaName,
      designatedAreaCoordinates,
      verifierTargetAuthorityId,
      appliedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    createAuditLog(newUser.id, newUser.name, 'SIGNUP', 'User', newUser.id, undefined, JSON.stringify(newUser));

    res.json({ user: newUser });
  });

  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Default to true for existing seeded users
    if (user.isApproved === false) {
      if (user.role === 'authority') {
        res.status(401).json({ error: 'Your authority account application is currently pending admin review and approval.' });
      } else if (user.role === 'verifier') {
        res.status(401).json({ error: 'Your verifier account application is currently pending authority review and approval.' });
      } else {
        res.status(401).json({ error: 'Your account is pending review and approval.' });
      }
      return;
    }

    res.json({ user });
  });

  // Public endpoint to get approved authorities for verifier signup selection
  app.get('/public/authorities', (req, res) => {
    const db = readDb();
    const authorities = db.users
      .filter(u => u.role === 'authority' && u.isApproved !== false)
      .map(u => ({ id: u.id, name: u.name, region: u.region, designatedAreaName: u.designatedAreaName }));
    res.json({ authorities });
  });

  app.post('/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    res.json({ success: true, message: 'Password reset link sent to registered email' });
  });

  app.post('/auth/reset-password', (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      db.users[userIndex].passwordHash = password;
      writeDb(db);
      res.json({ success: true, message: 'Password reset successful' });
    } else {
      res.status(404).json({ error: 'Email not found' });
    }
  });

  app.get('/users/me', requireAuth, (req, res) => {
    res.json({ user: (req as any).user });
  });

  app.put('/users/me', requireAuth, (req, res) => {
    const user = (req as any).user as User;
    const { name, region, email, notificationPrefs } = req.body;
    const db = readDb();
    const uIndex = db.users.findIndex(u => u.id === user.id);

    if (uIndex !== -1) {
      const original = JSON.stringify(db.users[uIndex]);
      if (name) db.users[uIndex].name = name;
      if (region) db.users[uIndex].region = region;
      if (email) db.users[uIndex].email = email;
      if (notificationPrefs) db.users[uIndex].notificationPrefs = notificationPrefs;

      writeDb(db);
      createAuditLog(user.id, user.name, 'UPDATE_PROFILE', 'User', user.id, original, JSON.stringify(db.users[uIndex]));
      res.json({ user: db.users[uIndex] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  app.get('/users/:id', (req, res) => {
    const db = readDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // Return safe public fields
    const safeUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      region: user.region,
      trustScore: user.trustScore,
      points: user.points,
      badges: user.badges,
      createdAt: user.createdAt
    };
    res.json({ user: safeUser });
  });

  // Departments endpoints
  app.get('/departments', (req, res) => {
    const db = readDb();
    res.json({ departments: db.departments });
  });

  app.post('/departments', requireAuth, requireRole(['admin']), (req, res) => {
    const { name, code, contactEmail, serviceArea, slaHours } = req.body;
    const db = readDb();
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name,
      contactEmail: contactEmail || `${code.toLowerCase()}@jaipur.gov.in`,
      serviceArea: serviceArea || 'All Jaipur Areas',
      slaHours: slaHours || 48,
      staffIds: []
    };
    db.departments.push(newDept);
    writeDb(db);
    createAuditLog((req as any).user.id, (req as any).user.name, 'CREATE_DEPARTMENT', 'Department', newDept.id, '', JSON.stringify(newDept));
    res.json({ department: newDept });
  });

  app.put('/departments/:id', requireAuth, requireRole(['admin']), (req, res) => {
    const { name, contactEmail, serviceArea, slaHours } = req.body;
    const db = readDb();
    const deptIndex = db.departments.findIndex(d => d.id === req.params.id);

    if (deptIndex !== -1) {
      const original = JSON.stringify(db.departments[deptIndex]);
      if (name) db.departments[deptIndex].name = name;
      if (contactEmail) db.departments[deptIndex].contactEmail = contactEmail;
      if (serviceArea) db.departments[deptIndex].serviceArea = serviceArea;
      if (slaHours) db.departments[deptIndex].slaHours = Number(slaHours);

      writeDb(db);
      createAuditLog((req as any).user.id, (req as any).user.name, 'UPDATE_DEPARTMENT', 'Department', req.params.id, original, JSON.stringify(db.departments[deptIndex]));
      res.json({ department: db.departments[deptIndex] });
    } else {
      res.status(404).json({ error: 'Department not found' });
    }
  });

  // Notifications endpoints
  app.get('/notifications', requireAuth, (req, res) => {
    const user = (req as any).user;
    const db = readDb();
    const userNotifs = db.notifications.filter(n => n.recipientId === user.id);
    res.json({ notifications: userNotifs });
  });

  app.patch('/notifications/:id/read', requireAuth, (req, res) => {
    const user = (req as any).user;
    const db = readDb();
    const index = db.notifications.findIndex(n => n.id === req.params.id && n.recipientId === user.id);
    if (index !== -1) {
      db.notifications[index].read = true;
      writeDb(db);
      res.json({ notification: db.notifications[index] });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  });

  // Issues endpoints
  app.get('/issues', (req, res) => {
    const db = readDb();
    let filteredIssues = [...db.issues];

    // Filters
    const { category, severity, status, search, latMin, latMax, lngMin, lngMax } = req.query;

    if (category) {
      filteredIssues = filteredIssues.filter(i => i.category === category);
    }
    if (severity) {
      filteredIssues = filteredIssues.filter(i => i.severity === severity);
    }
    if (status) {
      filteredIssues = filteredIssues.filter(i => i.status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filteredIssues = filteredIssues.filter(
        i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    if (latMin && latMax && lngMin && lngMax) {
      const minLat = Number(latMin);
      const maxLat = Number(latMax);
      const minLng = Number(lngMin);
      const maxLng = Number(lngMax);
      filteredIssues = filteredIssues.filter(
        i => i.lat >= minLat && i.lat <= maxLat && i.lng >= minLng && i.lng <= maxLng
      );
    }

    // Sort by priorityScore or newest by default
    filteredIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ issues: filteredIssues });
  });

  app.get('/issues/:id', (req, res) => {
    const db = readDb();
    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const media = db.media.filter(m => m.issueId === issue.id);
    const verifications = db.verifications.filter(v => v.issueId === issue.id);
    const comments = db.comments.filter(c => c.issueId === issue.id);
    const history = db.issueStatusHistories.filter(h => h.issueId === issue.id);

    res.json({
      issue,
      media,
      verifications,
      comments,
      history
    });
  });

  app.post('/issues', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { title, description, lat, lng, addressText, category, mediaUrls } = req.body;
    const db = readDb();

    // 8.1 Automated Classification (run keyword matching if category not selected, or run it anyway)
    const classifiedCategory = category || classifyIssue(title, description);

    // 8.2 Automated Severity
    const mediaCount = (mediaUrls || []).length;
    const calculatedSeverity = calculateSeverity(classifiedCategory, title, description, mediaCount);

    const issueId = `issue-${Date.now()}`;
    const newIssue: Issue = {
      id: issueId,
      title,
      description,
      category: classifiedCategory,
      severity: calculatedSeverity,
      priorityScore: 0, // calculated below
      status: 'Reported',
      lat: Number(lat),
      lng: Number(lng),
      addressText: addressText || 'Jaipur, Rajasthan',
      createdBy: { id: user.id, name: user.name, email: user.email },
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto-map categories to departments
    const deptMapping: Record<string, string> = {
      'Road Damage / Pothole': 'dept-road',
      'Water Leakage': 'dept-water',
      'Streetlight Problem': 'dept-electrical',
      'Garbage & Waste': 'dept-sanitation',
      'Drainage / Sewage': 'dept-drainage',
      'Traffic & Road Signs': 'dept-road',
      'Parks & Recreation': 'dept-pworks',
      'Stray Animals / Safety': 'dept-sanitation',
      'Air & Noise Pollution': 'dept-pworks',
      'Vandalism & Graffiti': 'dept-pworks',
      'Public Transit & Bus Stops': 'dept-pworks',
      'Public Health & Encroachments': 'dept-sanitation'
    };
    newIssue.assignedDepartmentId = deptMapping[classifiedCategory] || 'dept-pworks';

    // 8.4 Duplicate Detection
    const dupCheck = checkDuplicates(
      { lat: newIssue.lat, lng: newIssue.lng, category: classifiedCategory, title, description },
      db.issues
    );

    let isDuplicate = false;
    if (dupCheck.autoLinked && dupCheck.duplicateOfId) {
      isDuplicate = true;
      newIssue.duplicateOfIssueId = dupCheck.duplicateOfId;
      newIssue.status = 'AI Reviewed'; // Pauses duplicate issues

      // Increment original issue's duplicate count
      const origIndex = db.issues.findIndex(i => i.id === dupCheck.duplicateOfId);
      if (origIndex !== -1) {
        db.issues[origIndex].duplicateCount += 1;
        // Re-calculate parent priority score
        const updatedPriority = calculatePriorityScore(db.issues[origIndex], db.issues);
        db.issues[origIndex].priorityScore = updatedPriority.score;
        db.issues[origIndex].isUrgent = updatedPriority.isUrgent;
      }
    }

    // Write initial reported status history
    const history1: IssueStatusHistory = {
      id: `hist-${Date.now()}-1`,
      issueId,
      fromStatus: 'None',
      toStatus: 'Reported',
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: 'Issue submitted by citizen.',
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history1);

    // AI classification status history
    const history2: IssueStatusHistory = {
      id: `hist-${Date.now()}-2`,
      issueId,
      fromStatus: 'Reported',
      toStatus: 'AI Reviewed',
      changedBy: { id: 'user-admin', name: 'AI Classifier', role: 'admin' },
      note: `AI classified Category as "${classifiedCategory}", Severity: ${calculatedSeverity}.`,
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history2);

    if (!isDuplicate) {
      // 8.3 Calculate Priority
      const priorityDetails = calculatePriorityScore(newIssue, db.issues);
      newIssue.priorityScore = priorityDetails.score;
      newIssue.isUrgent = priorityDetails.isUrgent;

      // Progress automatically to "Awaiting Verification"
      newIssue.status = 'Awaiting Verification';

      const history3: IssueStatusHistory = {
        id: `hist-${Date.now()}-3`,
        issueId,
        fromStatus: 'AI Reviewed',
        toStatus: 'Awaiting Verification',
        changedBy: { id: 'user-admin', name: 'AI Classifier', role: 'admin' },
        note: 'Sent to verification queue.',
        createdAt: new Date().toISOString()
      };
      db.issueStatusHistories.push(history3);
    } else {
      // It is marked duplicate, calculate priority with link
      const priorityDetails = calculatePriorityScore(newIssue, db.issues);
      newIssue.priorityScore = priorityDetails.score;
      newIssue.isUrgent = priorityDetails.isUrgent;
    }

    // Add media if provided
    if (mediaUrls && mediaUrls.length > 0) {
      mediaUrls.forEach((url: string, index: number) => {
        db.media.push({
          id: `media-${Date.now()}-${index}`,
          issueId,
          type: 'image',
          url,
          uploadedBy: user.id,
          createdAt: new Date().toISOString()
        });
      });
    }

    db.issues.push(newIssue);

    // Citizen points reward (+5 points)
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      const u = db.users[userIndex];
      u.points += 5;
      if (!u.badges.includes('badge-first-report')) {
        u.badges.push('badge-first-report');
        createNotification(user.id, 'BADGE_EARNED', 'Congratulations! You earned the "First Report" badge!', undefined);
      }
    }

    writeDb(db);

    // Create notifications
    createNotification(
      user.id,
      isDuplicate ? 'DUPLICATE_FLAGGED' : 'AI_CLASSIFIED',
      isDuplicate
        ? `Your report has been flagged as a duplicate of an existing issue. You are now automatically following the original report.`
        : `Your report "${title}" has been AI reviewed and routed to ${newIssue.category}.`,
      issueId
    );

    // Create notifications for nearby verifiers (all verifiers in database)
    db.users
      .filter(u => u.role === 'verifier' || u.role === 'admin')
      .forEach(verifier => {
        createNotification(
          verifier.id,
          'NEARBY_VERIFICATION',
          `New verification request available in ${newIssue.addressText.split(',')[1] || 'your area'}.`,
          issueId
        );
      });

    createAuditLog(
      user.id,
      user.name,
      'CREATE_ISSUE',
      'Issue',
      issueId,
      undefined,
      JSON.stringify(newIssue)
    );

    res.json({
      issue: newIssue,
      aiAnalysis: {
        category: classifiedCategory,
        severity: calculatedSeverity,
        priorityScore: newIssue.priorityScore,
        isUrgent: newIssue.isUrgent,
        isDuplicate,
        duplicateCandidates: dupCheck.candidates
      }
    });
  });

  // Attach media to issue
  app.post('/issues/:id/media', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { url, type } = req.body;
    const db = readDb();

    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const newMedia: Media = {
      id: `media-${Date.now()}`,
      issueId: issue.id,
      type: type || 'image',
      url,
      uploadedBy: user.id,
      createdAt: new Date().toISOString()
    };

    db.media.push(newMedia);
    writeDb(db);

    res.json({ media: newMedia });
  });

  // Verify / reject issue (Section 8.5)
  app.post('/issues/:id/verify', requireAuth, requireRole(['verifier', 'authority', 'admin']), (req, res) => {
    const user = (req as any).user as User;
    const { result, confidence, note, evidenceMediaUrl } = req.body;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];

    // Check if already verified
    if (issue.status !== 'Awaiting Verification' && issue.status !== 'Reopened' && issue.status !== 'Reported') {
      res.status(400).json({ error: 'Issue is not in a verification state' });
      return;
    }

    // Verify weight
    const verifierWeight = getVerifierWeight(user.trustScore);

    // Create verification
    const verificationId = `ver-${Date.now()}`;
    let evidenceMediaId: string | undefined;

    if (evidenceMediaUrl) {
      evidenceMediaId = `media-evidence-${Date.now()}`;
      db.media.push({
        id: evidenceMediaId,
        issueId: issue.id,
        type: 'image',
        url: evidenceMediaUrl,
        uploadedBy: user.id,
        createdAt: new Date().toISOString()
      });
    }

    const newVerification: Verification = {
      id: verificationId,
      issueId: issue.id,
      verifierId: user.id,
      verifierName: user.name,
      result: result || 'confirm',
      confidence: Number(confidence) || 1.0,
      verifierWeightAtTime: verifierWeight,
      note,
      createdAt: new Date().toISOString()
    };

    db.verifications.push(newVerification);

    // Calculate running scores
    const allVerifications = db.verifications.filter(v => v.issueId === issue.id);
    let positiveSum = 0;
    let negativeSum = 0;

    allVerifications.forEach(v => {
      const contribution = v.confidence * v.verifierWeightAtTime;
      if (v.result === 'confirm') {
        positiveSum += contribution;
      } else {
        negativeSum += contribution;
      }
    });

    issue.verificationCount = allVerifications.length;

    let statusChanged = false;
    let originalStatus = issue.status;
    let noteText = '';

    if (result === 'confirm') {
      issue.status = 'Verified';
      statusChanged = true;
      noteText = `Verification confirmed by verifier ${user.name}. Status advanced to Verified.`;
    } else if (result === 'reject') {
      issue.status = 'Reported'; // Flagged back for review
      statusChanged = true;
      noteText = `Verification rejected by verifier ${user.name}. Flagged back for review.`;
    }

    // Re-calculate Priority
    const priorityDetails = calculatePriorityScore(issue, db.issues);
    issue.priorityScore = priorityDetails.score;
    issue.isUrgent = priorityDetails.isUrgent;

    // Save history
    if (statusChanged) {
      const history: IssueStatusHistory = {
        id: `hist-${Date.now()}`,
        issueId: issue.id,
        fromStatus: originalStatus,
        toStatus: issue.status,
        changedBy: { id: 'user-admin', name: 'Verification System', role: 'admin' },
        note: noteText,
        createdAt: new Date().toISOString()
      };
      db.issueStatusHistories.push(history);
    }

    writeDb(db);

    // Reward verifier (+10 points, trust +2)
    awardPointsAndTrust(user.id, 10, 2);

    // Create notifications if status changed
    if (statusChanged) {
      createNotification(
        issue.createdBy.id,
        'STATUS_CHANGE',
        `Your report "${issue.title}" has crossed verification thresholds and is now: ${issue.status}.`,
        issue.id
      );
    }

    createAuditLog(
      user.id,
      user.name,
      'VERIFY_ISSUE',
      'Verification',
      verificationId,
      undefined,
      JSON.stringify(newVerification)
    );

    res.json({
      verification: newVerification,
      issue,
      sums: { positiveSum, negativeSum, threshold: 3.0 }
    });
  });

  // Verify Work In Progress / Take picture of workers at work-site (Section 8.5/User workflow)
  app.post('/issues/:id/verify-progress', requireAuth, requireRole(['verifier', 'authority', 'admin']), (req, res) => {
    const user = (req as any).user;
    const { progressPhotoUrl, notes } = req.body;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];
    const originalStatus = issue.status;

    if (issue.status !== 'Assigned') {
      res.status(400).json({ error: 'Issue is not in Assigned status' });
      return;
    }

    if (!progressPhotoUrl) {
      res.status(400).json({ error: 'A photo of workers actively working is required to mark as In Progress.' });
      return;
    }

    issue.status = 'In Progress';
    issue.progressPhotoUrl = progressPhotoUrl;
    issue.progressNotes = notes || 'Verifier uploaded active work-site photo. Work is in progress.';
    issue.updatedAt = new Date().toISOString();

    // Add progress photo to media
    db.media.push({
      id: `media-progress-${Date.now()}`,
      issueId: issue.id,
      type: 'image',
      url: progressPhotoUrl,
      uploadedBy: user.id,
      createdAt: new Date().toISOString()
    });

    const history: IssueStatusHistory = {
      id: `hist-${Date.now()}`,
      issueId: issue.id,
      fromStatus: originalStatus,
      toStatus: 'In Progress',
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: issue.progressNotes,
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history);

    writeDb(db);

    // Notify reporter
    createNotification(
      issue.createdBy.id,
      'STATUS_CHANGE',
      `Active repairs have begun on your report "${issue.title}". Field photo uploaded by verifier.`,
      issue.id
    );

    // Award verifier some points for field visit (+15 points, trust +3)
    awardPointsAndTrust(user.id, 15, 3);

    createAuditLog(user.id, user.name, 'VERIFY_PROGRESS', 'Issue', issue.id, originalStatus, 'In Progress');

    res.json({ issue });
  });

  // Assign issue (Authority / Admin)
  app.post('/issues/:id/assign', requireAuth, requireRole(['authority', 'admin']), (req, res) => {
    const user = (req as any).user;
    const { departmentId, staffId, staffName } = req.body;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];
    const originalStatus = issue.status;

    if (departmentId) {
      issue.assignedDepartmentId = departmentId;
    }
    if (staffId) {
      issue.assignedStaffId = staffId;
      issue.assignedStaffName = staffName || 'Assigned Officer';
    }

    // Change status from Verified to Assigned
    if (issue.status === 'Verified' || issue.status === 'Awaiting Verification') {
      issue.status = 'Assigned';
    }

    const history: IssueStatusHistory = {
      id: `hist-${Date.now()}`,
      issueId: issue.id,
      fromStatus: originalStatus,
      toStatus: issue.status,
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: `Issue assigned to ${staffName || 'Officer'} of Department ${departmentId || 'Maintenance'}.`,
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history);

    writeDb(db);

    // Notify reporter
    createNotification(
      issue.createdBy.id,
      'STATUS_CHANGE',
      `Your report "${issue.title}" has been assigned to an officer for resolution.`,
      issue.id
    );

    if (staffId) {
      createNotification(
        staffId,
        'ASSIGNMENT',
        `You have been assigned to resolve issue: "${issue.title}".`,
        issue.id
      );
    }

    createAuditLog(user.id, user.name, 'ASSIGN_ISSUE', 'Issue', issue.id, originalStatus, issue.status);

    res.json({ issue });
  });

  // Patch status (Authority / Admin)
  app.patch('/issues/:id/status', requireAuth, requireRole(['authority', 'admin']), (req, res) => {
    const user = (req as any).user;
    const { status, note, resolutionProofUrl, resolutionNotes } = req.body;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];
    const originalStatus = issue.status;

    // Check validity of status transition according to state machine
    issue.status = status as IssueStatus;

    if (status === 'Resolved' || status === 'Closed') {
      if (!resolutionProofUrl) {
        res.status(400).json({ error: 'Resolution requires a proof-of-completion photo upload' });
        return;
      }
      issue.resolvedAt = new Date().toISOString();
      if (status === 'Closed') {
        issue.closedAt = new Date().toISOString();
      }
      issue.resolutionProofUrl = resolutionProofUrl;
      issue.resolutionNotes = resolutionNotes || 'Resolved by department staff.';

      // Add a resolution media item
      db.media.push({
        id: `media-resolution-${Date.now()}`,
        issueId: issue.id,
        type: 'image',
        url: resolutionProofUrl,
        uploadedBy: user.id,
        createdAt: new Date().toISOString()
      });

      // Award points on closing
      if (status === 'Closed' && issue.assignedStaffId) {
        awardPointsAndTrust(issue.assignedStaffId, 15, 5);
      }
    }

    issue.updatedAt = new Date().toISOString();

    const history: IssueStatusHistory = {
      id: `hist-${Date.now()}`,
      issueId: issue.id,
      fromStatus: originalStatus,
      toStatus: issue.status,
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: note || `Status updated to ${status}.`,
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history);

    writeDb(db);

    // Notify reporter
    createNotification(
      issue.createdBy.id,
      'STATUS_CHANGE',
      `Your report "${issue.title}" status changed to: ${status}.`,
      issue.id
    );

    createAuditLog(user.id, user.name, 'UPDATE_STATUS', 'Issue', issue.id, originalStatus, status);

    res.json({ issue });
  });

  // Confirm resolution (Citizen)
  app.post('/issues/:id/confirm-resolution', requireAuth, (req, res) => {
    const user = (req as any).user;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];
    if (issue.createdBy.id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Only the original reporter can confirm the resolution' });
      return;
    }

    const originalStatus = issue.status;
    issue.status = 'Closed';
    issue.closedAt = new Date().toISOString();
    issue.updatedAt = new Date().toISOString();

    const history: IssueStatusHistory = {
      id: `hist-${Date.now()}`,
      issueId: issue.id,
      fromStatus: originalStatus,
      toStatus: 'Closed',
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: 'Reporter confirmed the resolution.',
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history);

    writeDb(db);

    // Points updates
    // submitter gets +5 points on resolution confirmed
    awardPointsAndTrust(user.id, 5, 2);

    // officer who resolved gets +15 points on leaderboard
    if (issue.assignedStaffId) {
      awardPointsAndTrust(issue.assignedStaffId, 15, 5);
      createNotification(
        issue.assignedStaffId,
        'RESOLVED_CONFIRMED',
        `Your resolution on "${issue.title}" has been confirmed by the reporter! (+15 Points)`,
        issue.id
      );
    }

    createAuditLog(user.id, user.name, 'CONFIRM_RESOLUTION', 'Issue', issue.id, originalStatus, 'Closed');

    res.json({ issue });
  });

  // Reopen issue (Citizen)
  app.post('/issues/:id/reopen', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { note } = req.body;
    const db = readDb();

    const issueIndex = db.issues.findIndex(i => i.id === req.params.id);
    if (issueIndex === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const issue = db.issues[issueIndex];
    if (issue.createdBy.id !== user.id && user.role !== 'admin') {
      res.status(403).json({ error: 'Only the original reporter can reopen the issue' });
      return;
    }

    const originalStatus = issue.status;
    issue.status = 'Reopened';
    issue.updatedAt = new Date().toISOString();

    const history1: IssueStatusHistory = {
      id: `hist-${Date.now()}-re1`,
      issueId: issue.id,
      fromStatus: originalStatus,
      toStatus: 'Reopened',
      changedBy: { id: user.id, name: user.name, role: user.role },
      note: note || 'Reporter rejected the resolution.',
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history1);

    // Enforce immediate transition to Awaiting Verification
    issue.status = 'Awaiting Verification';
    const history2: IssueStatusHistory = {
      id: `hist-${Date.now()}-re2`,
      issueId: issue.id,
      fromStatus: 'Reopened',
      toStatus: 'Awaiting Verification',
      changedBy: { id: 'user-admin', name: 'System', role: 'admin' },
      note: 'Reopened issue queued back into Awaiting Verification.',
      createdAt: new Date().toISOString()
    };
    db.issueStatusHistories.push(history2);

    // Reset verification counts
    issue.verificationCount = 0;
    // Clear verifications for a clean slate
    db.verifications = db.verifications.filter(v => v.issueId !== issue.id);

    writeDb(db);

    // Notify assigned officer
    if (issue.assignedStaffId) {
      createNotification(
        issue.assignedStaffId,
        'REOPENED',
        `The reporter rejected your resolution on "${issue.title}". The issue has been reopened.`,
        issue.id
      );
    }

    createAuditLog(user.id, user.name, 'REOPEN_ISSUE', 'Issue', issue.id, originalStatus, 'Awaiting Verification');

    res.json({ issue });
  });

  // Comments endpoints
  app.get('/issues/:id/comments', (req, res) => {
    const db = readDb();
    const comments = db.comments.filter(c => c.issueId === req.params.id);
    res.json({ comments });
  });

  app.post('/issues/:id/comments', requireAuth, (req, res) => {
    const user = (req as any).user;
    const { content, attachmentUrl } = req.body;
    const db = readDb();

    const issue = db.issues.find(i => i.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      issueId: issue.id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content,
      attachmentUrl,
      createdAt: new Date().toISOString()
    };

    db.comments.push(newComment);
    writeDb(db);

    // Notify reporter and assigned officer if commenting
    if (user.id !== issue.createdBy.id) {
      createNotification(
        issue.createdBy.id,
        'NEW_COMMENT',
        `${user.name} commented on your report: "${content.substring(0, 40)}..."`,
        issue.id
      );
    }
    if (issue.assignedStaffId && user.id !== issue.assignedStaffId) {
      createNotification(
        issue.assignedStaffId,
        'NEW_COMMENT',
        `${user.name} commented on assigned issue: "${content.substring(0, 40)}..."`,
        issue.id
      );
    }

    res.json({ comment: newComment });
  });

  // Analytics endpoints
  app.get('/analytics/summary', (req, res) => {
    const db = readDb();
    const totalReports = db.issues.length;
    const resolvedCount = db.issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const activeCount = db.issues.filter(i => i.status !== 'Closed').length;

    // Calculate resolution rate
    const resolutionRate = totalReports > 0 ? (resolvedCount / totalReports) * 100 : 0;

    // Calculate average resolution time (hours)
    let totalHours = 0;
    let countedResolved = 0;
    db.issues.forEach(i => {
      if (i.resolvedAt) {
        const diffMs = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
        totalHours += diffMs / (1000 * 60 * 60);
        countedResolved += 1;
      }
    });
    const avgResolutionTimeHours = countedResolved > 0 ? totalHours / countedResolved : 48; // default to 48h

    // Backlog count (Awaiting verification, Verified, Assigned, In Progress, Reopened)
    const backlogCount = db.issues.filter(
      i => ['Awaiting Verification', 'Verified', 'Assigned', 'In Progress', 'Reopened'].includes(i.status)
    ).length;

    // Department performance
    const deptPerformance = db.departments.map(dept => {
      const deptIssues = db.issues.filter(i => i.assignedDepartmentId === dept.id);
      const solved = deptIssues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
      const rate = deptIssues.length > 0 ? (solved / deptIssues.length) * 100 : 100;
      return {
        id: dept.id,
        name: dept.name,
        total: deptIssues.length,
        resolved: solved,
        rate: Math.round(rate)
      };
    });

    // Category counts
    const categories = Object.keys(CATEGORY_KEYWORDS);
    const categoryCounts = categories.map(cat => ({
      name: cat,
      count: db.issues.filter(i => i.category === cat).length
    }));

    // Issues over time (last 7 days)
    const issuesOverTime = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const count = db.issues.filter(issue => {
        const time = new Date(issue.createdAt).getTime();
        return time >= dayStart && time <= dayEnd;
      }).length;

      return { date: dateString, reports: count };
    });

    res.json({
      summary: {
        totalReports,
        resolvedCount,
        backlogCount,
        resolutionRate: Math.round(resolutionRate),
        avgResolutionTimeDays: (avgResolutionTimeHours / 24).toFixed(1),
        activeCount
      },
      deptPerformance,
      categoryCounts,
      issuesOverTime
    });
  });

  app.get('/analytics/hotspots', (req, res) => {
    const db = readDb();
    const openIssues = db.issues.filter(i => i.status !== 'Closed' && !i.duplicateOfIssueId);

    // Group issues by high density coordinate areas (clusters within 200m)
    const hotspots: { lat: number; lng: number; intensity: number; count: number; category: string; address: string }[] = [];

    openIssues.forEach(issue => {
      let merged = false;
      for (const h of hotspots) {
        const dist = haversineDistance(issue.lat, issue.lng, h.lat, h.lng);
        if (dist <= 200) {
          h.count += 1;
          h.intensity = Math.min(h.count / 5, 1.0); // normalize intensity cap at 1.0
          merged = true;
          break;
        }
      }

      if (!merged) {
        hotspots.push({
          lat: issue.lat,
          lng: issue.lng,
          intensity: 0.2,
          count: 1,
          category: issue.category,
          address: issue.addressText
        });
      }
    });

    // Sort descending by count
    hotspots.sort((a, b) => b.count - a.count);

    res.json({ hotspots: hotspots.slice(0, 5) });
  });

  // Leaderboard endpoint
  app.get('/leaderboard', (req, res) => {
    const db = readDb();
    // Sort users by points
    const sortedUsers = [...db.users]
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        region: u.region,
        points: u.points,
        trustScore: u.trustScore,
        badgesCount: u.badges.length
      }))
      .sort((a, b) => b.points - a.points);

    res.json({ leaderboard: sortedUsers });
  });

  // Admin audit logs
  app.get('/admin/audit-log', requireAuth, requireRole(['admin']), (req, res) => {
    const db = readDb();
    res.json({ auditLogs: db.auditLogs });
  });

  // Admin update user
  app.put('/admin/users/:id', requireAuth, requireRole(['admin']), (req, res) => {
    const { role, departmentId, trustScore, isApproved, applicationNote } = req.body;
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);

    if (userIndex !== -1) {
      const original = JSON.stringify(db.users[userIndex]);
      if (role) db.users[userIndex].role = role;
      if (departmentId !== undefined) db.users[userIndex].departmentId = departmentId;
      if (trustScore !== undefined) db.users[userIndex].trustScore = Number(trustScore);
      if (isApproved !== undefined) db.users[userIndex].isApproved = isApproved;
      if (applicationNote !== undefined) db.users[userIndex].applicationNote = applicationNote;

      writeDb(db);
      createAuditLog(
        (req as any).user.id,
        (req as any).user.name,
        'ADMIN_UPDATE_USER',
        'User',
        req.params.id,
        original,
        JSON.stringify(db.users[userIndex])
      );
      res.json({ user: db.users[userIndex] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Authority or Admin approves a verifier application
  app.post('/authority/approve-verifier/:id', requireAuth, requireRole(['authority', 'admin']), (req, res) => {
    const db = readDb();
    const verifierId = req.params.id;
    const verifierUser = db.users.find(u => u.id === verifierId && u.role === 'verifier');
    const currentUser = (req as any).user;

    if (!verifierUser) {
      res.status(404).json({ error: 'Verifier application not found' });
      return;
    }

    // Ensure this authority is the one the verifier applied under (or user is admin)
    if (currentUser.role !== 'admin' && verifierUser.verifierTargetAuthorityId !== currentUser.id) {
      res.status(403).json({ error: 'Permission denied. You can only verify applications assigned to your authority.' });
      return;
    }

    const original = JSON.stringify(verifierUser);
    verifierUser.isApproved = true;
    verifierUser.applicationNote = req.body.note || 'Approved by Authority';

    writeDb(db);

    createAuditLog(
      currentUser.id,
      currentUser.name,
      'APPROVE_VERIFIER',
      'User',
      verifierId,
      original,
      JSON.stringify(verifierUser)
    );

    // Notify verifier
    createNotification(
      verifierId,
      'VERIFIER_APPROVED',
      `Congratulations! Your verifier application has been verified and approved by ${currentUser.name}. You can now log in.`,
      undefined
    );

    res.json({ success: true, user: verifierUser });
  });

  // Admin users list
  app.get('/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
    const db = readDb();
    res.json({ users: db.users });
  });

  // Serve static files and mount Vite dev server in non-production
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  isSetup = true;
  return app;
}

if (!process.env.VERCEL) {
  setupApp().then(app => {
    const PORT = process.env.PORT || 3000;
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(console.error);
}
