# 택배기사 물류센터 배치 관리 시스템

## 프로젝트 개요
택배기사를 특정 물류센터에 배치해주는 서비스입니다. 관리자는 기사들의 근무 가능 여부를 확인하고 물류센터에 배치할 수 있으며, 기사들은 자신의 배치 상황을 확인하고 근무 가능 여부를 투표할 수 있습니다.

## 주요 기능
- 관리자/기사 계정 관리
- 물류센터 정보 관리
- 근무 가능 여부 투표
- 기사 배치 관리
- 배치 알림 시스템
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