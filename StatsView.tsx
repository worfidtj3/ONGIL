import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Compass,
  Map,
  MessageCircleHeart,
} from 'lucide-react';
import { USER_STAGES } from '../data/assessmentConfig';
import { fetchCareerStats } from '../lib/api';
import type {
  CareerStatsResponse,
  DiagnosisReport,
  NavTab,
  StatsStageFilter,
} from '../types/career';

interface StatsViewProps {
  diagnosisReport: DiagnosisReport | null;
  onStartCounselingWithTopic: (topicPrompt: string, roleName?: string) => void;
  onSetTargetRoleInBlueprint: (roleName: string) => void;
  onNavigate: (tab: NavTab) => void;
}

const STAGE_FILTERS: Array<{ id: StatsStageFilter; label: string }> = [
  { id: 'all', label: '전체 상담자' },
  { id: USER_STAGES[0], label: '1~2학년 탐색기' },
  { id: USER_STAGES[1], label: '3학년 대외활동기' },
  { id: USER_STAGES[2], label: '4학년·졸업예정' },
  { id: USER_STAGES[3], label: '실전 취준생·졸업생' },
];

const MODE_BAR_COLORS: Record<string, string> = {
  explore: '#2D7A6E',
  strategy: '#D48B68',
  major: '#7C6FA6',
  mental: '#5B8FB9',
};

