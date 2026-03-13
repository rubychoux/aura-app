// ─── User & Auth ────────────────────────────────────────────────────────────

export type SkinType = '지성' | '건성' | '복합성' | '민감성';
export type SkinConcern =
  | '여드름' | '블랙헤드' | '모공' | '색소침착' | '건조함' | '트러블 후 자국';
export type AcneType = '화농성' | '좁쌀' | '모낙염' | '혼합형';
export type RoutineComplexity = '없음' | '기초만' | '5단계 이상';

export interface UserProfile {
  id: string;
  phone: string;
  skinType: SkinType | null;
  concerns: SkinConcern[];
  acneType: AcneType | null;
  routineComplexity: RoutineComplexity | null;
  isPremium: boolean;
  skinDataConsent: boolean;         // PIPA: biometric data consent
  datasetContributionConsent: boolean; // PIPA: optional dataset contribution
  createdAt: string;
}

// ─── Scans ───────────────────────────────────────────────────────────────────

export type IngredientFlag = 'safe' | 'caution' | 'avoid';
export type FlagType = '코메도제닉' | '자극성' | '향료' | '알코올';

export interface Ingredient {
  nameKo: string;
  nameEn: string;
  inciName?: string;
  flag: IngredientFlag;
  flagTypes: FlagType[];
  notes?: string;
}

export interface IngredientScanResult {
  id: string;
  userId: string;
  productName?: string;
  imageUrl?: string;
  compatibilityScore: 'safe' | 'caution' | 'avoid';
  compatibilityReason: string;
  flaggedIngredients: Ingredient[];
  safeIngredients: Ingredient[];
  createdAt: string;
}

export type FaceZone = '이마' | '볼' | '턱' | '코' | '턱 주변';

export interface ZoneResult {
  zone: FaceZone;
  severity: 1 | 2 | 3 | 4 | 5;
  acneType?: AcneType;
}

export interface FaceScanResult {
  id: string;
  userId: string;
  imageUrl?: string;
  zones: ZoneResult[];
  overallAcneType: AcneType;
  overallSeverity: number;
  recommendations: string[];
  createdAt: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export type DietTag = '고당' | '유제품' | '글루텐' | '음주' | '건강식';
export type CyclePhase = '생리기' | '배란기' | '황체기';
export type ProcedureType = '보톡스' | '레이저' | '필링' | '물광주사' | '기타';

export interface Supplement {
  name: string;
  dosage?: string;
}

export interface Procedure {
  id: string;
  userId: string;
  type: ProcedureType;
  clinic?: string;
  date: string;
  notes?: string;
  beforePhotoUrl?: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string;                      // YYYY-MM-DD
  sleepHours?: number;               // 4–10
  stressLevel?: 1 | 2 | 3 | 4 | 5;
  dietNotes?: string;
  dietTags?: DietTag[];
  cycleDay?: number;                 // 1–28
  cyclePhase?: CyclePhase;
  supplements?: Supplement[];
  procedures?: Procedure[];
  memo?: string;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export type InsightConfidence = '분석 중' | '패턴 감지됨' | '높은 신뢰도';

export interface Insight {
  id: string;
  userId: string;
  patternText: string;
  supportingData?: object;
  confidence: InsightConfidence;
  isUseful?: boolean;
  isDismissed: boolean;
  generatedAt: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OTPVerify: { phone: string };
  SkinQuiz: undefined;
  PIAPConsent: undefined;
  NotificationPermission: undefined;
  OnboardingComplete: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Log: undefined;
  Insights: undefined;
  Shop: undefined;
};

export type ScanStackParamList = {
  ScanHub: undefined;
  IngredientCamera: undefined;
  IngredientResult: { scanId: string };
  FaceScanCamera: undefined;
  FaceScanResult: { scanId: string };
  ScanHistory: undefined;
};

export type LogStackParamList = {
  LogHub: undefined;
  DailyLogEntry: { date?: string };
  LogDetail: { logId: string };
  ProcedureHistory: undefined;
};

export type InsightsStackParamList = {
  InsightsFeed: undefined;
  InsightDetail: { insightId: string };
  BreakoutPredictionDetail: undefined;
  SkinProgress: undefined;
};
