import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { NavTab } from '../types/career';
import { OngilLogo } from './OngilLogo';

interface NavbarProps {
  activeTab: NavTab;
  hasDiagnosis: boolean;
  onNavigate: (tab: NavTab) => void;
  onPrimaryCta: () => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string }> = [
  { id: 'home', label: '홈' },
  { id: 'assessment', label: '성향 진단' },
  { id: 'counseling', label: 'AI 진로 상담' },
  { id: 'blueprint', label: '커리어 설계' },
  { id: 'stats', label: '상담 통계' },
];

export function Navbar({
  activeTab,
  hasDiagnosis,
  onNavigate,
  onPrimaryCta,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#E6E1D8] bg-[#FAF8F5]/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-5 sm:px-8">
        {/* Zone 1: Clean Brand emblem + single-line wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-[#232129] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2D7A6E]"
        >
          <OngilLogo />
          <span>온길</span>
        </button>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#65606E]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2D7A6E] ${
                  isActive
                    ? 'font-semibold text-[#232129]'
                    : 'hover:text-[#232129]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[21px] h-[2px] bg-[#2D7A6E]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onPrimaryCta();
            }}
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-[#2D7A6E] px-4 py-2 text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 hover:bg-[#246258] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
          >
            {hasDiagnosis ? '진단 리포트 보기' : '성향 진단 시작'}
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6E1D8] bg-white text-[#232129] md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E6E1D8] bg-[#FAF8F5] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E7F3F0] font-semibold text-[#2D7A6E]'
                      : 'text-[#232129] hover:bg-[#F3EFE8]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onPrimaryCta();
              }}
              className="mt-2 w-full rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {hasDiagnosis ? '진단 리포트 보기' : '성향 진단 시작'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
