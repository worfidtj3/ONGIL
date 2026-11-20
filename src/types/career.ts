export type NavTab = 'home' | 'assessment' | 'counseling' | 'blueprint' | 'stats';

export type UserStage =
  | '저학년 탐색기 (1~2학년)'
  | '전공 심화·대외활동기 (3학년)'
  | '졸업 예정·인턴 준비기 (4학년)'
  | '실전 취업 준비생·졸업생';

export type AxisKey =
  | 'inquiry'
  | 'creativity'
  | 'people'
  | 'execution'
  | 'leadership'
  | 'technical';

export interface AxisScore {
  key: AxisKey;
  label: string;
  score: number;
  comment: string;
}

export interface AssessmentInput {
  nickname: string;
  stage: UserStage;
  major: string;
  workPreference: '혼자 깊이 파고드는 몰입형' | '팀과 활발히 소통하는 협업형' | '상황에 따라 유연하게 조율하는 균형형';
  answers: Record<string, number>;
  selectedValues: string[];
  currentWorry: string;
}

export interface RecommendedRole {
  roleName: string;
  category: string;
  fitScore: number;
  fitReason: string;
  coreCompetencies: string[];
  starterAction: string;
}

export interface DiagnosisReport {
  generatedAt: string;
  personaTitle: string;
  personaSummary: string;
  axes: AxisScore[];
  strengthKeywords: string[];
  watchOut: string;
  recommendedRoles: RecommendedRole[];
  suggestedQuestions: string[];
}

export type CounselingMode = 'explore' | 'major' | 'strategy' | 'mental';

export interface CounselingMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface CounselingSession {
  id: string;
  title: string;
  mode: CounselingMode;
  targetRole: string;
  createdAt: string;
  updatedAt: string;
  messages: CounselingMessage[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  dueLabel: string;
}

export interface RoadmapPhase {
  id: string;
  phaseTitle: string;
  periodLabel: string;
  summary: string;
  items: MilestoneItem[];
}

export interface SavedInsight {
  id: string;
  content: string;
  sourceSessionTitle: string;
  createdAt: string;
}

export interface CareerBlueprint {
  targetRole: string;
  updatedAt: string;
  reflectionMemo: string;
  phases: RoadmapPhase[];
  insights: SavedInsight[];
}

export interface OngilWorkspaceState {
  version: number;
  assessmentInput: AssessmentInput | null;
  diagnosisReport: DiagnosisReport | null;
  sessions: CounselingSession[];
  activeSessionId: string | null;
  blueprint: CareerBlueprint;
  isSampleData: boolean;
}

export type StatsStageFilter = 'all' | UserStage;

export interface ModeStatItem {
  mode: CounselingMode;
  label: string;
  count: number;
  percentage: number;
}

export interface TopWorryItem {
  rank: number;
  topic: string;
  sampleQuestion: string;
  sharePercent: number;
  count: number;
  insightNote: string;
}

export interface PopularRoleStat {
  rank: number;
  roleName: string;
  category: string;
  sharePercent: number;
  avgFitScore: number;
}

export interface PeerAxisBenchmark {
  key: AxisKey;
  label: string;
  avgScore: number;
}

export interface CareerStatsResponse {
  stage: StatsStageFilter;
  updatedAt: string;
  summary: {
    totalCounselings: number;
    totalDiagnoses: number;
    totalRoadmaps: number;
    blueprintConversionRate: number;
    topModeLabel: string;
    topModePercent: number;
    topRoleName: string;
  };
  modeDistribution: ModeStatItem[];
  topWorries: TopWorryItem[];
  popularRoles: PopularRoleStat[];
  peerAxes: PeerAxisBenchmark[];
  stageInsights: Array<{
    stageLabel: string;
    primaryFocus: string;
    topSharePercent: number;
  }>;
}

