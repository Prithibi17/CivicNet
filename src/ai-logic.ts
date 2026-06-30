import { Issue, DatabaseSchema, User } from './shared-types.js';

// 8.1 Classification keyword-matching
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Road Damage / Pothole': ['pothole', 'crack', 'road', 'asphalt', 'pavement', 'sinkhole', 'pathway', 'lane', 'street', 'potholes', 'sidewalk'],
  'Water Leakage': ['leak', 'pipe', 'burst', 'flooding', 'water main', 'valve', 'spray', 'faucet', 'dripping', 'water leakage'],
  'Streetlight Problem': ['streetlight', 'lamp', 'light pole', 'dark', 'outage', 'electricity', 'power', 'flickering', 'bulb'],
  'Garbage & Waste': ['garbage', 'trash', 'waste', 'dump', 'overflow', 'bin', 'debris', 'rubbish', 'litter', 'scattered'],
  'Drainage / Sewage': ['drain', 'sewage', 'clog', 'waterlogging', 'manhole', 'sewer', 'foul', 'smell', 'gutter', 'drainage'],
  'Traffic & Road Signs': ['sign', 'traffic light', 'divider', 'zebra crossing', 'speed limit', 'reflector', 'signal', 'speed bump', 'bollard'],
  'Parks & Recreation': ['park', 'playground', 'bench', 'slide', 'swing', 'tree', 'branch', 'grass', 'lawn', 'garden'],
  'Stray Animals / Safety': ['stray', 'dog', 'cow', 'animal', 'pack', 'cattle', 'rabid', 'bite', 'dangerous animal'],
  'Air & Noise Pollution': ['smoke', 'smog', 'noise', 'loudspeaker', 'industrial', 'pollution', 'fumes', 'dust', 'soot'],
  'Vandalism & Graffiti': ['graffiti', 'vandalism', 'spray paint', 'broken window', 'damaged wall', 'heritage', 'monument', 'destroyed'],
  'Public Transit & Bus Stops': ['bus stop', 'shelter', 'metro', 'transit', 'bus shelter', 'timetable', 'platform'],
  'Public Health & Encroachments': ['encroachment', 'encroached', 'vendor', 'hawker', 'medical waste', 'footpath blocked', 'illegal construction']
};

export function classifyIssue(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  let maxMatches = -1;
  let bestCategory = 'Road Damage / Pothole';

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const count = (text.match(regex) || []).length;
      matches += count;
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// 8.2 Severity escalation
const BASELINE_SEVERITIES: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  'Road Damage / Pothole': 'medium',
  'Water Leakage': 'medium',
  'Streetlight Problem': 'low',
  'Garbage & Waste': 'low',
  'Drainage / Sewage': 'medium',
  'Traffic & Road Signs': 'medium',
  'Parks & Recreation': 'low',
  'Stray Animals / Safety': 'high',
  'Air & Noise Pollution': 'low',
  'Vandalism & Graffiti': 'low',
  'Public Transit & Bus Stops': 'low',
  'Public Health & Encroachments': 'medium'
};

const URGENCY_KEYWORDS = [
  'dangerous',
  'blocking',
  'overflow',
  'sewage',
  'accident',
  'children',
  'school',
  'hospital',
  'deadly',
  'hazard',
  'risk',
  'injured'
];

export function calculateSeverity(
  category: string,
  title: string,
  description: string,
  mediaCount: number
): 'low' | 'medium' | 'high' | 'critical' {
  const baseline = BASELINE_SEVERITIES[category] || 'low';
  let level = 0; // 0=low, 1=medium, 2=high, 3=critical

  if (baseline === 'medium') level = 1;
  else if (baseline === 'high') level = 2;
  else if (baseline === 'critical') level = 3;

  const text = `${title} ${description}`.toLowerCase();
  const hasUrgency = URGENCY_KEYWORDS.some(word => text.includes(word));

  if (hasUrgency) {
    level = Math.min(level + 1, 3);
  }

  if (mediaCount >= 3) {
    level = Math.min(level + 1, 3);
  }

  const levels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  return levels[level];
}

