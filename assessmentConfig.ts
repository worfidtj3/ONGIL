import type {
  AssessmentInput,
  AxisKey,
  CounselingMode,
  OngilWorkspaceState,
  UserStage,
} from '../types/career';

export const USER_STAGES: UserStage[] = [
  '저학년 탐색기 (1~2학년)',
  '전공 심화·대외활동기 (3학년)',
  '졸업 예정·인턴 준비기 (4학년)',
  '실전 취업 준비생·졸업생',
];

export interface AptitudeQuestion {
  id: string;
  axis: AxisKey;
  axisLabel: string;
  prompt: string;
  lowLabel: string;
  highLabel: string;
}

export const AXIS_LABELS: Record<AxisKey, string> = {
  inquiry: '탐구·분석',
  creativity: '창의·표현',
  people: '사람·소통',
  execution: '체계·실행',
  leadership: '주도·전략',
  technical: '기술·구현',
};

export const APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  {
    id: 'q1',
    axis: 'inquiry',
    axisLabel: '탐구·분석',
    prompt: '문제가 생기면 현상 뒤에 숨은 원인과 데이터 패턴을 끝까지 파헤쳐 보는 편이다.',
    lowLabel: '직관으로 빠르게 판단',
    highLabel: '원인·근거를 깊이 분석',
  },
  {
    id: 'q2',
    axis: 'inquiry',
    axisLabel: '탐구·분석',
    prompt: '복잡한 자료나 사용자 반응을 정리해 핵심 인사이트를 도출할 때 재미를 느낀다.',
    lowLabel: '정리·분석은 피로함',
    highLabel: '인사이트 도출이 즐거움',
  },
  {
    id: 'q3',
    axis: 'creativity',
    axisLabel: '창의·표현',
    prompt: '정해진 틀을 따르기보다 나만의 시각이나 스토리로 아이디어를 새롭게 빚어내는 편이다.',
    lowLabel: '검증된 방식 선호',
    highLabel: '새로운 시도 선호',
  },
  {
    id: 'q4',
    axis: 'creativity',
    axisLabel: '창의·표현',
    prompt: '글, 시각 자료, 기획안 등을 통해 추상적인 생각을 남이 이해하기 쉽게 표현하는 걸 좋아한다.',
    lowLabel: '실무 처리 중심',
    highLabel: '콘텐츠·표현 작업 선호',
  },
  {
    id: 'q5',
    axis: 'people',
    axisLabel: '사람·소통',
    prompt: '팀 프로젝트나 동아리에서 사람들의 의견을 듣고 서로의 입장을 조율하는 역할을 자주 맡는다.',
    lowLabel: '혼자 맡은 몫에 집중',
    highLabel: '소통·조율 역할 선호',
  },
  {
    id: 'q6',
    axis: 'people',
    axisLabel: '사람·소통',
    prompt: '누군가의 고민이나 불편함을 듣고, 상대에게 도움이 되는 해결책을 함께 찾을 때 보람을 느낀다.',
    lowLabel: '과업 완수 자체에 보람',
    highLabel: '사람과의 연결에 보람',
  },
  {
    id: 'q7',
    axis: 'execution',
    axisLabel: '체계·실행',
    prompt: '일정표, 체크리스트, 폴더 정리 등 일의 순서와 완성도를 꼼꼼하게 챙기는 편이다.',
    lowLabel: '유연하고 즉흥적인 편',
    highLabel: '체계적·꼼꼼한 관리',
  },
  {
    id: 'q8',
    axis: 'execution',
    axisLabel: '체계·실행',
    prompt: '큰 그림을 그리는 것만큼, 세운 계획이 마감 기한 안에 차질 없이 굴러가게 만드는 데 강하다.',
    lowLabel: '아이디어 발산 위주',
    highLabel: '안정적 완수·운영 위주',
  },
  {
    id: 'q9',
    axis: 'leadership',
    axisLabel: '주도·전략',
    prompt: '불확실한 상황에서도 목표와 우선순위를 먼저 정하고 팀이 나아갈 방향을 제안하는 편이다.',
    lowLabel: '정해진 목표 실행 선호',
    highLabel: '방향 설정·리딩 선호',
  },
  {
    id: 'q10',
    axis: 'leadership',
    axisLabel: '주도·전략',
    prompt: '성과 지표나 시장의 흐름을 보며 "어떻게 하면 더 큰 임팩트를 만들까" 고민하는 걸 즐긴다.',
    lowLabel: '주어진 과업의 질 집중',
    highLabel: '비즈니스·전략 임팩트 관심',
  },
  {
    id: 'q11',
    axis: 'technical',
    axisLabel: '기술·구현',
    prompt: '새로운 디지털 도구, 코딩, 데이터 툴 등을 직접 만져보며 작동 원리를 익히는 데 거부감이 없다.',
    lowLabel: '익숙한 도구 위주 사용',
    highLabel: '새 기술·도구 습득 즐거움',
  },
  {
    id: 'q12',
    axis: 'technical',
    axisLabel: '기술·구현',
    prompt: '아이디어 단계에서 멈추지 않고 프로토타입이나 실제 작동하는 결과물을 손으로 만들어 내고 싶다.',
    lowLabel: '기획·커뮤니케이션 위주',
    highLabel: '직접 제작·구현 위주',
  },
];

