import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookmarkPlus,
  Compass,
  Plus,
  Send,
  Square,
  Trash2,
} from 'lucide-react';
import { COUNSELING_MODES } from '../data/assessmentConfig';
import { streamCounselingChat } from '../lib/api';
import type {
  AssessmentInput,
  CounselingMessage,
  CounselingMode,
  CounselingSession,
  DiagnosisReport,
  NavTab,
} from '../types/career';
import { IllustrationCard } from './IllustrationCard';

interface CounselingViewProps {
  sessions: CounselingSession[];
  activeSessionId: string | null;
  assessmentInput: AssessmentInput | null;
  diagnosisReport: DiagnosisReport | null;
  defaultTargetRole: string;
  pendingPrompt: string | null;
  onConsumePendingPrompt: () => void;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (mode?: CounselingMode, targetRole?: string) => string;
  onUpdateSession: (session: CounselingSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onPinInsight: (text: string, sessionTitle: string) => void;
  onNavigate: (tab: NavTab) => void;
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2.5" />;
    }

    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-[#232129]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-1">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2D7A6E]" />
          <span>{renderedParts}</span>
        </div>
      );
    }

    return <p key={idx}>{renderedParts}</p>;
  });
}

export function CounselingView({
  sessions,
  activeSessionId,
  assessmentInput,
  diagnosisReport,
  defaultTargetRole,
  pendingPrompt,
  onConsumePendingPrompt,
  onSelectSession,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
  onPinInsight,
  onNavigate,
}: CounselingViewProps) {
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  const activeModeMeta =
    COUNSELING_MODES.find((m) => m.id === (activeSession?.mode || 'explore')) ||
    COUNSELING_MODES[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, isStreaming]);

  const sendMessage = async (rawText: string, overrideSession?: CounselingSession) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    let targetSession = overrideSession || activeSession;
    if (!targetSession) {
      const newId = onCreateSession('explore', defaultTargetRole);
      targetSession = {
        id: newId,
        title: trimmed.slice(0, 24),
        mode: 'explore',
        targetRole: defaultTargetRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
    }

    const userMsg: CounselingMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantMsgId = `msg-a-${Date.now() + 1}`;
    const placeholderAssistant: CounselingMessage = {
      id: assistantMsgId,
      role: 'model',
      text: '',
      timestamp: new Date().toISOString(),
    };

    const nextTitle =
      targetSession.messages.length === 0
        ? trimmed.length > 26
          ? `${trimmed.slice(0, 26)}...`
          : trimmed
        : targetSession.title;

    const updatedWithUser: CounselingSession = {
      ...targetSession,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
      messages: [...targetSession.messages, userMsg, placeholderAssistant],
    };

    onUpdateSession(updatedWithUser);
    setInputText('');
    setErrorMsg(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    try {
      await streamCounselingChat({
        messages: [...targetSession.messages, userMsg],
        mode: targetSession.mode,
        targetRole: targetSession.targetRole || defaultTargetRole,
        assessmentInput,
        diagnosisReport,
        signal: controller.signal,
        onChunk: (chunk) => {
          accumulated += chunk;
          onUpdateSession({
            ...updatedWithUser,
            updatedAt: new Date().toISOString(),
            messages: updatedWithUser.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, text: accumulated } : m
            ),
          });
        },
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const message =
          err instanceof Error ? err.message : '상담 응답 중 오류가 발생했습니다.';
        setErrorMsg(message);
        onUpdateSession({
          ...updatedWithUser,
          messages: updatedWithUser.messages.filter((m) => m.id !== assistantMsgId),
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    if (pendingPrompt && activeSession && !isStreaming) {
      const promptToRun = pendingPrompt;
      onConsumePendingPrompt();
      void sendMessage(promptToRun, activeSession);
    }
  }, [pendingPrompt, activeSession?.id]);

  const starterQuestions =
    diagnosisReport && activeSession?.mode === 'explore'
      ? diagnosisReport.suggestedQuestions
      : activeModeMeta.starterPrompts;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar (Sessions & Context) */}
        <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl border border-[#E6E1D8] bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#232129]">
                상담 세션
              </h2>
              <button
                type="button"
                onClick={() => onCreateSession('explore', defaultTargetRole)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#2D7A6E] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-[#246258]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>새 상담</span>
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              {sessions.length === 0 ? (
                <p className="rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#65606E]">
                  아직 저장된 대화가 없습니다. 질문을 보내면 자동으로 기록됩니다.
                </p>
              ) : (
                sessions.map((sess) => {
                  const isActive = activeSession?.id === sess.id;
                  return (
                    <div
                      key={sess.id}
                      className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                        isActive ? 'bg-[#E7F3F0]' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSession(sess.id)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <p
                          className={`truncate text-xs font-semibold ${
                            isActive ? 'text-[#1D4E46]' : 'text-[#232129]'
                          }`}
                        >
                          {sess.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[#65606E]">
                          {COUNSELING_MODES.find((m) => m.id === sess.mode)?.label}
                        </p>
                      </button>
                      <button
                        type="button"
                        aria-label="상담 세션 삭제"
                        onClick={() => onDeleteSession(sess.id)}
                        className="rounded-lg p-1 text-[#65606E] opacity-70 hover:bg-white hover:text-[#8F2A25] hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Linked Diagnosis Context */}
          <div className="rounded-2xl border border-[#E6E1D8] bg-[#EFEBF7]/50 p-5">
            <p className="text-xs font-semibold text-[#232129]">연결된 진단 맥락</p>
            {diagnosisReport ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-bold text-[#232129]">
                  {diagnosisReport.personaTitle}
                </p>
                <p className="text-xs leading-relaxed text-[#65606E]">
                  추천 직무: {diagnosisReport.recommendedRoles.map((r) => r.roleName).join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('assessment')}
                  className="text-xs font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
                >
                  진단 리포트 다시 보기
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2.5">
                <p className="text-xs leading-relaxed text-[#65606E]">
                  성향 진단을 먼저 완료하면 AI 상담사가 내 성향과 가치관에 맞춰 훨씬 정교하게 조언해 드립니다.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('assessment')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>성향 진단 먼저 하기</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#E6E1D8] bg-[#FBF4DC]/65 p-5">
            <p className="text-xs font-semibold text-[#232129]">또래 상담자들의 고민</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#65606E]">
              다른 대학생·취준생들이 가장 많이 물어본 주제와 인기 직무 통계를 확인해 보세요.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('stats')}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>상담 통계 살펴보기</span>
            </button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className="flex min-h-[640px] flex-col rounded-2xl border border-[#E6E1D8] bg-white lg:col-span-8 xl:col-span-9">
          {/* Counselor Header & Mode Bar */}
          <div className="border-b border-[#E6E1D8] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E6E1D8]">
                  <IllustrationCard
                    src="/src/assets/images/counselor_portrait_warm_1795153687440.jpg"
                    alt="온길 AI 진로 상담사 일러스트"
                    fallbackTitle="온길"
                    aspectClassName="h-full w-full rounded-full border-0"
                  />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold text-[#232129]">
                    온길 AI 심층 진로 상담실
                  </h1>
                  <p className="text-xs text-[#65606E]">
                    {activeModeMeta.description}
                  </p>
                </div>
              </div>

              {activeSession && (
                <div className="sm:w-52">
                  <label htmlFor="target-role-chat" className="sr-only">
                    상담 목표 직무
                  </label>
                  <input
                    id="target-role-chat"
                    type="text"
                    value={activeSession.targetRole}
                    onChange={(e) =>
                      onUpdateSession({
                        ...activeSession,
                        targetRole: e.target.value,
                      })
                    }
                    placeholder="관심 직무 (예: 서비스 기획자)"
                    className="w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-xs text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Mode Segmented Tabs */}
            <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl bg-[#FAF8F5] p-1">
              {COUNSELING_MODES.map((m) => {
                const isSelected = (activeSession?.mode || 'explore') === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (activeSession) {
                        onUpdateSession({ ...activeSession, mode: m.id });
                      } else {
                        onCreateSession(m.id, defaultTargetRole);
                      }
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white font-semibold text-[#232129] shadow-xs'
                        : 'text-[#65606E] hover:text-[#232129]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {(!activeSession || activeSession.messages.length === 0) && (
              <div className="mx-auto max-w-2xl py-6">
                <div className="rounded-2xl border border-[#E6E1D8] bg-[#FAF8F5] p-6">
                  <p className="text-sm font-semibold text-[#232129]">
                    안녕하세요! 어떤 진로 고민을 함께 풀어볼까요?
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#65606E]">
                    아래 추천 질문을 눌러 바로 대화를 시작하거나, 지금 머릿속에 떠오른 고민을
                    자유롭게 입력해 주세요.
                  </p>

                  <div className="mt-4 space-y-2">
                    {starterQuestions.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="block w-full rounded-xl border border-[#E6E1D8] bg-white px-4 py-3 text-left text-sm text-[#232129] cursor-pointer transition-colors hover:border-[#2D7A6E] hover:bg-[#E7F3F0]/35"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSession?.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed sm:max-w-[78%] ${
                      isUser
                        ? 'bg-[#E7F3F0] text-[#1D4E46]'
                        : 'border border-[#E6E1D8] bg-[#FAF8F5] text-[#232129]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      {msg.text ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <span className="text-xs text-[#65606E]">답변을 정리하고 있어요...</span>
                      )}
                    </div>

                    {!isUser && msg.text && !isStreaming && (
                      <div className="mt-3 flex items-center justify-between border-t border-[#E6E1D8] pt-2.5">
                        <span className="font-mono-num text-[11px] text-[#65606E]">
                          {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onPinInsight(msg.text, activeSession.title || 'AI 진로 상담')
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
                        >
                          <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>설계 노트에 저장</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-[#F2C7C5] bg-[#FDF1F0] p-3.5 text-xs text-[#8F2A25]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input Composer */}
          <div className="border-t border-[#E6E1D8] bg-[#FAF8F5]/60 p-4 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(inputText);
              }}
              className="flex items-end gap-3"
            >
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(inputText);
                  }
                }}
                placeholder="진로, 전공, 인턴, 포트폴리오 등 궁금한 점을 편하게 물어보세요 (Enter 전송)"
                className="flex-1 resize-none rounded-xl border border-[#E6E1D8] bg-white px-4 py-2.5 text-sm text-[#232129] focus:border-[#2D7A6E] focus:outline-none"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#E6E1D8] bg-white px-4 text-xs font-semibold text-[#232129] whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#F3EFE8]"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>중지</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors ${
                    inputText.trim()
                      ? 'cursor-pointer bg-[#2D7A6E] hover:bg-[#246258]'
                      : 'cursor-not-allowed bg-[#9BBDB7]'
                  }`}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>전송</span>
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
