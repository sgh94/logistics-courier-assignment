"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser, User } from '@/lib/auth';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon, label, active }) => {
  return (
    <Link
      href={href}
      className={`flex items-center p-2 rounded-md ${
        active
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    async function loadUser() {
      try {
        const { user } = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error loading user in sidebar:', error);
      }
    }
    
    loadUser();
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">물류 배치 관리</h3>
      </div>
      <nav className="space-y-1">
        <SidebarLink
          href="/dashboard"
          icon={<span className="text-xl">📊</span>}
          label="홈"
          active={isActive('/dashboard') && pathname === '/dashboard'}
        />
        
        {/* 관리자와 기사 모두에게 보이는 메뉴 */}
        <SidebarLink
          href="/dashboard/assignments"
          icon={<span className="text-xl">📦</span>}
          label="배치 관리"
          active={isActive('/dashboard/assignments')}
        />
        
        {/* 관리자에게만 보이는 메뉴 */}
        {isAdmin && (
          <>
            <SidebarLink
              href="/dashboard/logistics-centers"
              icon={<span className="text-xl">🏢</span>}
              label="물류센터 관리"
              active={isActive('/dashboard/logistics-centers')}
            />
            <SidebarLink
              href="/dashboard/couriers"
              icon={<span className="text-xl">🚚</span>}
              label="기사 관리"
              active={isActive('/dashboard/couriers')}
            />
            <SidebarLink
              href="/dashboard/votes"
              icon={<span className="text-xl">📝</span>}
              label="투표 관리"
              active={isActive('/dashboard/votes')}
            />
            <SidebarLink
              href="/dashboard/statistics"
              icon={<span className="text-xl">📈</span>}
              label="통계"
              active={isActive('/dashboard/statistics')}
            />
          </>
        )}
        
        {/* 기사에게만 보이는 메뉴 */}
        {!isAdmin && (
          <SidebarLink
            href="/dashboard/votes"
            icon={<span className="text-xl">📝</span>}
            label="근무 투표"
            active={isActive('/dashboard/votes')}
          />
        )}
        
        {/* 정산 관리 섹션 - 관리자에게만 표시 */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-2">정산 관리</h3>
            <SidebarLink
              href="/dashboard/settlements"
              icon={<span className="text-xl">💰</span>}
              label="전체 정산"
              active={isActive('/dashboard/settlements') && !pathname.includes('/new')}
            />
            <SidebarLink
              href="/dashboard/settlements/new?type=kurly"
              icon={<span className="text-xl">🛒</span>}
              label="컬리 정산 추가"
              active={pathname?.includes('/dashboard/settlements/new') && pathname?.includes('type=kurly')}
            />
            <SidebarLink
              href="/dashboard/settlements/new?type=coupang"
              icon={<span className="text-xl">📦</span>}
              label="쿠팡 정산 추가"
              active={pathname?.includes('/dashboard/settlements/new') && pathname?.includes('type=coupang')}
            />
            <SidebarLink
              href="/dashboard/settlements/new?type=general"
              icon={<span className="text-xl">📑</span>}
              label="편집용 정산 추가"
              active={pathname?.includes('/dashboard/settlements/new') && pathname?.includes('type=general')}
            />
          </div>
        )}
        
        {/* 기사용 정산 섹션 - 기사에게만 표시 */}
        {!isAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-2">정산 조회</h3>
            <SidebarLink
              href="/dashboard/settlements"
              icon={<span className="text-xl">💰</span>}
              label="정산 내역"
              active={isActive('/dashboard/settlements')}
            />
          </div>
        )}
      </nav>
    </aside>
  );
}