export const CAREER_VALUES = [
  '자율성과 유연한 업무 환경',
  '빠른 성장과 새로운 도전',
  '안정성과 예측 가능한 삶',
  '사회적 의미와 긍정적 기여',
  '깊은 전문성과 직무 숙련도',
  '동료와의 따뜻하고 수평적인 협업',
  '성과에 따른 합리적 보상',
  '주도적으로 의사결정하는 영향력',
];

export const COUNSELING_MODES: Array<{
  id: CounselingMode;
  label: string;
  description: string;
  starterPrompts: string[];
}> = [
  {
    id: 'explore',
    label: '직무 탐색 및 방향 설정',
    description: '성향과 강점을 바탕으로 나에게 맞는 직무 후보를 구체적으로 비교하고 좁혀봅니다.',
    starterPrompts: [
      '추천 직무 3가지 중 대학생 인턴으로 가장 진입하기 현실적인 직무는 무엇인가요?',
      '제가 가진 성향이 실제 직무의 하루 일과와 어떻게 맞물리는지 궁금해요.',
      '비슷해 보이는 두 직무의 커리어 성장 경로 차이를 알려주세요.',
    ],
  },
  {
    id: 'major',
    label: '전공·복수전공 연결 전략',
    description: '현재 전공을 살리거나 복수전공·교내 프로젝트로 직무와 연결하는 다리를 놓습니다.',
    starterPrompts: [
      '제 전공을 살리면서도 원하는 직무로 이어질 수 있는 차별화 포인트가 있을까요?',
      '복수전공이나 부전공을 고민 중인데, 실제로 채용에서 얼마나 도움이 될까요?',
      '전공 수업 과제를 직무 포트폴리오 소재로 바꾸는 방법이 궁금합니다.',
    ],
  },
  {
    id: 'strategy',
    label: '인턴·포트폴리오·취준 전략',
    description: '남은 학기나 취준 기간 동안 무엇을 먼저 채우고 어떻게 어필할지 현실적인 전략을 세웁니다.',
    starterPrompts: [
      '지금 당장 이번 학기·방학에 집중해야 할 스펙 우선순위 2가지를 정해주세요.',
      '경험이 많지 않은데 자기소개서와 포트폴리오 첫 장을 어떻게 구성하면 좋을까요?',
      '현직자처럼 보이는 사이드 프로젝트 주제를 어떻게 잡으면 좋을까요?',
    ],
  },
  {
    id: 'mental',
    label: '진로 불안 및 번아웃 케어',
    description: '남들과 비교하며 지치거나 방향을 잃었을 때, 마음을 다독이고 다시 걸을 힘을 찾습니다.',
    starterPrompts: [
      '주변 친구들은 다 방향을 정한 것 같아서 저만 뒤처지는 기분이 들어요.',
      '이 직무가 정말 내가 원하는 길인지 확신이 서지 않아 시작하기가 두려워요.',
      '취업 준비가 길어지면서 번아웃이 온 것 같은데, 루틴을 어떻게 재정비할까요?',
    ],
  },
];

export function computeAxisAverages(answers: Record<string, number>) {
  const buckets: Record<AxisKey, number[]> = {
    inquiry: [],
    creativity: [],
    people: [],
    execution: [],
    leadership: [],
    technical: [],
  };

  for (const q of APTITUDE_QUESTIONS) {
    const val = answers[q.id] ?? 3;
    buckets[q.axis].push(val);
  }

  return (Object.keys(AXIS_LABELS) as AxisKey[]).map((key) => {
    const arr = buckets[key];
    const avg = arr.length > 0 ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 3;
    const rawScore = Math.round(((avg - 1) / 4) * 70 + 25);
    return {
      key,
      label: AXIS_LABELS[key],
      rawScore: Math.max(20, Math.min(98, rawScore)),
    };
  });
}

