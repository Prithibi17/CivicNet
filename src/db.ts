import fs from 'fs';
import path from 'path';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  User,
  Issue,
  Media,
  Verification,
  Comment,
  Notification,
  Department,
  Badge,
  AuditLog,
  IssueStatusHistory,
  IssueStatus
} from './shared-types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

export interface DatabaseSchema {
  users: User[];
  issues: Issue[];
  media: Media[];
  verifications: Verification[];
  comments: Comment[];
  notifications: Notification[];
  departments: Department[];
  badges: Badge[];
  auditLogs: AuditLog[];
  issueStatusHistories: IssueStatusHistory[];
}

// Default seeded state
const initialSchema: DatabaseSchema = {
  users: [
    {
      id: 'user-citizen',
      name: 'John Citizen',
      email: 'citizen@demo.com',
      passwordHash: 'Demo1234!', // simplified plain-text for demo ease
      role: 'citizen',
      region: 'Jaipur Central',
      trustScore: 50,
      points: 25,
      badges: ['badge-first-report'],
      createdAt: new Date('2026-06-01T10:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    },
    {
      id: 'user-verifier',
      name: 'Vikram Verifier',
      email: 'verifier@demo.com',
      passwordHash: 'Demo1234!',
      role: 'verifier',
      region: 'Malviya Nagar',
      trustScore: 65,
      points: 65,
      badges: ['badge-first-report', 'badge-trusted-verifier'],
      createdAt: new Date('2026-06-01T10:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    },
    {
      id: 'user-authority',
      name: 'Raj Sharma',
      email: 'authority@demo.com',
      passwordHash: 'Demo1234!',
      role: 'authority',
      region: 'Jaipur West',
      trustScore: 80,
      points: 120,
      badges: ['badge-closer'],
      departmentId: 'dept-road',
      createdAt: new Date('2026-06-01T10:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    },
    {
      id: 'user-admin',
      name: 'Ananya Admin',
      email: 'admin@demo.com',
      passwordHash: 'Demo1234!',
      role: 'admin',
      region: 'Jaipur Headquarters',
      trustScore: 100,
      points: 250,
      badges: ['badge-community-champion'],
      createdAt: new Date('2026-06-01T10:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    },
    {
      id: 'user-verifier2',
      name: 'Neha Singh',
      email: 'verifier2@demo.com',
      passwordHash: 'Demo1234!',
      role: 'verifier',
      region: 'Vaishali Nagar',
      trustScore: 60,
      points: 30,
      badges: ['badge-first-report'],
      createdAt: new Date('2026-06-05T11:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    },
    {
      id: 'user-verifier3',
      name: 'Rahul Verma',
      email: 'verifier3@demo.com',
      passwordHash: 'Demo1234!',
      role: 'verifier',
      region: 'Bari Path',
      trustScore: 55,
      points: 20,
      badges: [],
      createdAt: new Date('2026-06-06T12:00:00Z').toISOString(),
      notificationPrefs: { email: true, push: true }
    }
  ],
  departments: [
    {
      id: 'dept-road',
      name: 'Road Maintenance',
      contactEmail: 'roads@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - Roads & Pavements',
      slaHours: 48,
      staffIds: ['user-authority']
    },
    {
      id: 'dept-water',
      name: 'Water Department',
      contactEmail: 'water@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - Water Supply & Mains',
      slaHours: 24,
      staffIds: []
    },
    {
      id: 'dept-electrical',
      name: 'Streetlight & Electrical',
      contactEmail: 'lights@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - Lighting & Grids',
      slaHours: 12,
      staffIds: []
    },
    {
      id: 'dept-sanitation',
      name: 'Sanitation Department',
      contactEmail: 'sanitation@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - Waste Management',
      slaHours: 24,
      staffIds: []
    },
    {
      id: 'dept-drainage',
      name: 'Drainage & Sewage',
      contactEmail: 'sewage@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - Drainage Systems',
      slaHours: 36,
      staffIds: []
    },
    {
      id: 'dept-pworks',
      name: 'Public Works Department',
      contactEmail: 'pwd@jaipur.gov.in',
      serviceArea: 'Jaipur Municipal Area - General Infrastructure',
      slaHours: 72,
      staffIds: []
    }
  ],
  badges: [
    {
      id: 'badge-first-report',
      name: 'First Report',
      description: 'Submitted your first civic report on CivicNet.',
      criteriaKey: 'first_report',
      icon: 'FilePlus'
    },
    {
      id: 'badge-trusted-verifier',
      name: 'Trusted Verifier',
      description: 'Cast 25 verifications that matched eventual consensus.',
      criteriaKey: 'trusted_verifier',
      icon: 'ShieldCheck'
    },
    {
      id: 'badge-community-champion',
      name: 'Community Champion',
      description: 'Earned 100 lifetime points helping improve Jaipur.',
      criteriaKey: 'community_champion',
      icon: 'Award'
    },
    {
      id: 'badge-closer',
      name: 'Closer',
      description: 'Helped 5 reported issues reach the Closed status.',
      criteriaKey: 'closer',
      icon: 'CheckCircle'
    }
  ],
  issues: [
    {
      id: 'issue-1',
      title: 'Large pothole near VGU Main Gate',
      description: 'A large pothole has formed near the main gate of VGU. Several bikes have already slipped. The problem becomes difficult to see during rain and is dangerous for students.',
      category: 'Road Damage / Pothole',
      severity: 'high',
      priorityScore: 50,
      status: 'Awaiting Verification',
      lat: 26.8501,
      lng: 75.8110,
      addressText: 'Near VGU Main Gate, Sector 36, Jagatpura, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-road',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date('2026-06-20T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-20T08:05:00Z').toISOString()
    },
    {
      id: 'issue-2',
      title: 'Water main burst on Tonk Road',
      description: 'Major water line burst near Tonk Road flyover. Water is flooding the side lane causing heavy traffic delays. Hundreds of gallons being wasted.',
      category: 'Water Leakage',
      severity: 'critical',
      priorityScore: 82,
      status: 'In Progress',
      lat: 26.8700,
      lng: 75.7900,
      addressText: 'Tonk Road Flyover Service Lane, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-water',
      assignedStaffId: 'user-authority',
      assignedStaffName: 'Raj Sharma',
      duplicateCount: 1,
      verificationCount: 3,
      isUrgent: true,
      createdAt: new Date('2026-06-18T09:15:00Z').toISOString(),
      updatedAt: new Date('2026-06-19T11:00:00Z').toISOString()
    },
    {
      id: 'issue-3',
      title: 'Flickering streetlights in Vaishali Nagar',
      description: 'All 4 streetlights on lane 3 are flickering constantly or completely dead. Very dangerous for walkers at night.',
      category: 'Streetlight Problem',
      severity: 'low',
      priorityScore: 25,
      status: 'Reported',
      lat: 26.9000,
      lng: 75.7400,
      addressText: 'Lane 3, Sector 2, Vaishali Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-electrical',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date('2026-06-22T21:30:00Z').toISOString(),
      updatedAt: new Date('2026-06-22T21:30:00Z').toISOString()
    },
    {
      id: 'issue-4',
      title: 'Garbage overflow at Malviya Nagar Sector 3',
      description: 'Community trash container has not been cleared for 5 days. Dogs and cows scattering it everywhere, terrible smell.',
      category: 'Garbage & Waste',
      severity: 'high',
      priorityScore: 65,
      status: 'Resolved',
      lat: 26.8530,
      lng: 75.8040,
      addressText: 'Sector 3 Market Gate, Malviya Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-sanitation',
      duplicateCount: 2,
      verificationCount: 4,
      isUrgent: false,
      createdAt: new Date('2026-06-15T07:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-17T16:00:00Z').toISOString(),
      resolvedAt: new Date('2026-06-17T16:00:00Z').toISOString(),
      resolutionProofUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop',
      resolutionNotes: 'Trash completely cleared and area disinfected by Sanitation Team B.'
    },
    {
      id: 'issue-5',
      title: 'Drainage block in Bari Path',
      description: 'Heavy sewage backup near house 12. Overflowing onto the main road creating extremely unhygienic conditions.',
      category: 'Drainage / Sewage',
      severity: 'critical',
      priorityScore: 75,
      status: 'Closed',
      lat: 26.9200,
      lng: 75.8200,
      addressText: 'Near House 12, Bari Path, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-drainage',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: true,
      createdAt: new Date('2026-06-10T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-12T15:00:00Z').toISOString(),
      resolvedAt: new Date('2026-06-11T17:00:00Z').toISOString(),
      closedAt: new Date('2026-06-12T15:00:00Z').toISOString(),
      resolutionProofUrl: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500&auto=format&fit=crop',
      resolutionNotes: 'Super-sucker machine deployed to clear the master drain clog. Blockage removed successfully.'
    },
    {
      id: 'issue-6',
      title: 'Broken park bench in C-Scheme',
      description: 'Stone bench broken in half in Central Kids Park, C-Scheme. Exposed rebar is sharp and dangerous for playing kids.',
      category: 'Public Infrastructure / Other',
      severity: 'medium',
      priorityScore: 40,
      status: 'Verified',
      lat: 26.9100,
      lng: 75.8000,
      addressText: 'Central Kids Park, C-Scheme, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier2', name: 'Neha Singh', email: 'verifier2@demo.com' },
      assignedDepartmentId: 'dept-pworks',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: false,
      createdAt: new Date('2026-06-21T09:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-21T18:00:00Z').toISOString()
    },
    {
      id: 'issue-7',
      title: 'Damaged pedestrian pathway near Mansarovar',
      description: 'Slab missing on the footbridge. Pedestrians can fall into the open storm drain below.',
      category: 'Road Damage / Pothole',
      severity: 'high',
      priorityScore: 45,
      status: 'Assigned',
      lat: 26.8600,
      lng: 75.7600,
      addressText: 'Mansarovar Metro Footbridge Lane, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier3', name: 'Rahul Verma', email: 'verifier3@demo.com' },
      assignedDepartmentId: 'dept-road',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: false,
      createdAt: new Date('2026-06-20T11:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-21T10:00:00Z').toISOString()
    },
    {
      id: 'issue-8',
      title: 'Minor pipe leak in Malviya Nagar',
      description: 'Water dripping from joint on the secondary supply line on Road 4, Sector 7.',
      category: 'Water Leakage',
      severity: 'low',
      priorityScore: 35,
      status: 'AI Reviewed',
      lat: 26.8540,
      lng: 75.8050,
      addressText: 'Road 4, Sector 7, Malviya Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier2', name: 'Neha Singh', email: 'verifier2@demo.com' },
      assignedDepartmentId: 'dept-water',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date('2026-06-22T08:30:00Z').toISOString(),
      updatedAt: new Date('2026-06-22T08:35:00Z').toISOString()
    },
    {
      id: 'issue-9',
      title: 'Completely dark street on Tonk Road',
      description: 'All overhead streetlights failed on Tonk Road service lane over a 200m stretch. Extremely dark and prone to crime.',
      category: 'Streetlight Problem',
      severity: 'high',
      priorityScore: 60,
      status: 'Verified',
      lat: 26.8720,
      lng: 75.7910,
      addressText: 'Tonk Road Block B Service Lane, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier3', name: 'Rahul Verma', email: 'verifier3@demo.com' },
      assignedDepartmentId: 'dept-electrical',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: false,
      createdAt: new Date('2026-06-21T21:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-22T09:00:00Z').toISOString()
    },
    {
      id: 'issue-10',
      title: 'Construction debris on road in Vaishali Nagar',
      description: 'A builder has dumped a massive pile of sand and bricks on Lane 2, blocking half the roadway.',
      category: 'Garbage & Waste',
      severity: 'medium',
      priorityScore: 45,
      status: 'Awaiting Verification',
      lat: 26.9010,
      lng: 75.7420,
      addressText: 'Lane 2, Hanuman Nagar, Vaishali Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-sanitation',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date('2026-06-22T14:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-22T14:00:00Z').toISOString()
    },
    {
      id: 'issue-11',
      title: 'Open manhole on Bari Path',
      description: 'Cover is completely missing from a deep sewer manhole on the pedestrian walkway. Lethal trap for walkers, needs immediate barricading.',
      category: 'Drainage / Sewage',
      severity: 'critical',
      priorityScore: 90,
      status: 'In Progress',
      lat: 26.9210,
      lng: 75.8210,
      addressText: 'Bari Path Market Road, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier2', name: 'Neha Singh', email: 'verifier2@demo.com' },
      assignedDepartmentId: 'dept-drainage',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: true,
      createdAt: new Date('2026-06-19T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-20T10:00:00Z').toISOString()
    },
    {
      id: 'issue-12',
      title: 'Damaged bus stop shelter near Mansarovar',
      description: 'Roof panels of the local bus shelter got ripped off in high winds. Passengers have no shade or rain cover.',
      category: 'Public Infrastructure / Other',
      severity: 'medium',
      priorityScore: 50,
      status: 'Resolved',
      lat: 26.8610,
      lng: 75.7620,
      addressText: 'Mansarovar Sector 4 Bus Stop, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-pworks',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: false,
      createdAt: new Date('2026-06-14T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-16T15:00:00Z').toISOString(),
      resolvedAt: new Date('2026-06-16T15:00:00Z').toISOString(),
      resolutionProofUrl: 'https://images.unsplash.com/photo-1570126618983-dd758410c25a?w=500&auto=format&fit=crop',
      resolutionNotes: 'Brand new sheet metal roof panels installed on the bus shelter.'
    },
    {
      id: 'issue-13',
      title: 'Sewer overflow in C-Scheme',
      description: 'A major commercial sewer line is overflowing. Gushing out foul-smelling black water onto Subhash Marg.',
      category: 'Drainage / Sewage',
      severity: 'high',
      priorityScore: 78,
      status: 'Awaiting Verification',
      lat: 26.9120,
      lng: 75.8020,
      addressText: 'Subhash Marg, C-Scheme, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier3', name: 'Rahul Verma', email: 'verifier3@demo.com' },
      assignedDepartmentId: 'dept-drainage',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: true,
      createdAt: new Date('2026-06-22T17:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-22T17:00:00Z').toISOString()
    },
    {
      id: 'issue-14',
      title: 'Fallen tree block on street in Malviya Nagar',
      description: 'A massive gulmohar tree fell during the storm, blocking both lanes of road 12. Cars are turning back.',
      category: 'Road Damage / Pothole',
      severity: 'high',
      priorityScore: 85,
      status: 'In Progress',
      lat: 26.8520,
      lng: 75.8020,
      addressText: 'Road 12, Malviya Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-citizen', name: 'John Citizen', email: 'citizen@demo.com' },
      assignedDepartmentId: 'dept-road',
      assignedStaffId: 'user-authority',
      assignedStaffName: 'Raj Sharma',
      duplicateCount: 0,
      verificationCount: 3,
      isUrgent: true,
      createdAt: new Date('2026-06-19T16:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-20T09:00:00Z').toISOString()
    },
    {
      id: 'issue-15',
      title: 'Leaking overhead water tank valve in Vaishali Nagar',
      description: 'Primary public overhead tank valve is spraying a jet of high-pressure water onto nearby electric cables. Urgent repair required.',
      category: 'Water Leakage',
      severity: 'high',
      priorityScore: 40,
      status: 'Reported',
      lat: 26.8980,
      lng: 75.7380,
      addressText: 'Sector 5 Water Tank, Vaishali Nagar, Jaipur, Rajasthan',
      createdBy: { id: 'user-verifier', name: 'Vikram Verifier', email: 'verifier@demo.com' },
      assignedDepartmentId: 'dept-water',
      duplicateCount: 0,
      verificationCount: 0,
      isUrgent: false,
      createdAt: new Date('2026-06-23T06:00:00Z').toISOString(),
      updatedAt: new Date('2026-06-23T06:00:00Z').toISOString()
    }
  ],
  media: [
    {
      id: 'media-1',
      issueId: 'issue-1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&auto=format&fit=crop',
      uploadedBy: 'user-citizen',
      createdAt: new Date('2026-06-20T08:00:00Z').toISOString()
    },
    {
      id: 'media-2',
      issueId: 'issue-2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop',
      uploadedBy: 'user-citizen',
      createdAt: new Date('2026-06-18T09:15:00Z').toISOString()
    },
    {
      id: 'media-3',
      issueId: 'issue-3',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop',
      uploadedBy: 'user-citizen',
      createdAt: new Date('2026-06-22T21:30:00Z').toISOString()
    }
  ],
  verifications: [
    {
      id: 'ver-1',
      issueId: 'issue-2',
      verifierId: 'user-verifier',
      verifierName: 'Vikram Verifier',
      result: 'confirm',
      confidence: 1.0,
      verifierWeightAtTime: 1.3,
      createdAt: new Date('2026-06-18T10:00:00Z').toISOString()
    },
    {
      id: 'ver-2',
      issueId: 'issue-2',
      verifierId: 'user-verifier2',
      verifierName: 'Neha Singh',
      result: 'confirm',
      confidence: 0.9,
      verifierWeightAtTime: 1.2,
      createdAt: new Date('2026-06-18T11:30:00Z').toISOString()
    },
    {
      id: 'ver-3',
      issueId: 'issue-2',
      verifierId: 'user-verifier3',
      verifierName: 'Rahul Verma',
      result: 'confirm',
      confidence: 0.9,
      verifierWeightAtTime: 1.1,
      createdAt: new Date('2026-06-18T12:00:00Z').toISOString()
    }
  ],
  comments: [
    {
      id: 'comm-1',
      issueId: 'issue-2',
      authorId: 'user-verifier',
      authorName: 'Vikram Verifier',
      authorRole: 'verifier',
      content: 'Confirming that traffic is completely jammed near the flyover because of this burst. Please avoid this route.',
      createdAt: new Date('2026-06-18T10:05:00Z').toISOString()
    },
    {
      id: 'comm-2',
      issueId: 'issue-2',
      authorId: 'user-authority',
      authorName: 'Raj Sharma',
      authorRole: 'authority',
      content: 'Water supply valve shut down. Dispatched repair crew with pipe replacement fittings. ETA on-site 30 minutes.',
      createdAt: new Date('2026-06-19T11:05:00Z').toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      recipientId: 'user-citizen',
      type: 'AI_CLASSIFIED',
      message: 'Your report "Large pothole near VGU Main Gate" has been reviewed by our AI system and routed to Road Maintenance.',
      relatedIssueId: 'issue-1',
      read: false,
      createdAt: new Date('2026-06-20T08:05:00Z').toISOString()
    },
    {
      id: 'notif-2',
      recipientId: 'user-citizen',
      type: 'STATUS_CHANGE',
      message: 'Your report "Water main burst on Tonk Road" is now In Progress by officer Raj Sharma.',
      relatedIssueId: 'issue-2',
      read: true,
      createdAt: new Date('2026-06-19T11:00:00Z').toISOString()
    },
    {
      id: 'notif-3',
      recipientId: 'user-citizen',
      type: 'STATUS_CHANGE',
      message: 'Your report "Garbage overflow at Malviya Nagar Sector 3" has been resolved. Please confirm or reopen.',
      relatedIssueId: 'issue-4',
      read: false,
      createdAt: new Date('2026-06-17T16:00:00Z').toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      actorId: 'user-admin',
      actorName: 'Ananya Admin',
      action: 'SYSTEM_BOOT',
      entityType: 'System',
      entityId: 'main',
      createdAt: new Date('2026-06-01T00:00:00Z').toISOString()
    }
  ],
  issueStatusHistories: [
    {
      id: 'hist-1',
      issueId: 'issue-1',
      fromStatus: 'None',
      toStatus: 'Reported',
      changedBy: { id: 'user-citizen', name: 'John Citizen', role: 'citizen' },
      note: 'Issue submitted via citizen app.',
      createdAt: new Date('2026-06-20T08:00:00Z').toISOString()
    },
    {
      id: 'hist-2',
      issueId: 'issue-1',
      fromStatus: 'Reported',
      toStatus: 'AI Reviewed',
      changedBy: { id: 'user-admin', name: 'AI Classifier', role: 'admin' },
      note: 'AI classified as Road Damage / Pothole, severity: high.',
      createdAt: new Date('2026-06-20T08:02:00Z').toISOString()
    },
    {
      id: 'hist-3',
      issueId: 'issue-1',
      fromStatus: 'AI Reviewed',
      toStatus: 'Awaiting Verification',
      changedBy: { id: 'user-admin', name: 'AI Classifier', role: 'admin' },
      note: 'Queue status: pending verifier confirmations.',
      createdAt: new Date('2026-06-20T08:05:00Z').toISOString()
    }
  ]
};

// Check if file exists, if not write initial schema
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2), 'utf-8');
}

