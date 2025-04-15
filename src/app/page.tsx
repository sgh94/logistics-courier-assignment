import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-6">택배기사 물류센터 배치 관리</h1>
        <p className="text-lg mb-8 text-secondary-600">
          택배기사를 효율적으로 물류센터에 배치하고 관리하는 시스템입니다.
        </p>
        <div className="flex flex-col gap-4">
          <Link 
            href="/login" 
            className="btn-primary text-center"
          >
            로그인하기
          </Link>
          <Link 
            href="/signup" 
            className="btn-secondary text-center"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}