export const EMPTY_ASSESSMENT_INPUT: AssessmentInput = {
  nickname: '',
  stage: '전공 심화·대외활동기 (3학년)',
  major: '',
  workPreference: '상황에 따라 유연하게 조율하는 균형형',
  answers: Object.fromEntries(APTITUDE_QUESTIONS.map((q) => [q.id, 3])),
  selectedValues: [],
  currentWorry: '',
};

export const SAMPLE_ONGIL_STATE: OngilWorkspaceState = {
  version: 1,
  isSampleData: true,
  assessmentInput: {
    nickname: '서연',
    stage: '전공 심화·대외활동기 (3학년)',
    major: '미디어커뮤니케이션학 (데이터사이언스 부전공)',
    workPreference: '팀과 활발히 소통하는 협업형',
    answers: {
      q1: 5,
      q2: 5,
      q3: 4,
      q4: 4,
      q5: 4,
      q6: 5,
      q7: 4,
      q8: 3,
      q9: 4,
      q10: 4,
      q11: 4,
      q12: 3,
    },
    selectedValues: [
      '사회적 의미와 긍정적 기여',
      '동료와의 따뜻하고 수평적인 협업',
      '깊은 전문성과 직무 숙련도',
    ],
    currentWorry:
      '글쓰기와 사람 인터뷰도 좋아하고 데이터 분석 부전공도 재미있는데, 두 가지를 모두 살릴 수 있는 직무가 무엇일지 고민됩니다. 4학년 전에 어떤 포트폴리오를 만들어야 할지도 막막해요.',
  },
  diagnosisReport: {
    generatedAt: '2026-11-18T09:30:00.000Z',
    personaTitle: '사람의 마음을 데이터로 읽어내는 공감형 스토리텔러',
    personaSummary:
      '서연 님은 사용자의 맥락을 깊이 관찰하고(탐구·분석) 이를 다른 사람이 이해하기 쉬운 언어와 구조로 번역해 내는 힘(사람·소통, 창의·표현)이 뛰어납니다. 인문학적 공감과 데이터 기반 사고가 만나는 접점에서 가장 큰 몰입과 경쟁력을 발휘하는 유형입니다.',
    axes: [
      {
        key: 'inquiry',
        label: '탐구·분석',
        score: 92,
        comment: '현상의 원인과 사용자 행동 패턴을 근거 중심으로 해석하는 힘이 가장 돋보입니다.',
      },
      {
        key: 'people',
        label: '사람·소통',
        score: 86,
        comment: '타인의 니즈를 경청하고 팀 내 의견을 따뜻하게 조율하는 협업 에너지가 높습니다.',
      },
      {
        key: 'creativity',
        label: '창의·표현',
        score: 79,
        comment: '분석한 내용을 읽기 좋은 스토리와 기획안으로 재구성하는 표현력을 갖췄습니다.',
      },
      {
        key: 'leadership',
        label: '주도·전략',
        score: 76,
        comment: '문제의 우선순위를 짚어내고 프로젝트의 큰 방향을 제안하는 시야가 열려 있습니다.',
      },
      {
        key: 'execution',
        label: '체계·실행',
        score: 71,
        comment: '꼼꼼하게 계획을 세우지만, 아이디어 탐색에 시간을 쓰다 마감이 촉박해질 수 있어 주의가 필요합니다.',
      },
      {
        key: 'technical',
        label: '기술·구현',
        score: 70,
        comment: '데이터 툴과 디지털 도구를 두려워하지 않고 실무 목적에 맞게 활용하는 유연함이 있습니다.',
      },
    ],
    strengthKeywords: ['사용자 맥락 해석', '정량·정성 결합 사고', '공감 기반 커뮤니케이션', '구조화된 문서화'],
    watchOut:
      '완벽한 근거가 모일 때까지 결정을 미루거나, 기획·분석·소통을 모두 잘하려다 포트폴리오의 핵심 주제가 흐려질 수 있어요. 이번 학기에는 가장 자신 있는 문제 해결 사례 1개를 끝까지 완성하는 데 집중해 보세요.',
    recommendedRoles: [
      {
        roleName: 'UX 리서처 (사용자 경험 연구원)',
        category: '프로덕트 · 리서치',
        fitScore: 94,
        fitReason:
          '인터뷰·관찰이라는 정성적 공감 능력과 설문·로그 분석이라는 부전공 역량을 가장 이상적으로 결합할 수 있는 직무입니다.',
        coreCompetencies: ['유저 인터뷰 설계', '정성·정성 데이터 통합 분석', '인사이트 리포트 스토리텔링'],
        starterAction: '자주 쓰는 캠퍼스 앱 1개를 골라 주변 학생 5명 인터뷰 후 개선 리포트 작성하기',
      },
      {
        roleName: '프로덕트 매니저 / 서비스 기획자 (PM)',
        category: '서비스 기획 · 전략',
        fitScore: 89,
        fitReason:
          '문제 정의, 우선순위 결정, 디자이너·개발자와의 원활한 조율이라는 강점이 직무 핵심 역량과 맞닿아 있습니다.',
        coreCompetencies: ['사용자 문제 정의', '지표 기반 가설 수립', '협업 커뮤니케이션 및 문서화'],
        starterAction: '교내 팀 프로젝트에서 문제 정의서와 핵심 지표(KPI) 초안을 직접 작성해 주도하기',
      },
      {
        roleName: 'CRM · 그로스 마케터',
        category: '데이터 마케팅 · 그로스',
        fitScore: 84,
        fitReason:
          '미디어 커뮤니케이션 전공의 메시지 감각과 데이터 분석 역량을 활용해 고객 여정을 설계하고 실험할 수 있습니다.',
        coreCompetencies: ['고객 세그먼트 분석', 'A/B 테스트 설계', '카피라이팅 및 전환율 개선'],
        starterAction: 'GA4 기초 또는 SQL 데이터 추출 실습과 함께 가상의 캠페인 퍼널 분석표 만들어 보기',
      },
    ],
    suggestedQuestions: [
      'UX 리서처와 서비스 기획자(PM) 중 신입 채용 문이 더 넓은 쪽은 어디인가요?',
      '미디어 전공과 데이터 부전공을 포트폴리오 한 장에 어떻게 설득력 있게 엮을까요?',
      '3학년 2학기부터 졸업 전까지 인턴 지원 타이밍을 어떻게 잡는 게 좋을까요?',
      '코딩 실력이 아주 깊지 않아도 데이터 기반 직무에 지원할 수 있나요?',
    ],
  },
  sessions: [
    {
      id: 'sample-session-1',
      title: 'UX 리서처 vs 서비스 기획자 방향 고민',
      mode: 'explore',
      targetRole: 'UX 리서처 (사용자 경험 연구원)',
      createdAt: '2026-11-18T10:00:00.000Z',
      updatedAt: '2026-11-18T10:12:00.000Z',
      messages: [
        {
          id: 'm1',
          role: 'user',
          text: '진단 결과를 보니 UX 리서처와 서비스 기획자(PM) 둘 다 잘 어울린다고 나왔어요. 대학생 입장에서 두 직무 중 어떤 기준으로 방향을 정하는 게 좋을까요?',
          timestamp: '2026-11-18T10:00:00.000Z',
        },
        {
          id: 'm2',
          role: 'model',
          text: `서연 님의 **탐구·분석(92점)**과 **사람·소통(86점)** 조합을 보면 두 직무 모두 매력적인 선택지예요. 다만 실제 취업 시장과 일하는 재미 측면에서 2가지 기준으로 구분해 보시면 결정이 훨씬 쉬워집니다.

**1. 에너지가 채워지는 순간으로 구분하기**
- **UX 리서처**: "사람들이 왜 여기서 멈칫할까?"를 끝까지 파고들어 **진짜 원인과 통찰**을 발견할 때 희열을 느낀다면 잘 맞아요.
- **서비스 기획자(PM)**: 발견한 문제를 바탕으로 "그래서 무엇을 먼저 만들지?"를 결정하고, **일정·리소스·팀을 조율해 출시**까지 밀고 나가는 과정이 즐겁다면 PM이 적합합니다.

**2. 대학생·신입 채용 현실 고려하기**
국내 신입 채용에서는 순수 'UX 리서처' 포지션 수가 PM/서비스 기획자보다 적은 편이에요. 따라서 **"사용자 리서치에 강점을 가진 서비스 기획자(PM)"**로 포지셔닝하되, 리서치 전문팀이 있는 기업에는 UX 리서처로도 지원할 수 있도록 **문제 발견(리서치) → 가설 수립 → 개선안 제안**까지 연결된 케이스 스터디를 1~2개 만들어 두는 전략을 추천해요.

서연 님은 지난 팀 프로젝트에서 '원인을 찾아 정리하는 과정'과 '일정·역할을 정해 출시하는 과정' 중 어느 쪽이 더 즐거우셨나요?`,
          timestamp: '2026-11-18T10:01:00.000Z',
        },
      ],
    },
  ],
  activeSessionId: 'sample-session-1',
  blueprint: {
    targetRole: 'UX 리서처 (사용자 경험 연구원)',
    updatedAt: '2026-11-18T10:15:00.000Z',
    reflectionMemo:
      '단순히 설문만 돌리는 리서치가 아니라, 데이터 부전공 지식을 활용해 정량 지표와 정성 인터뷰를 연결하는 나만의 강점을 케이스 스터디로 보여주자.',
    phases: [
      {
        id: 'sp-1',
        phaseTitle: '1단계 · 직무 이해 및 탐색 다지기',
        periodLabel: '지금 ~ 1개월',
        summary: '채용공고 분석과 현직자 관점 학습으로 직무 기준선을 세웁니다.',
        items: [
          {
            id: 'si-1',
            title: 'UX 리서처·PM 채용공고 10건 스크랩 및 공통 역량 정리',
            detail: '자격요건과 우대사항에서 반복되는 키워드(SQL, 인터뷰 설계, 실험 등) 5개를 추려 내 현재 수준과 비교하기',
            dueLabel: '2주 차',
            completed: true,
          },
          {
            id: 'si-2',
            title: '자주 쓰는 앱 1곳의 온보딩 불편 지점 미니 리서치 기획',
            detail: '캠퍼스 지인 5명을 대상으로 15분 사용성 테스트 질문지 작성하기',
            dueLabel: '3주 차',
            completed: false,
          },
          {
            id: 'si-3',
            title: '데이터 부전공 SQL/통계 과제 1건을 사용자 행동 해석 관점으로 재정리',
            detail: '단순 수치 요약이 아니라 "왜 이런 패턴이 나왔는가" 중심의 1페이지 인사이트 요약 추가',
            dueLabel: '4주 차',
            completed: false,
          },
        ],
      },
      {
        id: 'sp-2',
        phaseTitle: '2단계 · 실전 경험 및 케이스 스터디 구축',
        periodLabel: '이번 학기 (2~4개월)',
        summary: '말이 아닌 결과물로 역량을 증명할 핵심 포트폴리오 프로젝트를 완성합니다.',
        items: [
          {
            id: 'si-4',
            title: '미니 리서치 결과를 개선 와이어프레임까지 연결한 케이스 스터디 작성',
            detail: '배경 → 리서치 설계 → 핵심 발견 3가지 → 개선 제안 → 예상 지표 변화 구조로 노션/PDF 정리',
            dueLabel: '중간고사 이후',
            completed: false,
          },
          {
            id: 'si-5',
            title: '교내 IT 연합 동아리 또는 산학 프로젝트에서 리서처/PM 역할 지원',
            detail: '디자이너·개발자와 실제로 협업하며 의사결정 문서를 작성한 경험 확보하기',
            dueLabel: '학기 중',
            completed: false,
          },
          {
            id: 'si-6',
            title: '리서치/기획 포트폴리오 초안 작성 및 피드백 받기',
            detail: '선배 또는 교내 취업지원센터 멘토링 활용해 읽기 흐름 점검하기',
            dueLabel: '방학 직전',
            completed: false,
          },
        ],
      },
      {
        id: 'sp-3',
        phaseTitle: '3단계 · 인턴 지원 및 실전 도약',
        periodLabel: '방학 · 지원 시즌',
        summary: '실무 현장에서 검증받고 지원 서류와 면접 답변을 정교화합니다.',
        items: [
          {
            id: 'si-7',
            title: '스타트업·IT 서비스 직무 체험형 인턴 5~8곳 지원',
            detail: '직무명(UX 리서처, 서비스 기획자, CX 기획)을 유연하게 열어두고 지원하기',
            dueLabel: '방학 1개월 전',
            completed: false,
          },
          {
            id: 'si-8',
            title: 'STAR 기법 기반 직무 경험 답변 6개 정리',
            detail: '갈등 조율, 데이터 기반 설득, 실패에서 배운 점 에피소드 구조화하기',
            dueLabel: '지원 직전',
            completed: false,
          },
          {
            id: 'si-9',
            title: '기업별 서비스 사용성 사전 분석 노트 1페이지씩 준비',
            detail: '면접에서 해당 서비스의 강점과 개선 아이디어를 근거 있게 이야기할 수 있도록 준비',
            dueLabel: '면접 전',
            completed: false,
          },
        ],
      },
    ],
    insights: [
      {
        id: 'ins-1',
        content:
          '신입 채용에서는 "사용자 리서치에 강점을 가진 서비스 기획자(PM)"로 포지셔닝해 문제 발견(리서치) → 가설 수립 → 개선안 제안까지 연결된 케이스 스터디를 1~2개 만드는 전략이 유리합니다.',
        sourceSessionTitle: 'UX 리서처 vs 서비스 기획자 방향 고민',
        createdAt: '2026-11-18T10:05:00.000Z',
      },
    ],
  },
};