export function readDb(): DatabaseSchema {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading database file, resetting to initialSchema:', error);
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2), 'utf-8');
    return initialSchema;
  }
}

export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    // Sync with Firestore in the background
    syncToFirestore(data).catch(err => {
      console.error('Error background-syncing to Firestore:', err);
    });
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

export async function syncToFirestore(db: DatabaseSchema): Promise<void> {
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: "gen-lang-client-0358631232"
      });
    }
    const firestore = getFirestore();
    const collections = [
      { name: 'users', items: db.users },
      { name: 'issues', items: db.issues },
      { name: 'media', items: db.media },
      { name: 'verifications', items: db.verifications },
      { name: 'comments', items: db.comments },
      { name: 'notifications', items: db.notifications },
      { name: 'departments', items: db.departments },
      { name: 'badges', items: db.badges },
      { name: 'auditLogs', items: db.auditLogs },
      { name: 'issueStatusHistories', items: db.issueStatusHistories }
    ];

    for (const col of collections) {
      const batch = firestore.batch();
      let count = 0;
      for (const item of col.items) {
        if (!item.id) continue;
        const docRef = firestore.collection(col.name).doc(item.id);
        batch.set(docRef, item);
        count++;
        if (count === 400) {
          await batch.commit();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    }
    console.log('Successfully synced database to Firestore.');
  } catch (err) {
    console.error('Error writing data to Firestore:', err);
  }
}

