import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('api key not valid') ||
    lower.includes('403')
  ) {
    return {
      status: 403,
      message:
        'Gemini API 키가 유효하지 않거나 설정되지 않았습니다. Settings > Secrets 패널에서 GEMINI_API_KEY를 확인해 주세요.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        '현재 API 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 Settings > Secrets 패널에서 API 키 플랜을 확인해 주세요.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: '요청한 AI 모델을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.',
    };
  }
  return {
    status: 500,
    message: `AI 응답 처리 중 오류가 발생했습니다: ${rawMessage}`,
  };
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isNonRetryable =
        msg.includes('api_key') ||
        msg.includes('permission_denied') ||
        msg.includes('400') ||
        msg.includes('403') ||
        msg.includes('404');
      if (isNonRetryable || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

interface AxisSummaryPayload {
  key: string;
  label: string;
  rawScore: number;
}

interface DiagnosisRequestBody {
  nickname: string;
  stage: string;
  major: string;
  workPreference: string;
  axisAverages: AxisSummaryPayload[];
  selectedValues: string[];
  currentWorry: string;
}

interface CounselingMessagePayload {
  role: 'user' | 'model';
  text: string;
}

interface CounselingRequestBody {
  messages: CounselingMessagePayload[];
  mode: 'explore' | 'major' | 'strategy' | 'mental';
  targetRole?: string;
  userProfile?: {
    nickname?: string;
    stage?: string;
    major?: string;
  };
  diagnosisSummary?: {
    personaTitle?: string;
    personaSummary?: string;
    strengthKeywords?: string[];
    topRoles?: string[];
  };
}

interface RoadmapRequestBody {
  targetRole: string;
  stage?: string;
  major?: string;
  personaTitle?: string;
  savedInsights?: string[];
}

const MODE_LABELS: Record<CounselingRequestBody['mode'], string> = {
  explore: '직무 탐색 및 방향 설정',
  major: '전공·복수전공 연결 전략',
  strategy: '인턴·포트폴리오·취준 실전 전략',
  mental: '진로 불안 및 번아웃 케어',
};

const STATS_FILE_PATH = '/tmp/ongil-cohort-stats-v1.json';

interface StageDataset {
  diagnoses: number;
  roadmaps: number;
  modeCounts: Record<'explore' | 'major' | 'strategy' | 'mental', number>;
  peerAxes: Array<{ key: string; label: string; avgScore: number }>;
  topWorries: Array<{
    topic: string;
    sampleQuestion: string;
    sharePercent: number;
    insightNote: string;
  }>;
  popularRoles: Array<{
    roleName: string;
    category: string;
    sharePercent: number;
    avgFitScore: number;
  }>;
}

const INITIAL_STAGE_STATS: Record<string, StageDataset> = {
  '저학년 탐색기 (1~2학년)': {
    diagnoses: 318,
    roadmaps: 196,
    modeCounts: { explore: 198, major: 154, strategy: 58, mental: 76 },
    peerAxes: [
      { key: 'inquiry', label: '탐구·분석', avgScore: 71 },
      { key: 'creativity', label: '창의·표현', avgScore: 74 },
      { key: 'people', label: '사람·소통', avgScore: 76 },
      { key: 'execution', label: '체계·실행', avgScore: 63 },
      { key: 'leadership', label: '주도·전략', avgScore: 62 },
      { key: 'technical', label: '기술·구현', avgScore: 65 },
    ],
    topWorries: [
      {
        topic: '전공 적성과 흥미 탐색',
        sampleQuestion: '현재 전공이 적성에 맞는지 모르겠는데, 복수전공이나 전과를 고민할 때 어떤 기준을 보면 좋을까요?',
        sharePercent: 34,
        insightNote: '1~2학년 상담자의 3명 중 1명은 전공과 실제 희망 직무 간의 연결고리를 가장 먼저 묻습니다.',
      },
      {
        topic: '대외활동·동아리 선택 기준',
        sampleQuestion: '저학년 때 의미 있는 대외활동이나 학회·동아리를 고르는 기준이 궁금합니다.',
        sharePercent: 25,
        insightNote: '스펙 나열보다 자신의 성향을 검증할 작은 실험 경험을 찾는 질문이 많습니다.',
      },
      {
        topic: '막연한 미래와 방향 상실감',
        sampleQuestion: '주변 친구들은 벌써 진로를 정한 것 같은데 저만 아무 방향이 없는 것 같아 불안해요.',
        sharePercent: 18,
        insightNote: '비교에서 오는 조급함을 덜어내고 탐색 루틴을 만드는 케어 상담 비중이 높습니다.',
      },
      {
        topic: '복수전공·부전공 조합 추천',
        sampleQuestion: '인문·사회 전공에 데이터나 소프트웨어 관련 부전공을 섞으면 취업에 실질적 도움이 될까요?',
        sharePercent: 14,
        insightNote: '비전공자의 디지털 역량 결합 전략에 대한 관심이 꾸준히 증가하고 있습니다.',
      },
      {
        topic: '교내 수업 과제 활용법',
        sampleQuestion: '지금 듣는 전공 팀플이나 교양 프로젝트를 나중 포트폴리오로 살릴 수 있을까요?',
        sharePercent: 9,
        insightNote: '초기 경험을 단순 과제로 끝내지 않고 기록으로 남기는 방법에 대한 질문입니다.',
      },
    ],
    popularRoles: [
      { roleName: '서비스 기획자 · PM', category: '기획 · 프로덕트', sharePercent: 24, avgFitScore: 84 },
      { roleName: '브랜드 · 콘텐츠 마케터', category: '마케팅 · 미디어', sharePercent: 22, avgFitScore: 83 },
      { roleName: 'UX/UI 디자이너 · 리서처', category: '디자인 · 리서치', sharePercent: 18, avgFitScore: 81 },
      { roleName: '데이터 애널리스트', category: '데이터 · 분석', sharePercent: 15, avgFitScore: 79 },
      { roleName: '프론트엔드 · 웹 개발자', category: '개발 · 엔지니어링', sharePercent: 12, avgFitScore: 78 },
      { roleName: 'HR · 조직문화 담당자', category: '경영지원 · 피플', sharePercent: 9, avgFitScore: 80 },
    ],
  },
  '전공 심화·대외활동기 (3학년)': {
    diagnoses: 446,
    roadmaps: 318,
    modeCounts: { explore: 248, major: 132, strategy: 214, mental: 94 },
    peerAxes: [
      { key: 'inquiry', label: '탐구·분석', avgScore: 76 },
      { key: 'creativity', label: '창의·표현', avgScore: 72 },
      { key: 'people', label: '사람·소통', avgScore: 75 },
      { key: 'execution', label: '체계·실행', avgScore: 71 },
      { key: 'leadership', label: '주도·전략', avgScore: 70 },
      { key: 'technical', label: '기술·구현', avgScore: 69 },
    ],
    topWorries: [
      {
        topic: '직무 1~2개로 좁히는 기준',
        sampleQuestion: '관심 가는 직무가 2~3개로 겹치는데 4학년 올라가기 전에 하나로 좁혀야 할까요?',
        sharePercent: 31,
        insightNote: '3학년은 탐색을 마무리하고 첫 인턴·프로젝트를 겨냥해 타겟 직무를 좁히는 시기입니다.',
      },
      {
        topic: '공백 없는 인턴·사이드 프로젝트 전략',
        sampleQuestion: '인턴 지원 전에 학교 수업이나 연합 동아리 경험만으로도 서류를 통과할 수 있을까요?',
        sharePercent: 27,
        insightNote: '실무 경험 전 단계에서 교내 프로젝트를 직무 언어로 재구성하는 상담이 많습니다.',
      },
      {
        topic: '전공과 희망 직무의 괴리 해결',
        sampleQuestion: '현재 전공과 다른 직무를 희망하는데, 자소서나 면접에서 어떻게 설득해야 할까요?',
        sharePercent: 19,
        insightNote: '전공 지식 자체보다 문제 해결 방식과 협업 경험을 연결하는 스토리텔링 수요가 큽니다.',
      },
      {
        topic: '휴학 vs 바로 졸업 결정',
        sampleQuestion: '인턴이나 직무 준비를 위해 1학기 정도 휴학하는 게 좋을지, 바로 졸업이 나을지 고민입니다.',
        sharePercent: 13,
        insightNote: '구체적인 산출물 계획이 있는 휴학인지 점검하는 현실적 의사결정 상담이 많습니다.',
      },
      {
        topic: '포트폴리오 첫 케이스 스터디 구성',
        sampleQuestion: '비개발·기획 직무 포트폴리오는 어떤 목차와 분량으로 정리해야 읽기 좋을까요?',
        sharePercent: 10,
        insightNote: '결과 나열이 아닌 문제 정의-가설-검증 구조화에 대한 질문이 집중됩니다.',
      },
    ],
    popularRoles: [
      { roleName: '서비스 기획자 · PM', category: '기획 · 프로덕트', sharePercent: 27, avgFitScore: 86 },
      { roleName: '데이터 애널리스트', category: '데이터 · 분석', sharePercent: 20, avgFitScore: 84 },
      { roleName: 'CRM · 그로스 마케터', category: '마케팅 · 그로스', sharePercent: 18, avgFitScore: 83 },
      { roleName: 'UX 리서처 · CX 기획', category: '프로덕트 · 리서치', sharePercent: 14, avgFitScore: 85 },
      { roleName: '소프트웨어 · 프론트엔드 개발', category: '개발 · 엔지니어링', sharePercent: 12, avgFitScore: 81 },
      { roleName: 'B2B 사업개발 · 전략기획', category: '비즈니스 · 전략', sharePercent: 9, avgFitScore: 80 },
    ],
  },
  '졸업 예정·인턴 준비기 (4학년)': {
    diagnoses: 392,
    roadmaps: 288,
    modeCounts: { explore: 146, major: 64, strategy: 286, mental: 128 },
    peerAxes: [
      { key: 'inquiry', label: '탐구·분석', avgScore: 78 },
      { key: 'creativity', label: '창의·표현', avgScore: 71 },
      { key: 'people', label: '사람·소통', avgScore: 74 },
      { key: 'execution', label: '체계·실행', avgScore: 77 },
      { key: 'leadership', label: '주도·전략', avgScore: 73 },
      { key: 'technical', label: '기술·구현', avgScore: 72 },
    ],
    topWorries: [
      {
        topic: '서류 탈락 원인 점검 및 포트폴리오 개선',
        sampleQuestion: '인턴이나 신입 공고에 지원하고 있는데 서류에서 계속 떨어집니다. 경험 정리 방식의 문제일까요?',
        sharePercent: 33,
        insightNote: '4학년의 가장 큰 고민은 경험의 양보다 "직무 적합성 관점의 문장 구조"입니다.',
      },
      {
        topic: '직무 역량 갭 단기 보완',
        sampleQuestion: '채용공고 우대사항에 있는 SQL, 데이터 분석, 툴 활용 역량을 1~2개월 안에 어디까지 채워야 할까요?',
        sharePercent: 24,
        insightNote: '남은 기간 대비 가장 가성비 높은 역량 증명 방법을 찾는 상담이 집중됩니다.',
      },
      {
        topic: '대기업 공채 vs 스타트업 인턴 선택',
        sampleQuestion: '졸업 유예 후 대기업 공채를 노릴지, 먼저 스타트업 인턴·정규직으로 실무 경력을 쌓을지 고민돼요.',
        sharePercent: 19,
        insightNote: '커리어 첫 출발선의 장단점을 본인의 성향·재무·리스크 허용치와 맞춰 봅니다.',
      },
      {
        topic: '면접 경험 스토리텔링(STAR)',
        sampleQuestion: '동아리나 아르바이트 경험밖에 없는데 면접에서 직무 역량과 어떻게 연결해 답할 수 있을까요?',
        sharePercent: 14,
        insightNote: '소소한 경험에서도 의사결정 근거와 개선 결과를 뽑아내는 연습 수요가 높습니다.',
      },
      {
        topic: '졸업 시즌 압박감과 멘탈 관리',
        sampleQuestion: '졸업이 다가오면서 조급함 때문에 아무것도 손에 잡히지 않아요. 루틴을 어떻게 잡아야 할까요?',
        sharePercent: 10,
        insightNote: '실행 가능한 주간 단위로 목표를 쪼개 심리적 부담을 낮추는 케어가 효과적입니다.',
      },
    ],
    popularRoles: [
      { roleName: '서비스 기획자 · PM', category: '기획 · 프로덕트', sharePercent: 25, avgFitScore: 87 },
      { roleName: '데이터 애널리스트', category: '데이터 · 분석', sharePercent: 21, avgFitScore: 85 },
      { roleName: 'CRM · 퍼포먼스 마케터', category: '마케팅 · 그로스', sharePercent: 19, avgFitScore: 84 },
      { roleName: 'B2B 영업기획 · 사업개발', category: '비즈니스 · 전략', sharePercent: 14, avgFitScore: 82 },
      { roleName: '백엔드 · 프론트엔드 개발자', category: '개발 · 엔지니어링', sharePercent: 12, avgFitScore: 83 },
      { roleName: 'HR · 경영기획 담당자', category: '경영지원 · 피플', sharePercent: 9, avgFitScore: 81 },
    ],
  },
  '실전 취업 준비생·졸업생': {
    diagnoses: 326,
    roadmaps: 242,
    modeCounts: { explore: 104, major: 38, strategy: 252, mental: 168 },
    peerAxes: [
      { key: 'inquiry', label: '탐구·분석', avgScore: 79 },
      { key: 'creativity', label: '창의·표현', avgScore: 72 },
      { key: 'people', label: '사람·소통', avgScore: 73 },
      { key: 'execution', label: '체계·실행', avgScore: 80 },
      { key: 'leadership', label: '주도·전략', avgScore: 74 },
      { key: 'technical', label: '기술·구현', avgScore: 74 },
    ],
    topWorries: [
      {
        topic: '취준 장기화 번아웃 및 자존감 회복',
        sampleQuestion: '취업 준비가 길어지면서 계속 불합격 메일을 받으니 내가 선택한 직무가 맞는지조차 흔들립니다.',
        sharePercent: 32,
        insightNote: '졸업생·취준생 그룹은 전략 상담 못지않게 멘탈·지속 가능성 케어 비중이 높습니다.',
      },
      {
        topic: '지원 직무 피벗(방향 전환) 고민',
        sampleQuestion: '기존에 준비하던 직무에서 인접 직무로 방향을 조금 넓혀 지원해도 괜찮을까요?',
        sharePercent: 25,
        insightNote: '보유한 포트폴리오 자산을 재활용해 인접 직무로 확장하는 현실 전략을 찾습니다.',
      },
      {
        topic: '공백기 설명 및 실무 프로젝트 증명',
        sampleQuestion: '졸업 후 공백 기간을 면접관에게 납득 가능하고 긍정적으로 설명하는 방법이 궁금합니다.',
        sharePercent: 18,
        insightNote: '공백 기간의 학습·사이드 프로젝트 산출물을 구체적 지표로 정리하는 법을 다룹니다.',
      },
      {
        topic: '최종 면접 탈락 후 복기 전략',
        sampleQuestion: '실무 면접이나 임원 면접에서 번번이 아쉽게 떨어지는데 어떤 부분을 점검해야 할까요?',
        sharePercent: 15,
        insightNote: '답변의 진정성과 직무 이해도, 협업 태도 표현을 교정하는 질문이 많습니다.',
      },
      {
        topic: '첫 직장과 연봉·성장성 기준',
        sampleQuestion: '규모가 작더라도 직무 경험이 맞다면 먼저 입사해서 경력을 쌓는 편이 나을까요?',
        sharePercent: 10,
        insightNote: '1~2년 후 커리어 확장성을 기준으로 첫 회사를 고르는 기준을 함께 세웁니다.',
      },
    ],
    popularRoles: [
      { roleName: '서비스 기획 · 프로덕트 오너', category: '기획 · 프로덕트', sharePercent: 24, avgFitScore: 86 },
      { roleName: '데이터 · BI 애널리스트', category: '데이터 · 분석', sharePercent: 22, avgFitScore: 85 },
      { roleName: '마케팅 · 브랜드 전략', category: '마케팅 · 그로스', sharePercent: 18, avgFitScore: 83 },
      { roleName: '프론트엔드 · 풀스택 개발', category: '개발 · 엔지니어링', sharePercent: 15, avgFitScore: 84 },
      { roleName: '사업개발 · 운영 매니저', category: '비즈니스 · 운영', sharePercent: 12, avgFitScore: 82 },
      { roleName: '인사 · 채용 담당자', category: '경영지원 · 피플', sharePercent: 9, avgFitScore: 81 },
    ],
  },
};

function loadStatsStore(): Record<string, StageDataset> {
  try {
    if (fs.existsSync(STATS_FILE_PATH)) {
      const raw = fs.readFileSync(STATS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, StageDataset>;
      if (parsed && typeof parsed === 'object') {
        return { ...INITIAL_STAGE_STATS, ...parsed };
      }
    }
  } catch {
    // Fallback to initial cohort data
  }
  return JSON.parse(JSON.stringify(INITIAL_STAGE_STATS)) as Record<string, StageDataset>;
}

function persistStatsStore(store: Record<string, StageDataset>) {
  try {
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(store), 'utf-8');
  } catch {
    // Ignore read-only filesystem errors cleanly
  }
}

const statsStore = loadStatsStore();

function resolveStageKey(stage?: string): string {
  if (stage && statsStore[stage]) return stage;
  return '전공 심화·대외활동기 (3학년)';
}

function buildAggregatedStats(stageFilter: string) {
  const stageKeys =
    stageFilter === 'all' || !statsStore[stageFilter]
      ? Object.keys(statsStore)
      : [stageFilter];

  let totalDiagnoses = 0;
  let totalRoadmaps = 0;
  const modeTotals: Record<'explore' | 'major' | 'strategy' | 'mental', number> = {
    explore: 0,
    major: 0,
    strategy: 0,
    mental: 0,
  };

  for (const key of stageKeys) {
    const ds = statsStore[key];
    totalDiagnoses += ds.diagnoses;
    totalRoadmaps += ds.roadmaps;
    modeTotals.explore += ds.modeCounts.explore;
    modeTotals.major += ds.modeCounts.major;
    modeTotals.strategy += ds.modeCounts.strategy;
    modeTotals.mental += ds.modeCounts.mental;
  }

  const totalCounselings =
    modeTotals.explore + modeTotals.major + modeTotals.strategy + modeTotals.mental;

  const modeDistribution = (Object.keys(MODE_LABELS) as Array<keyof typeof MODE_LABELS>)
    .map((mode) => ({
      mode,
      label: MODE_LABELS[mode],
      count: modeTotals[mode],
      percentage:
        totalCounselings > 0
          ? Math.round((modeTotals[mode] / totalCounselings) * 100)
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topMode = modeDistribution[0];

  let peerAxes: Array<{ key: string; label: string; avgScore: number }>;
  let topWorries: Array<{
    rank: number;
    topic: string;
    sampleQuestion: string;
    sharePercent: number;
    count: number;
    insightNote: string;
  }>;
  let popularRoles: Array<{
    rank: number;
    roleName: string;
    category: string;
    sharePercent: number;
    avgFitScore: number;
  }>;

  if (stageKeys.length === 1) {
    const ds = statsStore[stageKeys[0]];
    peerAxes = ds.peerAxes;
    topWorries = ds.topWorries.map((w, idx) => ({
      rank: idx + 1,
      ...w,
      count: Math.round((totalCounselings * w.sharePercent) / 100),
    }));
    popularRoles = ds.popularRoles.map((r, idx) => ({
      rank: idx + 1,
      ...r,
    }));
  } else {
    const axisKeys = statsStore['저학년 탐색기 (1~2학년)'].peerAxes;
    peerAxes = axisKeys.map((axis, idx) => {
      const avg = Math.round(
        stageKeys.reduce((sum, k) => sum + statsStore[k].peerAxes[idx].avgScore, 0) /
          stageKeys.length
      );
      return { key: axis.key, label: axis.label, avgScore: avg };
    });

    topWorries = [
      {
        rank: 1,
        topic: '직무 방향 설정 및 복수 후보 비교',
        sampleQuestion: '관심 가는 직무가 여러 개일 때 나에게 가장 잘 맞는 1~2개로 좁히는 기준이 궁금해요.',
        sharePercent: 29,
        count: Math.round(totalCounselings * 0.29),
        insightNote: '전 학년에 걸쳐 "내 성향에 맞는 직무를 어떻게 좁힐 것인가"가 가장 높은 비중을 차지합니다.',
      },
      {
        rank: 2,
        topic: '인턴·포트폴리오·서류 실전 전략',
        sampleQuestion: '인턴이나 직무 경험이 부족할 때 교내 프로젝트를 어떻게 포트폴리오로 정리하면 좋을까요?',
        sharePercent: 24,
        insightNote: '3학년 후반부터 취준생까지 실무 경험을 대체할 프로젝트 구조화 질문이 급증합니다.',
        count: Math.round(totalCounselings * 0.24),
      },
      {
        rank: 3,
        topic: '전공과 희망 직무 연결 및 복수전공',
        sampleQuestion: '현재 전공과 다른 직무를 준비할 때 복수전공이나 부전공이 꼭 필요할까요?',
        sharePercent: 19,
        count: Math.round(totalCounselings * 0.19),
        insightNote: '전공의 한계를 걱정하기보다 기존 강점을 직무 맥락으로 번역하는 전략이 효과적입니다.',
      },
      {
        rank: 4,
        topic: '취준 장기화 불안 및 번아웃 회복',
        sampleQuestion: '주변과 비교하며 조급해질 때 지치지 않고 진로 준비를 이어가는 방법이 궁금해요.',
        sharePercent: 16,
        count: Math.round(totalCounselings * 0.16),
        insightNote: '성과 압박이 큰 시기일수록 감정을 돌보고 주간 루틴을 회복하는 상담이 중요해집니다.',
      },
      {
        rank: 5,
        topic: '채용공고 기반 단기 역량 갭 보완',
        sampleQuestion: '목표 직무의 채용공고 우대사항 중 지금 당장 1개월 안에 채울 수 있는 역량은 무엇일까요?',
        sharePercent: 12,
        count: Math.round(totalCounselings * 0.12),
        insightNote: '막연한 자격증 취득보다 직무 핵심 산출물을 1건 완성하는 방향을 선호합니다.',
      },
    ];

    popularRoles = [
      { rank: 1, roleName: '서비스 기획자 · PM', category: '기획 · 프로덕트', sharePercent: 25, avgFitScore: 86 },
      { rank: 2, roleName: '데이터 애널리스트', category: '데이터 · 분석', sharePercent: 20, avgFitScore: 84 },
      { rank: 3, roleName: 'CRM · 브랜드 마케터', category: '마케팅 · 그로스', sharePercent: 19, avgFitScore: 83 },
      { rank: 4, roleName: 'UX 리서처 · CX 기획', category: '프로덕트 · 리서치', sharePercent: 14, avgFitScore: 84 },
      { rank: 5, roleName: '프론트엔드 · 웹 개발자', category: '개발 · 엔지니어링', sharePercent: 13, avgFitScore: 82 },
      { rank: 6, roleName: 'HR · 사업개발 담당자', category: '경영 · 전략', sharePercent: 9, avgFitScore: 81 },
    ];
  }

  const stageInsights = [
    {
      stageLabel: '1~2학년 탐색기',
      primaryFocus: '전공 적성·흥미 탐색 및 대외활동 방향 설정',
      topSharePercent: 41,
    },
    {
      stageLabel: '3학년 대외활동기',
      primaryFocus: '목표 직무 1~2개 압축 및 첫 포트폴리오 구축',
      topSharePercent: 36,
    },
    {
      stageLabel: '4학년·졸업예정',
      primaryFocus: '인턴·신입 서류 개선 및 단기 역량 갭 보완',
      topSharePercent: 45,
    },
    {
      stageLabel: '실전 취준생·졸업생',
      primaryFocus: '면접 스토리텔링·직무 피벗 및 번아웃 케어',
      topSharePercent: 44,
    },
  ];

  const blueprintConversionRate =
    totalDiagnoses > 0
      ? Number(((totalRoadmaps / totalDiagnoses) * 100).toFixed(1))
      : 0;

  return {
    stage: stageFilter === 'all' || !statsStore[stageFilter] ? 'all' : stageFilter,
    updatedAt: new Date().toISOString(),
    summary: {
      totalCounselings,
      totalDiagnoses,
      totalRoadmaps,
      blueprintConversionRate,
      topModeLabel: topMode?.label || '직무 탐색 및 방향 설정',
      topModePercent: topMode?.percentage || 0,
      topRoleName: popularRoles[0]?.roleName || '서비스 기획자 · PM',
    },
    modeDistribution,
    topWorries,
    popularRoles,
    peerAxes,
    stageInsights,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY?.trim()) });
  });

  app.get('/api/stats', (req, res) => {
    const stageParam = typeof req.query.stage === 'string' ? req.query.stage : 'all';
    res.json(buildAggregatedStats(stageParam));
  });

  app.post('/api/diagnosis', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(403).json({
        error:
          '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 키를 등록해 주세요.',
      });
      return;
    }

    try {
      const body = req.body as DiagnosisRequestBody;
      const axisText = (body.axisAverages || [])
        .map((a) => `- ${a.label} (${a.key}): ${a.rawScore}/100`)
        .join('\n');

      const prompt = `당신은 한국 대학생과 취업 준비생을 전문으로 돕는 15년 차 진로 심리 및 커리어 설계 상담가입니다.
아래 사용자의 다차원 진단 입력 데이터를 깊이 있게 해석하여, 현실적이고 따뜻한 진로 성향 리포트와 맞춤 추천 직무 TOP 3를 JSON 형식으로 생성하세요.

[사용자 정보]
- 이름/별명: ${body.nickname || '지원자'}
- 현재 단계: ${body.stage}
- 전공/관심 계열: ${body.major || '미입력'}
- 선호 협업 스타일: ${body.workPreference}
- 핵심 커리어 가치관: ${(body.selectedValues || []).join(', ')}
- 현재 진로 고민: ${body.currentWorry || '구체적인 방향을 잡고 싶습니다.'}

[6개 성향 축 사전 산출 점수 (0~100)]
${axisText}

[작성 원칙]
1. axes 배열에는 입력된 6개 축(key: inquiry, creativity, people, execution, leadership, technical)을 모두 포함하고, 입력 점수를 바탕으로 1~2문장의 통찰력 있는 코멘트를 작성하세요.
2. recommendedRoles는 반드시 한국 대학생 및 신입 취준생이 실제로 도전 가능한 구체적 직무 3개를 제안하세요(예: 프로덕트 매니저(PM), UX 리서처, 데이터 애널리스트, 브랜드 마케터, B2B 영업기획, 프론트엔드 엔지니어, HRD/조직문화 담당자 등). 각 직무의 starterAction은 이번 달 당장 시작할 수 있는 구체적 행동 1가지로 작성하세요.
3. watchOut은 부족함을 질책하기보다 대학생·취준생 시기에 흔히 겪는 함정을 따뜻하게 짚어주는 1~2문장으로 작성하세요.
4. suggestedQuestions는 이어서 AI 상담소에서 바로 눌러 질문할 수 있는 개인화된 질문 4개를 작성하세요.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              '모든 텍스트는 자연스럽고 공감 어린 한국어 존댓말(일부 키워드 제외)로 작성하며, 과장된 미사여구 대신 구체적이고 실용적인 커리어 통찰을 제공하세요.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                personaTitle: {
                  type: Type.STRING,
                  description: '사용자의 커리어 성향을 한 줄로 표현한 따뜻한 페르소나 제목',
                },
                personaSummary: {
                  type: Type.STRING,
                  description: '성향과 가치관, 현재 고민을 종합한 2~3문장 핵심 요약',
                },
                axes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      label: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      comment: { type: Type.STRING },
                    },
                    required: ['key', 'label', 'score', 'comment'],
                  },
                },
                strengthKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                watchOut: {
                  type: Type.STRING,
                  description: '진로 설계 시 유의할 점 1~2문장',
                },
                recommendedRoles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      roleName: { type: Type.STRING },
                      category: { type: Type.STRING },
                      fitScore: { type: Type.INTEGER },
                      fitReason: { type: Type.STRING },
                      coreCompetencies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      starterAction: { type: Type.STRING },
                    },
                    required: [
                      'roleName',
                      'category',
                      'fitScore',
                      'fitReason',
                      'coreCompetencies',
                      'starterAction',
                    ],
                  },
                },
                suggestedQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'personaTitle',
                'personaSummary',
                'axes',
                'strengthKeywords',
                'watchOut',
                'recommendedRoles',
                'suggestedQuestions',
              ],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const stageKey = resolveStageKey(body.stage);
      statsStore[stageKey].diagnoses += 1;
      persistStatsStore(statsStore);
      res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const mapped = formatGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/counseling/chat', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(403).json({
        error:
          '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 키를 등록해 주세요.',
      });
      return;
    }

    const body = req.body as CounselingRequestBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      res.status(400).json({ error: '상담 메시지가 비어 있습니다.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const modeLabel = MODE_LABELS[body.mode] || MODE_LABELS.explore;
    const profileCtx = body.userProfile
      ? `사용자: ${body.userProfile.nickname || '지원자'}, 단계: ${body.userProfile.stage || '대학생/취준생'}, 전공: ${body.userProfile.major || '미지정'}`
      : '사용자: 대학생/취준생';

    const diagnosisCtx = body.diagnosisSummary
      ? `진단 페르소나: ${body.diagnosisSummary.personaTitle || ''} (${body.diagnosisSummary.personaSummary || ''}) / 강점: ${(body.diagnosisSummary.strengthKeywords || []).join(', ')} / 추천 직무: ${(body.diagnosisSummary.topRoles || []).join(', ')}`
      : '아직 성향 진단을 완료하지 않은 상태입니다.';

    const systemInstruction = `당신은 대학생과 취업 준비생을 위한 따뜻한 커리어 상담사 '온길'입니다.
현재 상담 주제 모드: ${modeLabel}
현재 목표/관심 직무: ${body.targetRole || '아직 탐색 중'}
${profileCtx}
${diagnosisCtx}

[상담 원칙]
1. 공감과 현실성의 균형: 막연한 응원이나 뻔한 조언 대신, 사용자의 학년·전공·성향 맥락에 맞춰 구체적이고 실행 가능한 선택지를 제시하세요.
2. 구조화된 가독성: 필요한 경우 번호 목록이나 짧은 소제목(**굵은 글씨**)을 사용해 읽기 쉽게 정리하되, 너무 딱딱한 보고서 말투는 피하고 다정한 대화체(해요체)를 사용하세요.
3. 한국 대학·취업 생태계 이해: 복수전공, 휴학 활용, 교내 프로젝트, 직무 관련 인턴십, 포트폴리오 구조화, 직무 역량 갭 줄이기 등 실제 고민에 맞춰 답변하세요.
4. 대화 이어가기: 답변 끝에는 사용자가 생각을 한 단계 더 구체화할 수 있도록 부담 없는 후속 질문 1개를 자연스럽게 건네세요.`;

    try {
      const contents = messages.map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }
      }

      const stageKey = resolveStageKey(body.userProfile?.stage);
      const safeMode = MODE_LABELS[body.mode] ? body.mode : 'explore';
      statsStore[stageKey].modeCounts[safeMode] += 1;
      persistStatsStore(statsStore);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      const mapped = formatGeminiError(err);
      res.write(`data: ${JSON.stringify({ error: mapped.message })}\n\n`);
      res.end();
    }
  });

  app.post('/api/roadmap', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(403).json({
        error:
          '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 키를 등록해 주세요.',
      });
      return;
    }

    try {
      const body = req.body as RoadmapRequestBody;
      const targetRole = body.targetRole?.trim();
      if (!targetRole) {
        res.status(400).json({ error: '목표 직무를 입력해 주세요.' });
        return;
      }

      const insightsText =
        body.savedInsights && body.savedInsights.length > 0
          ? body.savedInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')
          : '없음';

      const prompt = `당신은 대학생과 취업 준비생을 돕는 커리어 설계 전문가입니다.
사용자의 목표 직무와 현재 단계에 맞춰 현실적이고 실천 가능한 3단계 커리어 액션 플랜을 JSON으로 설계하세요.

[목표 직무]: ${targetRole}
[현재 단계]: ${body.stage || '대학생 및 취업 준비생'}
[전공/배경]: ${body.major || '미입력'}
[성향 페르소나]: ${body.personaTitle || '탐색 중'}
[상담에서 스크랩한 인사이트]:
${insightsText}

[설계 조건]
- 반드시 3개의 단계(phases)로 구성하세요:
  1단계: 방향 탐색 및 핵심 역량 기초 다지기 (지금 ~ 1개월)
  2단계: 실전 프로젝트·경험 및 포트폴리오 구축 (이번 학기 / 2~4개월)
  3단계: 직무 지원 및 면접 실전 도약 (지원 시즌)
- 각 단계마다 정확히 3개의 구체적인 실행 과제(items)를 작성하세요.
- 실행 과제는 추상적인 "열심히 공부하기"가 아니라 구체적 산출물이나 행동(예: "현직자 채용공고 10개 수집해 공통 요구역량 5가지 표로 정리하기", "교내 수업 또는 사이드 프로젝트 1건을 문제-가설-해결 구조의 2페이지 케이스 스터디로 문서화하기")으로 작성하세요.`;

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: {
            systemInstruction:
              '모든 내용은 자연스러운 한국어로 작성하며, 대학생·취준생이 실제로 체크리스트로 활용할 수 있는 명료한 문장으로 구성하세요.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                phases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phaseTitle: { type: Type.STRING },
                      periodLabel: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            detail: { type: Type.STRING },
                            dueLabel: { type: Type.STRING },
                          },
                          required: ['title', 'detail', 'dueLabel'],
                        },
                      },
                    },
                    required: ['phaseTitle', 'periodLabel', 'summary', 'items'],
                  },
                },
              },
              required: ['phases'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        phases?: Array<{
          phaseTitle: string;
          periodLabel: string;
          summary: string;
          items: Array<{ title: string; detail: string; dueLabel: string }>;
        }>;
      };

      const phases = (parsed.phases || []).map((phase, pIdx) => ({
        id: `phase-${Date.now()}-${pIdx}`,
        phaseTitle: phase.phaseTitle,
        periodLabel: phase.periodLabel,
        summary: phase.summary,
        items: (phase.items || []).map((item, iIdx) => ({
          id: `item-${Date.now()}-${pIdx}-${iIdx}`,
          title: item.title,
          detail: item.detail,
          dueLabel: item.dueLabel,
          completed: false,
        })),
      }));

      const stageKey = resolveStageKey(body.stage);
      statsStore[stageKey].roadmaps += 1;
      persistStatsStore(statsStore);

      res.json({ phases });
    } catch (err) {
      const mapped = formatGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ongil server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
