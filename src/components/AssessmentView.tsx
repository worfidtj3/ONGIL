import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Map,
  MessageCircleHeart,
  RefreshCw,
} from 'lucide-react';
import {
  APTITUDE_QUESTIONS,
  CAREER_VALUES,
  EMPTY_ASSESSMENT_INPUT,
  USER_STAGES,
} from '../data/assessmentConfig';
import { requestDiagnosis } from '../lib/api';
import type { AssessmentInput, DiagnosisReport } from '../types/career';
import { IllustrationCard } from './IllustrationCard';
import { RadarChart } from './RadarChart';

interface AssessmentViewProps {
  savedInput: AssessmentInput | null;
  report: DiagnosisReport | null;
  onReportGenerated: (input: AssessmentInput, report: DiagnosisReport) => void;
  onStartCounselingWithRole: (roleName: string, starterQuestion?: string) => void;
  onSetTargetRoleInBlueprint: (roleName: string) => void;
}

const WORRY_TEMPLATES = [
  '전공을 살릴지, 관심 있는 새로운 직무에 도전할지 결정이 어렵습니다.',
  '인턴이나 직무 관련 경험이 부족해 포트폴리오를 무엇부터 채워야 할지 막막해요.',
  '제가 가진 강점이 실제 채용 시장에서 어떤 직무와 맞닿아 있는지 알고 싶어요.',
];