export function StatsView({
  diagnosisReport,
  onStartCounselingWithTopic,
  onSetTargetRoleInBlueprint,
  onNavigate,
}: StatsViewProps) {
  const [stageFilter, setStageFilter] = useState<StatsStageFilter>('all');
  const [stats, setStats] = useState<CareerStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMsg(null);

    fetchCareerStats(stageFilter)
      .then((res) => {
        if (!active) return;
        setStats(res);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(
          err instanceof Error ? err.message : '통계 데이터를 불러오지 못했습니다.'
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [stageFilter]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#E6E1D8] pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold text-[#2D7A6E]">
            대학생·취준생 진로 고민 통계
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#232129] sm:text-3xl">
            다른 상담자들은 어떤 고민을 나누고 있을까요?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#65606E]">
            학년과 준비 단계별로 가장 많이 묻는 진로 주제, 인기 탐색 직무, 그리고 또래
            상담자들의 평균 성향 분포를 비교해 보세요.
          </p>
        </div>

        {/* Stage Filter Tabs */}
        <div
          role="tablist"
          aria-label="상담자 단계별 필터"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-[#F3EFE8] p-1"
        >
          {STAGE_FILTERS.map((item) => {
            const active = stageFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStageFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-white font-semibold text-[#232129] shadow-xs'
                    : 'text-[#65606E] hover:text-[#232129]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[#F2C7C5] bg-[#FDF1F0] p-4 text-sm text-[#8F2A25]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && !stats ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-2xl border border-[#E6E1D8] bg-white p-6"
            />
          ))}
        </div>
      ) : (
        stats && (
          <>
            {/* 4-Column KPI Summary Strip */}
            <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#E6E1D8] bg-white p-5">
                <p className="text-xs font-medium text-[#65606E]">누적 상담 세션</p>
                <p className="mt-2 font-mono-num text-2xl font-bold text-[#232129]">
                  {stats.summary.totalCounselings.toLocaleString()}건
                </p>
                <p className="mt-1 font-mono-num text-xs text-[#65606E]">
                  성향 진단 {stats.summary.totalDiagnoses.toLocaleString()}건 포함
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6E1D8] bg-[#E7F3F0]/55 p-5">
                <p className="text-xs font-medium text-[#65606E]">최다 상담 주제</p>
                <p className="mt-2 text-base font-bold leading-snug text-[#232129]">
                  {stats.summary.topModeLabel}
                </p>
                <p className="mt-1 font-mono-num text-xs font-semibold text-[#2D7A6E]">
                  전체의 {stats.summary.topModePercent}%
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6E1D8] bg-[#FBECE4]/50 p-5">
                <p className="text-xs font-medium text-[#65606E]">가장 많이 찾은 직무</p>
                <p className="mt-2 text-base font-bold leading-snug text-[#232129]">
                  {stats.summary.topRoleName}
                </p>
                <p className="mt-1 text-xs text-[#65606E]">
                  추천 및 목표 설정 1위
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6E1D8] bg-[#EFEBF7]/55 p-5">
                <p className="text-xs font-medium text-[#65606E]">로드맵 설계 전환율</p>
                <p className="mt-2 font-mono-num text-2xl font-bold text-[#232129]">
                  {stats.summary.blueprintConversionRate}%
                </p>
                <p className="mt-1 font-mono-num text-xs text-[#65606E]">
                  {stats.summary.totalRoadmaps.toLocaleString()}개 실행 계획 생성
                </p>
              </div>
            </section>

            {/* Mode Distribution + Peer vs My Profile Comparison */}
            <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#232129]">
                      상담 주제별 비중
                    </h2>
                    <p className="mt-1 text-xs text-[#65606E]">
                      상담자들이 어떤 주제로 대화를 가장 많이 시작했는지 보여줍니다.
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-[#2D7A6E]" aria-hidden="true" />
                </div>

                <div className="mt-6 space-y-5">
                  {stats.modeDistribution.map((item) => (
                    <div key={item.mode}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-[#232129]">
                          {item.label}
                        </span>
                        <span className="font-mono-num text-xs font-semibold text-[#65606E]">
                          {item.count.toLocaleString()}건 ·{' '}
                          <span className="text-[#232129]">{item.percentage}%</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#F3EFE8]">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(4, item.percentage)}%`,
                            backgroundColor: MODE_BAR_COLORS[item.mode] || '#2D7A6E',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#232129]">
                      또래 상담자 평균 성향 vs 나의 성향
                    </h2>
                    <p className="mt-1 text-xs text-[#65606E]">
                      {diagnosisReport
                        ? '내 성향 진단 결과와 선택한 단계의 상담자 평균을 나란히 비교합니다.'
                        : '성향 진단을 완료하면 또래 평균과 내 성향을 직접 비교해 볼 수 있습니다.'}
                    </p>
                  </div>
                  {!diagnosisReport && (
                    <button
                      type="button"
                      onClick={() => onNavigate('assessment')}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#E7F3F0] px-3 py-1.5 text-xs font-semibold text-[#1D4E46] whitespace-nowrap shrink-0 cursor-pointer hover:bg-[#D5ECE6]"
                    >
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>내 성향 진단하기</span>
                    </button>
                  )}
                </div>

                <div className="mt-5 divide-y divide-[#E6E1D8]">
                  {stats.peerAxes.map((peerAxis) => {
                    const myAxis = diagnosisReport?.axes.find(
                      (a) => a.key === peerAxis.key
                    );
                    return (
                      <div key={peerAxis.key} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#232129]">
                            {peerAxis.label}
                          </span>
                          <div className="flex items-center gap-3 font-mono-num">
                            <span className="text-[#65606E]">
                              또래 평균 {peerAxis.avgScore}
                            </span>
                            {myAxis && (
                              <span className="font-semibold text-[#2D7A6E]">
                                내 점수 {myAxis.score}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 space-y-1.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3EFE8]">
                            <div
                              className="h-full rounded-full bg-[#B7B1BD]"
                              style={{ width: `${peerAxis.avgScore}%` }}
                            />
                          </div>
                          {myAxis && (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7F3F0]">
                              <div
                                className="h-full rounded-full bg-[#2D7A6E]"
                                style={{ width: `${myAxis.score}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Top 5 Common Worries */}
            <section className="mt-10 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-8">
              <div>
                <h2 className="font-display text-xl font-bold text-[#232129]">
                  자주 올라온 진로 고민 TOP 5
                </h2>
                <p className="mt-1 text-sm text-[#65606E]">
                  비슷한 고민이 있다면 질문을 눌러 바로 AI 상담사와 내 상황에 맞게 대화를 시작해 보세요.
                </p>
              </div>

              <div className="mt-6 divide-y divide-[#E6E1D8]">
                {stats.topWorries.map((item) => (
                  <div
                    key={item.rank}
                    className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#65606E]">
                        <span className="font-mono-num font-bold text-[#2D7A6E]">
                          {String(item.rank).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          상담 비중 {item.sharePercent}% ({item.count.toLocaleString()}건)
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-[#232129]">
                        {item.topic}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#65606E]">
                        &ldquo;{item.sampleQuestion}&rdquo;
                      </p>
                      <p className="mt-1.5 text-xs text-[#65606E]">
                        {item.insightNote}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartCounselingWithTopic(item.sampleQuestion)}
                      className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-semibold text-[#232129] whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-[#2D7A6E] hover:bg-[#E7F3F0] hover:text-[#1D4E46] md:self-center"
                    >
                      <MessageCircleHeart className="h-3.5 w-3.5 text-[#2D7A6E]" aria-hidden="true" />
                      <span>이 고민으로 상담하기</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Roles Table & Stage Shift */}
            <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="rounded-2xl border border-[#E6E1D8] bg-white p-6 lg:col-span-8">
                <h2 className="font-display text-lg font-bold text-[#232129]">
                  인기 탐색·목표 직무 순위
                </h2>
                <p className="mt-1 text-xs text-[#65606E]">
                  직무를 선택하면 바로 AI 상담 또는 3단계 커리어 로드맵 설계로 이어집니다.
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E6E1D8] text-xs font-semibold text-[#65606E]">
                        <th className="py-2.5 pr-3">순위</th>
                        <th className="py-2.5 pr-3">직무명</th>
                        <th className="py-2.5 pr-3">분야</th>
                        <th className="py-2.5 pr-3 text-right">탐색 비중</th>
                        <th className="py-2.5 pr-3 text-right">평균 적합도</th>
                        <th className="py-2.5 text-right">바로가기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E1D8]">
                      {stats.popularRoles.map((role) => (
                        <tr
                          key={role.roleName}
                          className="transition-colors hover:bg-[#FAF8F5]"
                        >
                          <td className="py-3 pr-3 font-mono-num text-xs font-bold text-[#2D7A6E]">
                            {String(role.rank).padStart(2, '0')}
                          </td>
                          <td className="py-3 pr-3 font-semibold text-[#232129]">
                            {role.roleName}
                          </td>
                          <td className="py-3 pr-3 text-xs text-[#65606E]">
                            {role.category}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono-num text-xs font-semibold text-[#232129]">
                            {role.sharePercent}%
                          </td>
                          <td className="py-3 pr-3 text-right font-mono-num text-xs font-semibold text-[#2D7A6E]">
                            {role.avgFitScore}점
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onSetTargetRoleInBlueprint(role.roleName)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#FAF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#2D7A6E] whitespace-nowrap cursor-pointer hover:bg-[#E7F3F0]"
                            >
                              <Map className="h-3 w-3" aria-hidden="true" />
                              <span>설계하기</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6E1D8] bg-[#FBF4DC]/65 p-6 lg:col-span-4">
                <h2 className="font-display text-lg font-bold text-[#232129]">
                  학년·단계별 고민 흐름
                </h2>
                <p className="mt-1 text-xs text-[#65606E]">
                  시기에 따라 상담의 중심이 어떻게 이동하는지 한눈에 살펴보세요.
                </p>

                <div className="mt-5 divide-y divide-[#E6DFC5]">
                  {stats.stageInsights.map((st, idx) => (
                    <div key={st.stageLabel} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#232129]">
                          0{idx + 1}. {st.stageLabel}
                        </span>
                        <span className="font-mono-num font-semibold text-[#2D7A6E]">
                          핵심 비중 {st.topSharePercent}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#4C4854]">
                        {st.primaryFocus}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('counseling')}
                  className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#232129] border border-[#E6E1D8] cursor-pointer hover:bg-[#FAF8F5]"
                >
                  <span>내 고민 상담하러 가기</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2D7A6E]" aria-hidden="true" />
                </button>
              </div>
            </section>

            <p className="mt-8 text-xs text-[#65606E]">
              대학생·취준생 진로 상담 기준 코호트 데이터와 온길 서비스 내 실제 진단·상담 누적 기록을 함께 집계한 통계입니다.
            </p>
          </>
        )
      )}
    </div>
  );
}
