import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Compass,
  Download,
  FileUp,
  Map,
  MessageCircleHeart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { fetchCareerStats } from '../lib/api';
import type { CareerStatsResponse, NavTab, OngilWorkspaceState } from '../types/career';
import { IllustrationCard } from './IllustrationCard';

interface HomeViewProps {
  workspace: OngilWorkspaceState;
  onNavigate: (tab: NavTab) => void;
  onLoadSample: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onRequestReset: () => void;
}

export function HomeView({
  workspace,
  onNavigate,
  onLoadSample,
  onExportJson,
  onImportJson,
  onRequestReset,
}: HomeViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [peerStats, setPeerStats] = useState<CareerStatsResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchCareerStats('all')
      .then((res) => {
        if (mounted) setPeerStats(res);
      })
      .catch(() => {
        // Silently ignore preview load errors on HomeView
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasDiagnosis = Boolean(workspace.diagnosisReport);
  const totalMilestones = workspace.blueprint.phases.reduce(
    (sum, p) => sum + p.items.length,
    0
  );
  const completedMilestones = workspace.blueprint.phases.reduce(
    (sum, p) => sum + p.items.filter((i) => i.completed).length,
    0
  );
  const progressPct =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      {/* Hero Split */}
      <section className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="text-sm font-medium text-[#2D7A6E]">
            대학생 · 취업 준비생을 위한 진로 상담 및 커리어 설계
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,3.6vw,3.15rem)] font-bold leading-[1.2] tracking-tight text-[#232129]">
            막연한 진로 고민을
            <br />
            나만의 구체적인 길로
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#65606E]">
            복잡한 회원가입 없이 지금 바로 성향과 가치관을 진단해 보세요. 진단 결과를
            기억하는 AI 상담사와 대화하며 직무를 좁히고, 이번 학기부터 바로 실행할
            커리어 로드맵까지 한곳에서 정리할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D7A6E] px-6 py-3.5 text-sm font-semibold text-white cursor-pointer transition-colors duration-150 hover:bg-[#246258] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
            >
              <span>{hasDiagnosis ? '내 성향 리포트 보기' : '5분 성향 진단 시작하기'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            {!hasDiagnosis ? (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E6E1D8] bg-white px-5 py-3.5 text-sm font-semibold text-[#232129] cursor-pointer transition-colors duration-150 hover:bg-[#F3EFE8]"
              >
                <Sparkles className="h-4 w-4 text-[#2D7A6E]" aria-hidden="true" />
                <span>체험용 샘플로 둘러보기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('counseling')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E6E1D8] bg-white px-5 py-3.5 text-sm font-semibold text-[#232129] cursor-pointer transition-colors duration-150 hover:bg-[#F3EFE8]"
              >
                <MessageCircleHeart className="h-4 w-4 text-[#2D7A6E]" aria-hidden="true" />
                <span>AI 상담 이어가기</span>
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#65606E]">
            <span>로그인 불필요</span>
            <span aria-hidden="true">·</span>
            <span>브라우저 자동 저장</span>
            <span aria-hidden="true">·</span>
            <span>JSON 백업 지원</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <IllustrationCard
            src="/src/assets/images/hero_career_photo_1795154228795.jpg"
            alt="햇살이 들어오는 책상에서 노트를 펼치고 진로를 설계하는 대학생 사진"
            fallbackTitle="온길 진로 상담실"
            aspectClassName="aspect-[4/3] lg:h-full lg:aspect-auto"
          />
        </div>
      </section>

      {/* Active Workspace Snapshot if user has data */}
      {(hasDiagnosis || workspace.sessions.length > 0 || totalMilestones > 0) && (
        <section className="mt-12 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium text-[#2D7A6E]">
                {workspace.isSampleData ? '체험용 샘플 프로필 활성화됨' : '내 브라우저에 저장된 진행 현황'}
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-[#232129]">
                {workspace.diagnosisReport?.personaTitle || '탐색 중인 커리어 워크스페이스'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('counseling')}
                className="rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#232129] cursor-pointer hover:bg-[#F3EFE8]"
              >
                상담실 열기
              </button>
              <button
                type="button"
                onClick={() => onNavigate('blueprint')}
                className="rounded-xl bg-[#E7F3F0] px-4 py-2 text-xs font-semibold text-[#1D4E46] cursor-pointer hover:bg-[#D5ECE6]"
              >
                설계 보드 보기
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E6E1D8] pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#65606E]">추천 및 목표 직무</p>
              <p className="mt-1 text-sm font-semibold text-[#232129]">
                {workspace.blueprint.targetRole ||
                  workspace.diagnosisReport?.recommendedRoles[0]?.roleName ||
                  '아직 선택 전'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#65606E]">저장된 AI 상담 대화</p>
              <p className="mt-1 font-mono-num text-sm font-semibold text-[#232129]">
                {workspace.sessions.length}개 세션
              </p>
            </div>
            <div>
              <p className="text-xs text-[#65606E]">커리어 설계 실행률</p>
              <p className="mt-1 font-mono-num text-sm font-semibold text-[#2D7A6E]">
                {totalMilestones > 0
                  ? `${completedMilestones}/${totalMilestones} 완료 (${progressPct}%)`
                  : '로드맵 생성 전'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3-Step Workflow Section */}
      <section className="mt-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#232129]">
            진단에서 멈추지 않고, 실행 계획까지 연결되는 3단계
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
            단순히 성격 유형 이름만 알려주는 테스트가 아니라, 지금 당장 이번 학기에 무엇을
            준비하면 좋을지 함께 정리합니다.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-[#FBECE4]/55 p-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2D7A6E]">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-[#232129]">
                01. 다차원 성향·가치관 진단
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
                6가지 직무 성향 축과 커리어 가치관, 현재 학년·전공 맥락을 종합해 AI가 맞춤
                페르소나와 추천 직무 TOP 3를 도출합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
            >
              <span>성향 진단 이동</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-[#EFEBF7]/65 p-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2D7A6E]">
                <MessageCircleHeart className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-[#232129]">
                02. 맥락을 기억하는 AI 상담
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
                진단 결과를 바탕으로 직무 탐색, 복수전공 연결, 인턴·포트폴리오 전략, 취준
                불안 케어까지 주제별 심층 대화를 나눕니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('counseling')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
            >
              <span>AI 진로 상담 이동</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#E6E1D8] bg-[#E7F3F0]/70 p-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2D7A6E]">
                <Map className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-[#232129]">
                03. 단계별 커리어 설계 보드
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#65606E]">
                상담 중 얻은 인사이트를 노트로 저장하고, 목표 직무에 맞춘 3단계 실행
                체크리스트를 생성해 진척도를 관리합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('blueprint')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D7A6E] cursor-pointer hover:underline"
            >
              <span>커리어 설계 이동</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Peer Counseling Statistics Preview */}
      {peerStats && (
        <section className="mt-14 rounded-2xl border border-[#E6E1D8] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold text-[#2D7A6E]">
                또래 상담 통계 요약
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-[#232129]">
                다른 대학생·취준생들은 어떤 고민을 많이 나눴을까요?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stats')}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#232129] whitespace-nowrap shrink-0 cursor-pointer hover:border-[#2D7A6E] hover:bg-[#E7F3F0] hover:text-[#1D4E46] sm:self-auto"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#2D7A6E]" aria-hidden="true" />
              <span>전체 상담 통계 보기</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E6E1D8] pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#65606E]">누적 상담 · 진단 건수</p>
              <p className="mt-1 font-mono-num text-lg font-bold text-[#232129]">
                {peerStats.summary.totalCounselings.toLocaleString()}건
              </p>
              <p className="mt-0.5 font-mono-num text-xs text-[#65606E]">
                로드맵 전환율 {peerStats.summary.blueprintConversionRate}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[#65606E]">가장 많이 선택한 상담 주제</p>
              <p className="mt-1 text-sm font-bold text-[#232129]">
                {peerStats.summary.topModeLabel}
              </p>
              <p className="mt-0.5 font-mono-num text-xs font-semibold text-[#2D7A6E]">
                전체의 {peerStats.summary.topModePercent}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[#65606E]">가장 많이 탐색한 직무 1위</p>
              <p className="mt-1 text-sm font-bold text-[#232129]">
                {peerStats.summary.topRoleName}
              </p>
              <p className="mt-0.5 text-xs text-[#65606E]">
                단계별 고민 TOP 5 통계에서 확인
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Local Data Portability Bar */}
      <section className="mt-14 rounded-2xl border border-[#E6E1D8] bg-[#F3EFE8]/70 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h3 className="text-sm font-bold text-[#232129]">
              브라우저 로컬 데이터 관리
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#65606E]">
              모든 진단과 상담 기록은 서버 계정 없이 현재 브라우저에만 저장됩니다. 파일로
              내보내어 안전하게 보관하거나 다른 기기에서 이어서 불러올 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#232129] cursor-pointer hover:bg-[#FAF8F5]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#2D7A6E]" aria-hidden="true" />
              <span>샘플 데이터 체험</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#232129] cursor-pointer hover:bg-[#FAF8F5]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>JSON 백업</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#232129] cursor-pointer hover:bg-[#FAF8F5]"
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>백업 불러오기</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={onRequestReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E1D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#8F2A25] cursor-pointer hover:bg-[#FDF1F0]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>초기화</span>
            </button>
          </div>
        </div>
      </section>

      {/* Encouraging Closing Note */}
      <section className="mt-10 rounded-2xl border border-[#E6E1D8] bg-[#FBECE4]/45 px-6 py-9 text-center sm:px-10">
        <p className="font-display text-lg font-bold leading-relaxed text-[#232129] sm:text-xl">
          &ldquo;조급해하지 않아도 괜찮아요. 지금 고민한 시간만큼, 당신의 길은 이미 단단해지고 있습니다.&rdquo;
        </p>
        <p className="mt-2.5 text-xs text-[#65606E]">
          졸업과 취업의 문턱에서 방향을 찾는 모든 오늘을 온길이 응원합니다.
        </p>
      </section>
    </div>
  );
}

