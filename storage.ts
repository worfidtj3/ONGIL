import type { OngilWorkspaceState } from '../types/career';

const STORAGE_KEY = 'ongil_career_workspace_v1';

export function createEmptyWorkspaceState(): OngilWorkspaceState {
  return {
    version: 1,
    assessmentInput: null,
    diagnosisReport: null,
    sessions: [],
    activeSessionId: null,
    blueprint: {
      targetRole: '',
      updatedAt: new Date().toISOString(),
      reflectionMemo: '',
      phases: [],
      insights: [],
    },
    isSampleData: false,
  };
}

export function loadWorkspaceState(): OngilWorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyWorkspaceState();
    }
    const parsed = JSON.parse(raw) as Partial<OngilWorkspaceState>;
    if (!parsed || typeof parsed !== 'object') {
      return createEmptyWorkspaceState();
    }
    const base = createEmptyWorkspaceState();
    return {
      ...base,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      blueprint: {
        ...base.blueprint,
        ...(parsed.blueprint || {}),
        phases: Array.isArray(parsed.blueprint?.phases) ? parsed.blueprint.phases : [],
        insights: Array.isArray(parsed.blueprint?.insights) ? parsed.blueprint.insights : [],
      },
    };
  } catch {
    return createEmptyWorkspaceState();
  }
}

export function saveWorkspaceState(state: OngilWorkspaceState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function downloadWorkspaceJson(state: OngilWorkspaceState): void {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `ongil-career-backup-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function parseWorkspaceJson(rawText: string): OngilWorkspaceState {
  const parsed = JSON.parse(rawText) as Partial<OngilWorkspaceState>;
  if (!parsed || typeof parsed !== 'object' || !('blueprint' in parsed)) {
    throw new Error('올바른 온길 백업 JSON 파일이 아닙니다.');
  }
  const base = createEmptyWorkspaceState();
  return {
    ...base,
    ...parsed,
    version: 1,
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    blueprint: {
      ...base.blueprint,
      ...(parsed.blueprint || {}),
      phases: Array.isArray(parsed.blueprint?.phases) ? parsed.blueprint.phases : [],
      insights: Array.isArray(parsed.blueprint?.insights) ? parsed.blueprint.insights : [],
    },
  };
}
