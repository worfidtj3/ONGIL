import { useEffect, useState } from 'react';
import { AssessmentView } from './components/AssessmentView';
import { BlueprintView } from './components/BlueprintView';
import { ConfirmModal } from './components/ConfirmModal';
import { CounselingView } from './components/CounselingView';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { OngilLogo } from './components/OngilLogo';
import { StatsView } from './components/StatsView';
import { Toast, type ToastMessage } from './components/Toast';
import { SAMPLE_ONGIL_STATE } from './data/assessmentConfig';
import {
  createEmptyWorkspaceState,
  downloadWorkspaceJson,
  loadWorkspaceState,
  parseWorkspaceJson,
  saveWorkspaceState,
} from './lib/storage';
import type {
  AssessmentInput,
  CareerBlueprint,
  CounselingMode,
  CounselingSession,
  DiagnosisReport,
  NavTab,
  OngilWorkspaceState,
} from './types/career';

export default function App() {
  const [workspace, setWorkspace] = useState<OngilWorkspaceState>(() =>
    loadWorkspaceState()
  );
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    saveWorkspaceState(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ id: String(Date.now()), type, text });
  };

  const handleLoadSample = () => {
    setWorkspace(SAMPLE_ONGIL_STATE);
    notify('success', '체험용 샘플 프로필(서연 님)을 불러왔습니다.');
  };

  const handleExportJson = () => {
    downloadWorkspaceJson(workspace);
    notify('success', '커리어 워크스페이스 JSON 백업 파일을 저장했습니다.');
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseWorkspaceJson(text);
      setWorkspace(parsed);
      notify('success', '백업 데이터를 성공적으로 불러왔습니다.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : '파일을 읽는 중 오류가 발생했습니다.'
      );
    }
  };

  const handleConfirmReset = () => {
    setWorkspace(createEmptyWorkspaceState());
    setResetConfirmOpen(false);
    setActiveTab('home');
    notify('success', '로컬 저장 데이터를 초기화했습니다.');
  };

  const handleReportGenerated = (
    input: AssessmentInput,
    report: DiagnosisReport
  ) => {
    setWorkspace((prev) => ({
      ...prev,
      isSampleData: false,
      assessmentInput: input,
      diagnosisReport: report,
      blueprint: {
        ...prev.blueprint,
        targetRole:
          prev.blueprint.targetRole || report.recommendedRoles[0]?.roleName || '',
      },
    }));
    notify('success', '맞춤 성향 진단 리포트가 완성되었습니다.');
  };

  const createSession = (
    mode: CounselingMode = 'explore',
    targetRole = ''
  ): string => {
    const newId = `session-${Date.now()}`;
    const newSession: CounselingSession = {
      id: newId,
      title: targetRole ? `${targetRole} 진로 상담` : '새로운 진로 상담',
      mode,
      targetRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setWorkspace((prev) => ({
      ...prev,
      isSampleData: false,
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newId,
    }));
    return newId;
  };

  const handleStartCounselingWithRole = (
    roleName: string,
    starterQuestion?: string
  ) => {
    const defaultPrompt =
      starterQuestion ||
      `${roleName} 직무가 제 성향과 잘 맞는지, 대학생으로서 이번 달부터 무엇을 준비하면 좋을지 상담받고 싶어요.`;
    createSession('explore', roleName);
    setPendingPrompt(defaultPrompt);
    setActiveTab('counseling');
  };

  const handleStartCounselingWithTopic = (
    topicPrompt: string,
    roleName = ''
  ) => {
    createSession('explore', roleName || defaultTargetRole);
    setPendingPrompt(topicPrompt);
    setActiveTab('counseling');
  };

  const handleSetTargetRoleInBlueprint = (roleName: string) => {
    setWorkspace((prev) => ({
      ...prev,
      isSampleData: false,
      blueprint: {
        ...prev.blueprint,
        targetRole: roleName,
        updatedAt: new Date().toISOString(),
      },
    }));
    setActiveTab('blueprint');
    notify('success', `목표 직무가 '${roleName}'으로 설정되었습니다.`);
  };

  const handleUpdateSession = (updated: CounselingSession) => {
    setWorkspace((prev) => {
      const exists = prev.sessions.some((s) => s.id === updated.id);
      return {
        ...prev,
        isSampleData: false,
        sessions: exists
          ? prev.sessions.map((s) => (s.id === updated.id ? updated : s))
          : [updated, ...prev.sessions],
      };
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    setWorkspace((prev) => {
      const remaining = prev.sessions.filter((s) => s.id !== sessionId);
      const nextActive =
        prev.activeSessionId === sessionId
          ? remaining[0]?.id || null
          : prev.activeSessionId;
      return {
        ...prev,
        sessions: remaining,
        activeSessionId: nextActive,
      };
    });
  };

  const handlePinInsight = (text: string, sessionTitle: string) => {
    const summaryText =
      text.length > 220 ? `${text.slice(0, 220).trim()}...` : text.trim();
    setWorkspace((prev) => ({
      ...prev,
      isSampleData: false,
      blueprint: {
        ...prev.blueprint,
        updatedAt: new Date().toISOString(),
        insights: [
          {
            id: `insight-${Date.now()}`,
            content: summaryText,
            sourceSessionTitle: sessionTitle,
            createdAt: new Date().toISOString(),
          },
          ...prev.blueprint.insights,
        ],
      },
    }));
    notify('success', '커리어 설계 보드의 인사이트 노트에 저장했습니다.');
  };

  const handleUpdateBlueprint = (next: CareerBlueprint) => {
    setWorkspace((prev) => ({
      ...prev,
      isSampleData: false,
      blueprint: next,
    }));
  };

  const defaultTargetRole =
    workspace.blueprint.targetRole ||
    workspace.diagnosisReport?.recommendedRoles[0]?.roleName ||
    '';

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] text-[#232129]">
      <Navbar
        activeTab={activeTab}
        hasDiagnosis={Boolean(workspace.diagnosisReport)}
        onNavigate={setActiveTab}
        onPrimaryCta={() => setActiveTab('assessment')}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            workspace={workspace}
            onNavigate={setActiveTab}
            onLoadSample={handleLoadSample}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onRequestReset={() => setResetConfirmOpen(true)}
          />
        )}

        {activeTab === 'assessment' && (
          <AssessmentView
            savedInput={workspace.assessmentInput}
            report={workspace.diagnosisReport}
            onReportGenerated={handleReportGenerated}
            onStartCounselingWithRole={handleStartCounselingWithRole}
            onSetTargetRoleInBlueprint={handleSetTargetRoleInBlueprint}
          />
        )}

        {activeTab === 'counseling' && (
          <CounselingView
            sessions={workspace.sessions}
            activeSessionId={workspace.activeSessionId}
            assessmentInput={workspace.assessmentInput}
            diagnosisReport={workspace.diagnosisReport}
            defaultTargetRole={defaultTargetRole}
            pendingPrompt={pendingPrompt}
            onConsumePendingPrompt={() => setPendingPrompt(null)}
            onSelectSession={(id) =>
              setWorkspace((prev) => ({ ...prev, activeSessionId: id }))
            }
            onCreateSession={createSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onPinInsight={handlePinInsight}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'blueprint' && (
          <BlueprintView
            blueprint={workspace.blueprint}
            assessmentInput={workspace.assessmentInput}
            diagnosisReport={workspace.diagnosisReport}
            onUpdateBlueprint={handleUpdateBlueprint}
            onExportJson={handleExportJson}
            onLoadSample={handleLoadSample}
            onNotify={notify}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            diagnosisReport={workspace.diagnosisReport}
            onStartCounselingWithTopic={handleStartCounselingWithTopic}
            onSetTargetRoleInBlueprint={handleSetTargetRoleInBlueprint}
            onNavigate={setActiveTab}
          />
        )}
      </main>

      <footer className="border-t border-[#E6E1D8] bg-[#FAF8F5] py-8 no-print">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 text-xs text-[#65606E] sm:flex-row sm:items-center sm:px-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <OngilLogo size="sm" />
            <span className="font-display font-bold text-[#232129]">온길 (Ongil)</span>
            <span aria-hidden="true">·</span>
            <span>대학생·취업 준비생을 위한 AI 진로 상담 및 커리어 설계</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('assessment')}
              className="cursor-pointer hover:text-[#232129]"
            >
              성향 진단
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('counseling')}
              className="cursor-pointer hover:text-[#232129]"
            >
              AI 진로 상담
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('blueprint')}
              className="cursor-pointer hover:text-[#232129]"
            >
              커리어 설계
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className="cursor-pointer hover:text-[#232129]"
            >
              상담 통계
            </button>
          </div>
        </div>
      </footer>

      <ConfirmModal
        open={resetConfirmOpen}
        title="저장된 진로 데이터를 초기화할까요?"
        description="브라우저에 저장된 성향 진단 리포트, 상담 대화 기록, 커리어 설계 보드가 모두 삭제됩니다. 필요한 경우 먼저 JSON 백업을 저장해 주세요."
        confirmLabel="모두 초기화"
        danger
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
