import { computeAxisAverages } from '../data/assessmentConfig';
import type {
  AssessmentInput,
  CareerStatsResponse,
  CounselingMessage,
  CounselingMode,
  DiagnosisReport,
  RoadmapPhase,
  StatsStageFilter,
} from '../types/career';

export async function requestDiagnosis(input: AssessmentInput): Promise<DiagnosisReport> {
  const axisAverages = computeAxisAverages(input.answers);
  const res = await fetch('/api/diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: input.nickname,
      stage: input.stage,
      major: input.major,
      workPreference: input.workPreference,
      axisAverages,
      selectedValues: input.selectedValues,
      currentWorry: input.currentWorry,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '성향 진단 분석 요청에 실패했습니다.');
  }
  return data as DiagnosisReport;
}

export interface StreamCounselingParams {
  messages: CounselingMessage[];
  mode: CounselingMode;
  targetRole: string;
  assessmentInput: AssessmentInput | null;
  diagnosisReport: DiagnosisReport | null;
  signal?: AbortSignal;
  onChunk: (chunkText: string) => void;
}

export async function streamCounselingChat({
  messages,
  mode,
  targetRole,
  assessmentInput,
  diagnosisReport,
  signal,
  onChunk,
}: StreamCounselingParams): Promise<void> {
  const res = await fetch('/api/counseling/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, text: m.text })),
      mode,
      targetRole,
      userProfile: assessmentInput
        ? {
            nickname: assessmentInput.nickname,
            stage: assessmentInput.stage,
            major: assessmentInput.major,
          }
        : undefined,
      diagnosisSummary: diagnosisReport
        ? {
            personaTitle: diagnosisReport.personaTitle,
            personaSummary: diagnosisReport.personaSummary,
            strengthKeywords: diagnosisReport.strengthKeywords,
            topRoles: diagnosisReport.recommendedRoles.map((r) => r.roleName),
          }
        : undefined,
    }),
  });

  if (!res.ok) {
    let errMsg = 'AI 상담 연결에 실패했습니다.';
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {
      // Ignore parse error
    }
    throw new Error(errMsg);
  }

  if (!res.body) {
    throw new Error('스트리밍 응답을 읽을 수 없습니다.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      const payload = JSON.parse(jsonStr) as {
        text?: string;
        done?: boolean;
        error?: string;
      };
      if (payload.error) {
        throw new Error(payload.error);
      }
      if (payload.text) {
        onChunk(payload.text);
      }
    }
  }
}

export async function requestCareerRoadmap(params: {
  targetRole: string;
  stage?: string;
  major?: string;
  personaTitle?: string;
  savedInsights?: string[];
}): Promise<RoadmapPhase[]> {
  const res = await fetch('/api/roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '커리어 로드맵 생성에 실패했습니다.');
  }
  return (data.phases || []) as RoadmapPhase[];
}

export async function fetchCareerStats(
  stage: StatsStageFilter = 'all'
): Promise<CareerStatsResponse> {
  const query = stage === 'all' ? '' : `?stage=${encodeURIComponent(stage)}`;
  const res = await fetch(`/api/stats${query}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '상담 통계를 불러오지 못했습니다.');
  }
  return data as CareerStatsResponse;
}

