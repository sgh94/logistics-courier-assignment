# 택배기사 물류센터 배치 관리 시스템

## 프로젝트 개요
택배기사를 특정 물류센터에 배치해주는 서비스입니다. 관리자는 기사들의 근무 가능 여부를 확인하고 물류센터에 배치할 수 있으며, 기사들은 자신의 배치 상황을 확인하고 근무 가능 여부를 투표할 수 있습니다.

## 주요 기능
- 관리자/기사 계정 관리
- 물류센터 정보 관리
- 근무 가능 여부 투표
- 기사 배치 관리
- 배치 알림 시스템 (이메일, SMS, 카카오톡)
- 통계 및 보고서

## 기술 스택
- Frontend: Next.js, React, TailwindCSS
- Backend: Supabase (PostgreSQL)
- Authentication: Supabase Auth, 소셜 로그인
- Deployment: Vercel

## 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

## 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 관리자 계정 생성
관리자 계정은 Supabase 데이터베이스에서 직접 생성해야 합니다:

1. `users` 테이블에서 해당 사용자의 `role` 값을 `admin`으로 변경
2. 일반 사용자가 회원가입할 때는 자동으로 `courier` 역할이 부여됨

## 시스템 특징

### 1. 투표 및 배치 시스템
- 택배기사는 특정 날짜에 근무 가능 여부를 투표할 수 있으며, 투표 시 다음 정보를 함께 제공할 수 있습니다:
  - 근무 가능 여부 (가능/불가능)
  - 특이사항 (오전만 가능, 특정 지역만 가능 등의 메모)
  - 선호 물류센터 (물류센터 목록에서 선택)
- 관리자는 다음과 같은 방식으로 배치를 관리할 수 있습니다:
  - 모든 택배기사를 배치할 수 있습니다 (투표 여부에 관계없이 가능)
  - 근무 가능으로 투표한 기사만 빠르게 선택할 수 있습니다.
  - 투표하지 않은 기사나 근무 불가로 투표한 기사도 필요시 배치 가능합니다.
  - 근무 불가로 투표한 기사를 선택시 경고 표시가 나타납니다.
  - 관리자는 기사들의 특이사항과 선호 물류센터 정보를 확인하여 배치에 참고할 수 있습니다.

### 2. 홈 화면
홈 화면에서는 실시간 데이터를 표시합니다:
- 오늘의 배치 수
- 투표 현황
- 이번달 총 배치 수
- 최근 활동 내역 (배치 및 투표)

## Supabase 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'courier')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id)
);
```

### logistics_centers 테이블
```sql
CREATE TABLE logistics_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  map_url TEXT,
  manager_name TEXT,
  manager_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

### votes 테이블
```sql
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  preferred_center_id UUID REFERENCES logistics_centers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(courier_id, date)
);
```

### assignments 테이블
```sql
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES users(id) NOT NULL,
  logistics_center_id UUID REFERENCES logistics_centers(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

### notification_settings 테이블
```sql
CREATE TABLE notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  kakao_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### notifications 테이블
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'cancellation', 'update', 'vote', 'general')),
  read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  kakao_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 권한 설정
Supabase에서 다음과 같은 RLS(Row Level Security) 정책을 설정해야 합니다:

1. users: 모든 사용자가 자신의 정보를 읽을 수 있으며, 관리자만 모든 사용자 정보에 접근 가능
2. logistics_centers: 모든 사용자가 읽을 수 있으며, 관리자만 생성/수정/삭제 가능
3. votes: 사용자는 자신의 투표만 생성/수정/조회 가능하며, 관리자는 모든 투표 조회 가능
4. assignments: 사용자는 자신의 배치만 조회 가능하며, 관리자는 모든 배치 생성/수정/삭제/조회 가능
5. notification_settings: 사용자는 자신의 설정만 조회/수정 가능하며, 관리자는 모든 설정 조회/수정 가능
6. notifications: 사용자는 자신의 알림만 조회 가능

## 문제 해결

### 로그인 및 인증
1. 회원가입 시 이메일 인증이 필요합니다. 사용자는 이메일에서 확인 링크를 클릭해야 로그인이 가능합니다.
2. 인증되지 않은 이메일로 로그인 시도 시 "이메일 인증이 필요합니다. 메일함을 확인해주세요." 메시지가 표시됩니다.
3. 회원가입은 택배기사 계정만 가능합니다. 관리자 계정은 데이터베이스에서 직접 생성해야 합니다.

### 로그인 과정
로그인 처리 과정의 흐름:
1. Supabase 인증을 통한 로그인
2. 인증 성공 시 사용자 프로필 데이터 로드
3. 프로필 검증 및 역할에 따른 라우팅 (관리자는 통계 페이지, 기사는 배치 페이지)

## 배포 방법
Vercel을 통해 쉽게 배포할 수 있습니다:

1. [Vercel](https://vercel.com) 계정 생성
2. 이 레포지토리와 연결
3. 환경 변수 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. 배포 버튼 클릭