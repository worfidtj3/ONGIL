import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  Loader2,
  Plus,
  Printer,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { requestCareerRoadmap } from '../lib/api';
import type {
  AssessmentInput,
  CareerBlueprint,
  DiagnosisReport,
  RoadmapPhase,
} from '../types/career';
import { IllustrationCard } from './IllustrationCard';

interface BlueprintViewProps {
  blueprint: CareerBlueprint;
  assessmentInput: AssessmentInput | null;
  diagnosisReport: DiagnosisReport | null;
  onUpdateBlueprint: (next: CareerBlueprint) => void;
  onExportJson: () => void;
  onLoadSample: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function BlueprintView({
  blueprint,
  assessmentInput,
  diagnosisReport,
  onUpdateBlueprint,
  onExportJson,
  onLoadSample,
  onNotify,
}: BlueprintViewProps) {
  const [roleInput, setRoleInput] = useState(
    blueprint.targetRole || diagnosisReport?.recommendedRoles[0]?.roleName || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newTaskDrafts, setNewTaskDrafts] = useState<Record<string, string>>({});

  const totalItems = blueprint.phases.reduce((sum, p) => sum + p.items.length, 0);
  const completedItems = blueprint.phases.reduce(
    (sum, p) => sum + p.items.filter((i) => i.completed).length,
    0
  );
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleGenerateRoadmap = async (overrideRole?: string) => {
    const target = (overrideRole ?? roleInput).trim();
    if (!target) {
      setErrorMsg('목표 직무를 입력하거나 추천 직무 중 하나를 선택해 주세요.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const phases = await requestCareerRoadmap({
        targetRole: target,
        stage: assessmentInput?.stage,
        major: assessmentInput?.major,
        personaTitle: diagnosisReport?.personaTitle,
        savedInsights: blueprint.insights.slice(0, 5).map((i) => i.content),
      });

      onUpdateBlueprint({
        ...blueprint,
        targetRole: target,
        updatedAt: new Date().toISOString(),
        phases,
      });
      onNotify('success', `'${target}' 맞춤 3단계 로드맵이 생성되었습니다.`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : '로드맵 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (phaseId: string, itemId: string) => {
    const nextPhases = blueprint.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        items: phase.items.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ),
      };
    });
    onUpdateBlueprint({
      ...blueprint,
      updatedAt: new Date().toISOString(),
      phases: nextPhases,
    });
  };

  const addCustomTask = (phaseId: string) => {
    const title = (newTaskDrafts[phaseId] || '').trim();
    if (!title) return;
    const nextPhases = blueprint.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        items: [
          ...phase.items,
          {
            id: `custom-${Date.now()}`,
            title,
            detail: '직접 추가한 실행 과제입니다.',
            dueLabel: '직접 설정',
            completed: false,
          },
        ],
      };
    });
    setNewTaskDrafts((prev) => ({ ...prev, [phaseId]: '' }));
    onUpdateBlueprint({
      ...blueprint,
      updatedAt: new Date().toISOString(),
      phases: nextPhases,
    });
  };

  const deleteTask = (phaseId: string, itemId: string) => {
    const nextPhases = blueprint.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        items: phase.items.filter((i) => i.id !== itemId),
      };
    });
    onUpdateBlueprint({
      ...blueprint,
      updatedAt: new Date().toISOString(),
      phases: nextPhases,
    });
  };

  const promoteInsightToTask = (insightText: string) => {
    const trimmed = insightText.replace(/\*\*/g, '').trim();
    const shortTitle = trimmed.length > 52 ? `${trimmed.slice(0, 52)}...` : trimmed;

    let nextPhases: RoadmapPhase[];
    if (blueprint.phases.length === 0) {
      nextPhases = [
        {
          id: `phase-${Date.now()}`,
          phaseTitle: '1단계 · 상담 인사이트 실행 옮기기',
          periodLabel: '지금 ~ 1개월',
          summary: 'AI 상담에서 저장한 핵심 조언을 실행 과제로 정리한 단계입니다.',
          items: [
            {
              id: `item-${Date.now()}`,
              title: shortTitle,
              detail: trimmed,
              dueLabel: '이번 주',
              completed: false,
            },
          ],
        },
      ];
    } else {
      nextPhases = blueprint.phases.map((phase, idx) =>
        idx === 0
          ? {
              ...phase,
              items: [
                ...phase.items,
                {
                  id: `item-${Date.now()}`,
                  title: shortTitle,
                  detail: trimmed,
                  dueLabel: '상담 메모',
                  completed: false,
                },
              ],
            }
          : phase
      );
    }

    onUpdateBlueprint({
      ...blueprint,
      updatedAt: new Date().toISOString(),
      phases: nextPhases,
    });
    onNotify('success', '인사이트를 1단계 실행 과제로 추가했습니다.');
  };

  const deleteInsight = (insightId: string) => {
    onUpdateBlueprint({
      ...blueprint,
      updatedAt: new Date().toISOString(),
      insights: blueprint.insights.filter((i) => i.id !== insightId),
    });
  };

  const recommendedRoleNames = diagnosisReport?.recommendedRoles.map((r) => r.roleName) || [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header & Target Role Banner */}
      <section className="grid grid-cols-1 items-stretch gap-8 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#2D7A6E]">
                나만의 커리어 설계 보드
              </p>
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#232129] cursor-pointer hover:bg-[#F3EFE8]"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>인쇄 / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#232129] cursor-pointer hover:bg-[#F3EFE8]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>백업</span>
                </button>
              </div>
            </div>

            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#232129] sm:text-3xl">
              {blueprint.targetRole
                ? `${blueprint.targetRole} 성장 로드맵`
                : '목표 직무를 정하고 단계별 계획을 세워보세요'}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
              현재 학년과 성향 진단 결과, 상담 중 모은 인사이트를 반영해 지금 당장 실행할
              수 있는 3단계 마일스톤을 설계합니다.
            </p>
          </div>

          <div className="mt-6 space-y-3 no-print">
            {recommendedRoleNames.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-semibold text-[#65606E]">
                  추천 직무 빠른 선택:
                </span>
                {recommendedRoleNames.map((rName) => (
                  <button
                    key={rName}
                    type="button"
                    onClick={() => {
                      setRoleInput(rName);
                      onUpdateBlueprint({ ...blueprint, targetRole: rName });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      roleInput === rName
                        ? 'bg-[#E7F3F0] font-semibold text-[#1D4E46]'
                        : 'bg-[#FAF8F5] text-[#65606E] hover:bg-[#F3EFE8] hover:text-[#232129]'
                    }`}
                  >
                    {rName}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="목표 직무를 입력하세요 (예: 서비스 기획자, 프론트엔드 개발자)"
                className="flex-1 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => void handleGenerateRoadmap()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D7A6E] px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-[#246258] disabled:cursor-not-allowed disabled:bg-[#9BBDB7]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>로드맵 설계 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {blueprint.phases.length > 0
                        ? 'AI 로드맵 다시 설계'
                        : 'AI 맞춤 로드맵 생성'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <IllustrationCard
            src="/src/assets/images/roadmap_journey_scene_1795153688042.jpg"
            alt="목표 이정표를 따라 언덕을 넘어가는 커리어 여정 일러스트"
            fallbackTitle="온길 커리어 로드맵"
            aspectClassName="aspect-[16/9] lg:h-full lg:aspect-auto"
          />
        </div>
      </section>

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#F2C7C5] bg-[#FDF1F0] p-4 text-sm text-[#8F2A25]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress Summary */}
      {totalItems > 0 && (
        <section className="mt-8 rounded-2xl border border-[#E6E1D8] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#232129]">
                전체 로드맵 실행 현황
              </h2>
              <p className="mt-0.5 text-xs text-[#65606E]">
                작은 과제부터 하나씩 체크하며 나만의 포트폴리오와 경험을 쌓아보세요.
              </p>
            </div>
            <div className="text-right font-mono-num">
              <span className="text-lg font-bold text-[#2D7A6E]">{progressPct}%</span>
              <p className="text-xs text-[#65606E]">
                {completedItems} / {totalItems} 완료
              </p>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#F3EFE8]">
            <div
              className="h-full rounded-full bg-[#2D7A6E] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      )}

      {/* Empty State or 3-Phase Roadmap */}
      {blueprint.phases.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-[#E6E1D8] bg-[#FAF8F5] p-10 text-center">
          <h2 className="font-display text-lg font-bold text-[#232129]">
            아직 생성된 커리어 로드맵이 없습니다
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#65606E]">
            위 입력칸에 목표 직무를 입력하고 &apos;AI 맞춤 로드맵 생성&apos;을 누르거나,
            체험용 샘플 데이터를 불러와 로드맵 예시를 살펴보세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void handleGenerateRoadmap(roleInput || '서비스 기획자')}
              className="rounded-xl bg-[#2D7A6E] px-5 py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-[#246258]"
            >
              {roleInput ? `'${roleInput}' 로드맵 바로 생성` : '서비스 기획자 로드맵 생성'}
            </button>
            <button
              type="button"
              onClick={onLoadSample}
              className="rounded-xl border border-[#E6E1D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#232129] cursor-pointer hover:bg-[#F3EFE8]"
            >
              샘플 로드맵 불러오기
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {blueprint.phases.map((phase, pIdx) => {
            const phaseDone = phase.items.filter((i) => i.completed).length;
            const pastelBg =
              pIdx === 0
                ? 'bg-[#FBECE4]/40'
                : pIdx === 1
                ? 'bg-[#EFEBF7]/45'
                : 'bg-[#E7F3F0]/45';
            return (
              <div
                key={phase.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-white p-6"
              >
                <div>
                  <div className={`-mx-6 -mt-6 rounded-t-2xl border-b border-[#E6E1D8] px-6 py-4 ${pastelBg}`}>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#65606E]">
                      <span>{phase.periodLabel}</span>
                      <span className="font-mono-num font-semibold text-[#2D7A6E]">
                        {phaseDone} / {phase.items.length}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-base font-bold text-[#232129]">
                      {phase.phaseTitle}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#65606E]">
                      {phase.summary}
                    </p>
                  </div>

                  <div className="mt-5 divide-y divide-[#E6E1D8]">
                    {phase.items.map((item) => (
                      <div key={item.id} className="group py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            aria-label={`${item.title} 완료 토글`}
                            onClick={() => toggleItem(phase.id, item.id)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border cursor-pointer transition-colors ${
                              item.completed
                                ? 'border-[#2D7A6E] bg-[#2D7A6E] text-white'
                                : 'border-[#CFC9BE] bg-white hover:border-[#2D7A6E]'
                            }`}
                          >
                            {item.completed && <Check className="h-3.5 w-3.5" />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                item.completed
                                  ? 'text-[#8F8A96] line-through'
                                  : 'text-[#232129]'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[#65606E]">
                              {item.detail}
                            </p>
                            <p className="mt-1.5 font-mono-num text-[11px] text-[#2D7A6E]">
                              목표 시점 · {item.dueLabel}
                            </p>
                          </div>

                          <button
                            type="button"
                            aria-label="과제 삭제"
                            onClick={() => deleteTask(phase.id, item.id)}
                            className="rounded-lg p-1 text-[#A29CA9] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#8F2A25] cursor-pointer no-print"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add custom task */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCustomTask(phase.id);
                  }}
                  className="mt-5 flex items-center gap-2 border-t border-[#E6E1D8] pt-4 no-print"
                >
                  <input
                    type="text"
                    value={newTaskDrafts[phase.id] || ''}
                    onChange={(e) =>
                      setNewTaskDrafts((prev) => ({
                        ...prev,
                        [phase.id]: e.target.value,
                      }))
                    }
                    placeholder="실행 과제 직접 추가..."
                    className="min-w-0 flex-1 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3 py-2 text-xs text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="실행 과제 추가"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3EFE8] text-[#232129] cursor-pointer hover:bg-[#E7F3F0] hover:text-[#2D7A6E]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              </div>
            );
          })}
        </section>
      )}

      {/* Reflection Memo & Saved Counseling Insights */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-base font-bold text-[#232129]">
            나만의 커리어 메모
          </h2>
          <p className="mt-1 text-xs text-[#65606E]">
            진로 방향을 고민하며 스스로 정리한 기준이나 다짐을 적어두세요. 자동 저장됩니다.
          </p>
          <textarea
            rows={6}
            value={blueprint.reflectionMemo}
            onChange={(e) =>
              onUpdateBlueprint({
                ...blueprint,
                updatedAt: new Date().toISOString(),
                reflectionMemo: e.target.value,
              })
            }
            placeholder="예: 남들이 좋다는 직무보다 내가 실제로 문제를 정의하고 해결할 때 몰입되는지 먼저 경험해 보자."
            className="mt-4 w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] p-3.5 text-sm leading-relaxed text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#232129]">
                AI 상담에서 스크랩한 인사이트 노트
              </h2>
              <p className="mt-1 text-xs text-[#65606E]">
                상담 중 마음에 남았던 조언을 저장해 두고, 필요할 때 바로 실행 과제로 옮길 수 있습니다.
              </p>
            </div>
            <span className="font-mono-num text-xs font-semibold text-[#2D7A6E]">
              {blueprint.insights.length}건
            </span>
          </div>

          {blueprint.insights.length === 0 ? (
            <div className="mt-4 rounded-xl bg-[#FAF8F5] p-6 text-center">
              <p className="text-xs leading-relaxed text-[#65606E]">
                아직 저장된 인사이트가 없습니다. AI 진로 상담실에서 상담사 답변 하단의
                &apos;설계 노트에 저장&apos;을 눌러보세요.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#E6E1D8]">
              {blueprint.insights.map((insight) => (
                <div key={insight.id} className="py-4 first:pt-1 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#65606E]">
                    <span>{insight.sourceSessionTitle}</span>
                    <span className="font-mono-num">
                      {new Date(insight.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#232129]">
                    {insight.content}
                  </p>
                  <div className="mt-3 flex items-center gap-3 no-print">
                    <button
                      type="button"
                      onClick={() => promoteInsightToTask(insight.content)}
                      className="text-xs font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
                    >
                      1단계 실행 과제로 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteInsight(insight.id)}
                      className="text-xs font-medium text-[#65606E] cursor-pointer hover:text-[#8F2A25]"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
