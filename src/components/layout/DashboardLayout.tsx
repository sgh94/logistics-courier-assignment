'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, signOut, User } from '@/lib/auth';
import toast from 'react-hot-toast';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiUsers, 
  FiMap,
  FiCalendar, 
  FiLogOut,
  FiPieChart,
  FiSettings,
  FiDollarSign
} from 'react-icons/fi';
import Sidebar from './Sidebar';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user) {
          toast.error('로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('사용자 정보를 불러오는데 실패했습니다.');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast.error('로그아웃 중 오류가 발생했습니다.');
        return;
      }
      
      toast.success('로그아웃 되었습니다.');
      router.push('/login');
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 모바일 터치 이벤트 핸들러
  const handleNavItemClick = (href: string) => {
    router.push(href);
    setIsSidebarOpen(false); // 네비게이션 후 사이드바 닫기
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  const navigationItems = [
    { name: '홈', href: '/dashboard', icon: FiHome },
    ...(isAdmin
      ? [
          { name: '기사 관리', href: '/dashboard/couriers', icon: FiUsers },
          { name: '물류센터 관리', href: '/dashboard/logistics-centers', icon: FiMap },
        ]
      : []),
    { name: '배치 현황', href: '/dashboard/assignments', icon: FiCalendar },
    { name: '근무 투표', href: '/dashboard/votes', icon: FiCalendar },
    ...(isAdmin
      ? [
          { name: '통계', href: '/dashboard/statistics', icon: FiPieChart },
          { name: '설정', href: '/dashboard/settings', icon: FiSettings },
          { name: '정산 관리', href: '/dashboard/settlements', icon: FiDollarSign },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Mobile sidebar overlay - Only visible when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 z-50 lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="sr-only">사이드바 닫기</span>
            <FiX className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-primary-700">물류센터 배치 관리</h1>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {navigationItems.map((item) => (
              <div
                key={item.name}
                onClick={() => handleNavItemClick(item.href)}
                className={`group flex items-center px-2 py-3 text-base font-medium rounded-md cursor-pointer min-h-[48px] ${
                  pathname?.startsWith(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                }`}
              >
                <item.icon
                  className={`mr-4 flex-shrink-0 h-6 w-6 ${
                    pathname?.startsWith(item.href) ? 'text-primary-700' : 'text-secondary-400 group-hover:text-secondary-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-secondary-200 p-4">
          <div className="flex items-center w-full">
            <div className="flex-1">
              <div className="text-base font-medium text-secondary-700">{user.name}</div>
              <div className="text-sm font-medium text-secondary-500">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-3 rounded-full text-secondary-400 hover:text-secondary-500 active:text-secondary-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <FiLogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-secondary-200 text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">사이드바 열기</span>
            <FiMenu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-secondary-900">
                {navigationItems.find((item) => pathname?.startsWith(item.href))?.name || '대시보드'}
              </h1>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}