export function AssessmentView({
  savedInput,
  report,
  onReportGenerated,
  onStartCounselingWithRole,
  onSetTargetRoleInBlueprint,
}: AssessmentViewProps) {
  const [isRetaking, setIsRetaking] = useState(!report);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formInput, setFormInput] = useState<AssessmentInput>(
    savedInput || EMPTY_ASSESSMENT_INPUT
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleValue = (value: string) => {
    setFormInput((prev) => {
      const exists = prev.selectedValues.includes(value);
      if (exists) {
        return {
          ...prev,
          selectedValues: prev.selectedValues.filter((v) => v !== value),
        };
      }
      if (prev.selectedValues.length >= 3) {
        return prev;
      }
      return {
        ...prev,
        selectedValues: [...prev.selectedValues, value],
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await requestDiagnosis(formInput);
      onReportGenerated(formInput, result);
      setIsRetaking(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : '성향 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <div className="mx-auto w-32">
          <IllustrationCard
            src="/src/assets/images/counselor_portrait_warm_1795153687440.jpg"
            alt="성향 리포트를 정리하고 있는 온길 상담사"
            fallbackTitle="온길 AI 분석 중"
            aspectClassName="aspect-square rounded-full"
          />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold text-[#232129]">
          응답을 바탕으로 성향 리포트를 정리하고 있어요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
          6개 직무 성향 축과 가치관, 현재 고민을 연결해 맞춤 추천 직무 3가지를 찾고 있습니다.
        </p>
        <div className="mt-8 space-y-3 text-left">
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#E6E1D8]" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#F3EFE8]" />
          <div className="h-4 w-5/6 animate-pulse rounded-lg bg-[#E6E1D8]" />
        </div>
      </div>
    );
  }

  // Report View
  if (report && !isRetaking) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E6E1D8] pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#65606E]">
              <span>AI 커리어 성향 리포트</span>
              <span aria-hidden="true">·</span>
              <span>{savedInput?.stage || '대학생·취준생'}</span>
              {savedInput?.major && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{savedInput.major}</span>
                </>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#232129] sm:text-3xl">
              {report.personaTitle}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setIsRetaking(true);
            }}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#E6E1D8] bg-white px-4 py-2 text-xs font-semibold text-[#232129] whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#F3EFE8]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>다시 진단하기</span>
          </button>
        </div>

        {/* Summary & Keywords */}
        <section className="mt-8 rounded-2xl border border-[#E6E1D8] bg-[#E7F3F0]/55 p-6 sm:p-7">
          <p className="text-base leading-relaxed text-[#232129]">
            {report.personaSummary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#D3E6E0] pt-4 text-sm font-medium text-[#1D4E46]">
            <span className="text-xs font-semibold text-[#65606E]">핵심 강점</span>
            {report.strengthKeywords.map((kw, idx) => (
              <span key={kw} className="inline-flex items-center gap-3">
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span>{kw}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Radar & Axis Breakdown */}
        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-center rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-5">
            <h2 className="font-display text-lg font-bold text-[#232129]">
              6축 직무 성향 분포
            </h2>
            <p className="mt-1 text-xs text-[#65606E]">
              높은 점수는 현재 에너지를 자연스럽게 발휘하는 방향을 뜻합니다.
            </p>
            <div className="mt-4">
              <RadarChart axes={report.axes} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-7">
            <h2 className="font-display text-lg font-bold text-[#232129]">
              영역별 해석
            </h2>
            <div className="mt-5 divide-y divide-[#E6E1D8]">
              {report.axes.map((axis) => (
                <div key={axis.key} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-[#232129]">
                      {axis.label}
                    </span>
                    <span className="font-mono-num text-sm font-semibold text-[#2D7A6E]">
                      {axis.score} / 100
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3EFE8]">
                    <div
                      className="h-full rounded-full bg-[#2D7A6E]"
                      style={{ width: `${Math.min(100, Math.max(10, axis.score))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#65606E]">
                    {axis.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Watch Out */}
        <section className="mt-8 rounded-2xl border border-[#E6E1D8] bg-[#FBF4DC]/70 p-6">
          <h2 className="text-sm font-bold text-[#232129]">
            진로 설계 시 함께 챙기면 좋은 점
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4C4854]">
            {report.watchOut}
          </p>
        </section>

        {/* Recommended Top 3 Roles */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-[#232129]">
            맞춤 추천 직무 TOP 3
          </h2>
          <p className="mt-1 text-sm text-[#65606E]">
            관심 가는 직무를 골라 AI와 더 깊이 상담하거나 커리어 설계 보드 목표로 바로 설정해 보세요.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {report.recommendedRoles.map((role, index) => (
              <div
                key={role.roleName}
                className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-white p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#65606E]">
                    <span>
                      0{index + 1}. {role.category}
                    </span>
                    <span className="font-mono-num font-semibold text-[#2D7A6E]">
                      적합도 {role.fitScore}%
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-[#232129]">
                    {role.roleName}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#65606E]">
                    {role.fitReason}
                  </p>

                  <div className="mt-4 border-t border-[#E6E1D8] pt-4">
                    <p className="text-xs font-semibold text-[#232129]">핵심 요구 역량</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#65606E]">
                      {role.coreCompetencies.join(' · ')}
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#FAF8F5] p-3.5">
                    <p className="text-xs font-semibold text-[#2D7A6E]">이번 달 추천 첫걸음</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#232129]">
                      {role.starterAction}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onStartCounselingWithRole(role.roleName)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer hover:bg-[#246258]"
                  >
                    <MessageCircleHeart className="h-4 w-4" aria-hidden="true" />
                    <span>이 직무로 AI 상담하기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetTargetRoleInBlueprint(role.roleName)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6E1D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#232129] cursor-pointer hover:bg-[#F3EFE8]"
                  >
                    <Map className="h-4 w-4" aria-hidden="true" />
                    <span>설계 보드 목표로 설정</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Counseling Questions */}
        {report.suggestedQuestions.length > 0 && (
          <section className="mt-10 rounded-2xl border border-[#E6E1D8] bg-[#EFEBF7]/50 p-6">
            <h2 className="font-display text-lg font-bold text-[#232129]">
              바로 물어보면 좋은 맞춤 상담 질문
            </h2>
            <p className="mt-1 text-xs text-[#65606E]">
              질문을 클릭하면 AI 상담소로 이동해 해당 주제로 바로 대화를 시작합니다.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {report.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() =>
                    onStartCounselingWithRole(
                      report.recommendedRoles[0]?.roleName || '',
                      q
                    )
                  }
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E6E1D8] bg-white px-4 py-3 text-left text-sm font-medium text-[#232129] cursor-pointer transition-colors hover:border-[#2D7A6E] hover:bg-[#FAF8F5]"
                >
                  <span>{q}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#2D7A6E]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Interactive Diagnostic Wizard
  const canProceedStep1 = Boolean(formInput.stage);
  const canProceedStep3 = formInput.selectedValues.length >= 1;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#2D7A6E]">
            온길 다차원 커리어 진단
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#232129]">
            나를 이해하는 4단계 질문
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <button
              type="button"
              onClick={() => setIsRetaking(false)}
              className="rounded-xl border border-[#E6E1D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#65606E] cursor-pointer hover:text-[#232129]"
            >
              이전 리포트로 돌아가기
            </button>
          )}
          <span className="font-mono-num text-sm font-semibold text-[#2D7A6E]">
            {step} / 4
          </span>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#E6E1D8]">
        <div
          className="h-full rounded-full bg-[#2D7A6E] transition-transform duration-200"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F2C7C5] bg-[#FDF1F0] p-4 text-sm text-[#8F2A25]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">리포트 생성에 문제가 발생했습니다</p>
            <p className="mt-1 text-xs leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#232129]">
                현재 나의 학년과 전공 맥락을 알려주세요
              </h2>
              <p className="mt-1 text-sm text-[#65606E]">
                같은 성향이라도 1~2학년과 4학년·취준생에게 필요한 현실적 전략은 다릅니다.
              </p>
            </div>

            <div>
              <label
                htmlFor="nickname-input"
                className="block text-sm font-semibold text-[#232129]"
              >
                어떻게 불러드리면 좋을까요? (선택)
              </label>
              <input
                id="nickname-input"
                type="text"
                value={formInput.nickname}
                onChange={(e) =>
                  setFormInput((prev) => ({ ...prev, nickname: e.target.value }))
                }
                placeholder="예: 민수, 지현"
                className="mt-2 w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#232129]">현재 준비 단계</p>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {USER_STAGES.map((stageItem) => {
                  const selected = formInput.stage === stageItem;
                  return (
                    <button
                      key={stageItem}
                      type="button"
                      onClick={() =>
                        setFormInput((prev) => ({ ...prev, stage: stageItem }))
                      }
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#2D7A6E] bg-[#E7F3F0] font-semibold text-[#1D4E46]'
                          : 'border-[#E6E1D8] bg-[#FAF8F5] text-[#232129] hover:bg-[#F3EFE8]'
                      }`}
                    >
                      <span>{stageItem}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="major-input"
                className="block text-sm font-semibold text-[#232129]"
              >
                전공 또는 관심 계열 (선택)
              </label>
              <input
                id="major-input"
                type="text"
                value={formInput.major}
                onChange={(e) =>
                  setFormInput((prev) => ({ ...prev, major: e.target.value }))
                }
                placeholder="예: 경영학과, 컴퓨터공학, 심리학 복수전공 등"
                className="mt-2 w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#232129]">선호하는 협업 스타일</p>
              <div className="mt-2 grid grid-cols-1 gap-2.5">
                {(
                  [
                    '혼자 깊이 파고드는 몰입형',
                    '팀과 활발히 소통하는 협업형',
                    '상황에 따라 유연하게 조율하는 균형형',
                  ] as const
                ).map((pref) => {
                  const selected = formInput.workPreference === pref;
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() =>
                        setFormInput((prev) => ({ ...prev, workPreference: pref }))
                      }
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#2D7A6E] bg-[#E7F3F0] font-semibold text-[#1D4E46]'
                          : 'border-[#E6E1D8] bg-[#FAF8F5] text-[#232129] hover:bg-[#F3EFE8]'
                      }`}
                    >
                      <span>{pref}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#232129]">
                평소 과제나 팀 활동을 할 때의 모습을 떠올려 보세요
              </h2>
              <p className="mt-1 text-sm text-[#65606E]">
                정답은 없습니다. 나에게 얼마나 가까운지 1(전혀 아니다)부터 5(매우 그렇다)까지 선택해 주세요.
              </p>
            </div>

            <div className="divide-y divide-[#E6E1D8]">
              {APTITUDE_QUESTIONS.map((q, index) => {
                const currentVal = formInput.answers[q.id] ?? 3;
                return (
                  <div key={q.id} className="py-5 first:pt-2 last:pb-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#65606E]">
                      <span>
                        문항 {String(index + 1).padStart(2, '0')} · {q.axisLabel}
                      </span>
                      <span className="font-mono-num font-semibold text-[#2D7A6E]">
                        {currentVal} / 5
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#232129]">
                      {q.prompt}
                    </p>

                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const active = currentVal === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              setFormInput((prev) => ({
                                ...prev,
                                answers: { ...prev.answers, [q.id]: score },
                              }))
                            }
                            className={`h-10 rounded-xl border font-mono-num text-sm font-semibold cursor-pointer transition-colors ${
                              active
                                ? 'border-[#2D7A6E] bg-[#2D7A6E] text-white'
                                : 'border-[#E6E1D8] bg-[#FAF8F5] text-[#232129] hover:bg-[#F3EFE8]'
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#65606E]">
                      <span>{q.lowLabel}</span>
                      <span>{q.highLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#232129]">
                  일을 선택할 때 가장 포기하기 어려운 가치는 무엇인가요?
                </h2>
                <p className="mt-1 text-sm text-[#65606E]">
                  중요하게 생각하는 가치관을 1개에서 최대 3개까지 선택해 주세요.
                </p>
              </div>
              <span className="font-mono-num text-sm font-semibold text-[#2D7A6E] shrink-0">
                {formInput.selectedValues.length} / 3
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CAREER_VALUES.map((val) => {
                const selected = formInput.selectedValues.includes(val);
                const disabled = !selected && formInput.selectedValues.length >= 3;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleValue(val)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                      selected
                        ? 'border-[#2D7A6E] bg-[#E7F3F0] font-semibold text-[#1D4E46] cursor-pointer'
                        : disabled
                        ? 'border-[#E6E1D8] bg-[#FAF8F5] text-[#A29CA9] cursor-not-allowed'
                        : 'border-[#E6E1D8] bg-[#FAF8F5] text-[#232129] hover:bg-[#F3EFE8] cursor-pointer'
                    }`}
                  >
                    <span>{val}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#232129]">
                요즘 가장 마음 쓰이는 진로 고민이 있다면 편하게 적어주세요
              </h2>
              <p className="mt-1 text-sm text-[#65606E]">
                구체적일수록 AI 리포트와 추천 직무가 내 상황에 꼭 맞게 정리됩니다.
              </p>
            </div>

            <div>
              <textarea
                rows={5}
                value={formInput.currentWorry}
                onChange={(e) =>
                  setFormInput((prev) => ({ ...prev, currentWorry: e.target.value }))
                }
                placeholder="예: 3학년인데 전공 수업은 재미있지만 실제로 어떤 직무로 취업할 수 있을지 잘 그려지지 않아요. 대외활동과 인턴 중 무엇을 먼저 준비해야 할지 고민입니다."
                className="w-full rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] p-4 text-sm leading-relaxed text-[#232129] focus:border-[#2D7A6E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#65606E]">
                작성이 막막하다면 아래 예시를 눌러 채워볼 수 있어요
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {WORRY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() =>
                      setFormInput((prev) => ({ ...prev, currentWorry: tpl }))
                    }
                    className="rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-3.5 py-2.5 text-left text-xs text-[#65606E] cursor-pointer hover:bg-[#F3EFE8] hover:text-[#232129]"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-[#E6E1D8] pt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D8] px-4 py-2.5 text-sm font-medium ${
              step === 1
                ? 'cursor-not-allowed bg-[#FAF8F5] text-[#B8B2BF]'
                : 'cursor-pointer bg-white text-[#232129] hover:bg-[#F3EFE8]'
            }`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>이전</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={(step === 1 && !canProceedStep1) || (step === 3 && !canProceedStep3)}
              onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                (step === 1 && !canProceedStep1) || (step === 3 && !canProceedStep3)
                  ? 'cursor-not-allowed bg-[#9BBDB7]'
                  : 'cursor-pointer bg-[#2D7A6E] hover:bg-[#246258]'
              }`}
            >
              <span>다음 단계</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D7A6E] px-6 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-[#246258]"
            >
              <span>AI 성향 리포트 생성하기</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
