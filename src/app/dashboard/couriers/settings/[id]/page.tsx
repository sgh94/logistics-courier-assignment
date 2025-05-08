'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '@/lib/auth';
import { getCourier, getCourierNotificationSettings, updateCourierNotificationSettings } from '@/lib/couriers';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiMail, FiMessageSquare, FiMessageCircle } from 'react-icons/fi';

interface PageProps {
  params: {
    id: string;
  };
}

export default function CourierSettingsPage({ params }: PageProps) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courier, setCourier] = useState<User | null>(null);
  const [settings, setSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    kakao_enabled: false
  });
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // 사용자 권한 확인
        const { user } = await getCurrentUser();
        
        if (!user || user.role !== 'admin') {
          setIsAdmin(false);
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
        
        // 기사 정보 가져오기
        const courierData = await getCourier(id);
        setCourier(courierData);
        
        // 알림 설정 가져오기
        const notificationSettings = await getCourierNotificationSettings(id);
        setSettings({
          email_enabled: notificationSettings.email_enabled,
          sms_enabled: notificationSettings.sms_enabled,
          kakao_enabled: notificationSettings.kakao_enabled
        });
      } catch (error) {
        console.error('Error loading courier data:', error);
        toast.error('기사 정보를 불러오는데 실패했습니다.');
        router.push('/dashboard/couriers');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id, router]);

  const handleToggleSetting = (setting: 'email_enabled' | 'sms_enabled' | 'kakao_enabled') => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateCourierNotificationSettings(id, settings);
      toast.success('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('알림 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin || !courier) {
    return null; // 이미 router.push로 리다이렉트 되어 있음
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/dashboard/couriers"
          className="mr-4 p-2 rounded-md text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold text-secondary-800">기사 알림 설정</h2>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="text-lg font-semibold">기사 정보</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-primary-100 text-primary-800 p-4 rounded-full h-16 w-16 flex items-center justify-center text-xl font-bold mb-4 md:mb-0 md:mr-6">
              {courier.name.substring(0, 2)}
            </div>
            <div>
              <h4 className="text-xl font-semibold text-secondary-800">{courier.name}</h4>
              <p className="text-secondary-600">{courier.email}</p>
              {courier.phone && <p className="text-secondary-500">{courier.phone}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">알림 채널 설정</h3>
        </div>
        <div className="card-body space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <FiMail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-secondary-800">이메일 알림</h4>
                <p className="text-sm text-secondary-500">배치 정보가 이메일로 전송됩니다.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.email_enabled} 
                onChange={() => handleToggleSetting('email_enabled')} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <FiMessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-secondary-800">SMS 알림</h4>
                <p className="text-sm text-secondary-500">배치 정보가 SMS로 전송됩니다.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.sms_enabled} 
                onChange={() => handleToggleSetting('sms_enabled')} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full mr-4">
                <FiMessageCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-secondary-800">카카오톡 알림</h4>
                <p className="text-sm text-secondary-500">배치 정보가 카카오톡으로 전송됩니다.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.kakao_enabled} 
                onChange={() => handleToggleSetting('kakao_enabled')} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 h-5 w-5" />
                  설정 저장하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}