// Haversine Distance (meters)
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

// Tokenized Jaccard Similarity (text overlap)
export function jaccardSimilarity(str1: string, str2: string): number {
  const getTokens = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
  };

  const setA = getTokens(str1);
  const setB = getTokens(str2);

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

// 8.4 Duplicate detection
export function checkDuplicates(
  newIssue: { lat: number; lng: number; category: string; title: string; description: string },
  existingIssues: Issue[]
): {
  duplicateOfId?: string;
  autoLinked: boolean;
  candidates: { id: string; title: string; similarity: number; distance: number }[];
} {
  const candidates: { id: string; title: string; similarity: number; distance: number }[] = [];
  let autoLinkedId: string | undefined;

  // Filter to active, non-closed, non-duplicate issues created in past 14 days
  const activeIssues = existingIssues.filter(issue => {
    if (issue.status === 'Closed' || issue.duplicateOfIssueId) return false;
    const daysDiff = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 14;
  });

  for (const issue of activeIssues) {
    if (issue.category !== newIssue.category) continue;

    const distance = haversineDistance(newIssue.lat, newIssue.lng, issue.lat, issue.lng);
    if (distance > 50) continue; // must be <= 50m

    const newText = `${newIssue.title} ${newIssue.description}`;
    const oldText = `${issue.title} ${issue.description}`;
    const similarity = jaccardSimilarity(newText, oldText);

    if (similarity >= 0.4) {
      candidates.push({
        id: issue.id,
        title: issue.title,
        similarity,
        distance
      });

      // Check auto-link conditions: <=15m, similarity >=0.6, within 3 days
      const daysDiff = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (distance <= 15 && similarity >= 0.6 && daysDiff <= 3 && !autoLinkedId) {
        autoLinkedId = issue.id;
      }
    }
  }

  return {
    duplicateOfId: autoLinkedId,
    autoLinked: !!autoLinkedId,
    candidates
  };
}

// 8.3 Priority score (0-100)
export function calculatePriorityScore(
  issue: Issue,
  existingIssues: Issue[]
): { score: number; isUrgent: boolean } {
  // severity_weight: low=25, medium=50, high=75, critical=100
  let severityWeight = 25;
  if (issue.severity === 'medium') severityWeight = 50;
  else if (issue.severity === 'high') severityWeight = 75;
  else if (issue.severity === 'critical') severityWeight = 100;

  // duplicate_count_weight: min(duplicate_reports_linked * 20, 100)
  const duplicateCountWeight = Math.min((issue.duplicateCount || 0) * 20, 100);

  // verification_weight: min(verification_count * 25, 100)
  const verificationWeight = Math.min((issue.verificationCount || 0) * 25, 100);

  // age_weight: min(days_open * 5, 100)
  const daysOpen = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageWeight = Math.min(Math.max(daysOpen, 0) * 5, 100);

  // area_density_weight: count of other open issues within 500m, min(count*10, 100)
  const openIssuesInArea = existingIssues.filter(other => {
    if (other.id === issue.id || other.status === 'Closed' || other.duplicateOfIssueId) return false;
    const dist = haversineDistance(issue.lat, issue.lng, other.lat, other.lng);
    return dist <= 500;
  });
  const areaDensityWeight = Math.min(openIssuesInArea.length * 10, 100);

  const priorityScore = Math.round(
    severityWeight * 0.4 +
    duplicateCountWeight * 0.2 +
    verificationWeight * 0.2 +
    ageWeight * 0.1 +
    areaDensityWeight * 0.1
  );

  return {
    score: priorityScore,
    isUrgent: priorityScore >= 75
  };
}

// 8.5 Verification weighting
export function getVerifierWeight(trustScore: number): number {
  // clamp(trust_score / 50, 0.2, 1.5)
  return Math.min(Math.max(trustScore / 50, 0.2), 1.5);
}