export async function initFirebaseSync(): Promise<void> {
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: "gen-lang-client-0358631232"
      });
    }
    const firestore = getFirestore();
    
    // Check if the 'users' collection exists and has documents to determine if Firestore is seeded
    const usersSnap = await firestore.collection('users').limit(1).get();
    if (usersSnap.empty) {
      console.log('Firestore is empty. Seeding Firestore with initial schema from db.json...');
      const localDb = readDb();
      await syncToFirestore(localDb);
      console.log('Firestore seeding completed successfully.');
      return;
    }

    console.log('Firestore contains data. Syncing local db.json with Firestore...');
    const collections = [
      'users', 'issues', 'media', 'verifications', 'comments', 
      'notifications', 'departments', 'badges', 'auditLogs', 'issueStatusHistories'
    ];
    
    const loadedDb: Partial<DatabaseSchema> = {};
    for (const col of collections) {
      const snap = await firestore.collection(col).get();
      const list: any[] = [];
      snap.forEach(doc => {
        list.push({ ...doc.data() });
      });
      (loadedDb as any)[col] = list;
    }

    // Save to local db.json
    fs.writeFileSync(DB_FILE, JSON.stringify(loadedDb, null, 2), 'utf-8');
    console.log('Local db.json successfully overwritten with Firestore data.');
  } catch (err) {
    console.error('Failed to sync with Firestore on startup, using local db.json:', err);
  }
}
