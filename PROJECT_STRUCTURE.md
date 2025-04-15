# 프로젝트 구조

## 디렉토리 구조

```
logistics-courier-assignment/
│
├── src/
│   ├── app/                      # Next.js App 디렉토리
│   │   ├── globals.css           # 전역 스타일
│   │   ├── layout.tsx            # 최상위 레이아웃
│   │   ├── page.tsx              # 메인 페이지
│   │   ├── login/                # 로그인 페이지
│   │   ├── signup/               # 회원가입 페이지
│   │   └── dashboard/            # 대시보드 관련 페이지
│   │       ├── layout.tsx        # 대시보드 레이아웃
│   │       ├── page.tsx          # 대시보드 메인
│   │       ├── assignments/      # 배치 관리
│   │       ├── couriers/         # 기사 관리
│   │       ├── logistics-centers/# 물류센터 관리
│   │       ├── votes/            # 투표 관리
│   │       └── statistics/       # 통계
│   │
│   ├── components/               # 재사용 가능한 컴포넌트
│   │   └── layout/               # 레이아웃 관련 컴포넌트
│   │       └── DashboardLayout.tsx
│   │
│   └── lib/                      # 유틸리티 및 API 함수
│       ├── supabase.ts           # Supabase 클라이언트 및 타입 정의
│       ├── auth.ts               # 인증 관련 함수
│       ├── centers.ts            # 물류센터 관련 함수
│       ├── assignments.ts        # 배치 관련 함수
│       ├── votes.ts              # 투표 관련 함수
│       ├── couriers.ts           # 기사 관련 함수
│       └── notifications.ts      # 알림 관련 함수
│
├── public/                       # 정적 파일
├── package.json                  # 프로젝트 의존성
├── tsconfig.json                 # TypeScript 설정
├── next.config.mjs               # Next.js 설정
├── postcss.config.js             # PostCSS 설정
└── tailwind.config.js            # Tailwind CSS 설정
```

## 주요 파일 설명

### 메인 페이지 및 인증
- **src/app/page.tsx**: 랜딩 페이지
- **src/app/login/page.tsx**: 로그인 페이지
- **src/app/signup/page.tsx**: 회원가입 페이지
- **src/lib/auth.ts**: 인증 관련 유틸리티 함수

### 대시보드
- **src/app/dashboard/layout.tsx**: 대시보드 공통 레이아웃
- **src/app/dashboard/page.tsx**: 대시보드 메인 화면
- **src/components/layout/DashboardLayout.tsx**: 대시보드 레이아웃 컴포넌트

### 배치 관리
- **src/app/dashboard/assignments/page.tsx**: 배치 목록 조회
- **src/app/dashboard/assignments/new/page.tsx**: 새 배치 생성
- **src/lib/assignments.ts**: 배치 관련 API 함수

### 기사 관리
- **src/app/dashboard/couriers/page.tsx**: 기사 목록 조회
- **src/app/dashboard/couriers/settings/[id]/page.tsx**: 기사 알림 설정
- **src/lib/couriers.ts**: 기사 관련 API 함수

### 물류센터 관리
- **src/app/dashboard/logistics-centers/page.tsx**: 물류센터 목록 조회
- **src/app/dashboard/logistics-centers/new/page.tsx**: 새 물류센터 추가
- **src/app/dashboard/logistics-centers/edit/[id]/page.tsx**: 물류센터 수정
- **src/lib/centers.ts**: 물류센터 관련 API 함수

### 투표 관리
- **src/app/dashboard/votes/page.tsx**: 투표 관리 화면
- **src/lib/votes.ts**: 투표 관련 API 함수

### 통계
- **src/app/dashboard/statistics/page.tsx**: 통계 화면

### 알림 시스템
- **src/lib/notifications.ts**: 알림 관련 유틸리티 함수

## 데이터 모델

### 사용자 (User)
- 역할: admin(관리자) 또는 courier(택배기사)
- 기본 정보: 이름, 이메일, 전화번호

### 물류센터 (LogisticsCenter)
- 기본 정보: 이름, 설명, 주소
- 부가 정보: 지도 URL, 관리자 이름, 관리자 연락처

### 투표 (Vote)
- 기사가 특정 날짜에 근무 가능 여부 표시
- 기사 ID, 날짜, 가능 여부로 구성

### 배치 (Assignment)
- 기사, 물류센터, 날짜, 시간 정보로 구성
- 관리자가 생성, 기사는 조회만 가능

### 알림 설정 (NotificationSettings)
- 사용자별 알림 채널 설정 (이메일, SMS, 카카오톡)

### 알림 (Notification)
- 배치, 취소, 업데이트 등의 이벤트에 대한 알림
- 발송 상태 추적