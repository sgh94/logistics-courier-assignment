import { supabase } from './supabase';
import { getCourierNotificationSettings } from './couriers';

// 알림 발송 함수
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'assignment' | 'cancellation' | 'update' | 'vote' | 'general'
) {
  try {
    // 사용자 알림 설정 가져오기
    const settings = await getCourierNotificationSettings(userId);
    
    // 알림 로그 저장
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type,
        sms_sent: false,
        email_sent: false,
        kakao_sent: false
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification log:', error);
      throw error;
    }
    
    // 실제 알림 발송 (외부 API 연동 필요)
    if (settings.email_enabled) {
      await sendEmailNotification(userId, title, message);
      
      // 이메일 발송 상태 업데이트
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notification.id);
    }
    
    if (settings.sms_enabled) {
      await sendSmsNotification(userId, message);
      
      // SMS 발송 상태 업데이트
      await supabase
        .from('notifications')
        .update({ sms_sent: true })
        .eq('id', notification.id);
    }
    
    if (settings.kakao_enabled) {
      await sendKakaoNotification(userId, title, message);
      
      // 카카오톡 발송 상태 업데이트
      await supabase
        .from('notifications')
        .update({ kakao_sent: true })
        .eq('id', notification.id);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// 이메일 알림 발송 함수 (실제 구현은 별도 서비스 연동 필요)
async function sendEmailNotification(userId: string, title: string, message: string) {
  // 실제 구현에서는 이메일 발송 API 연동 (예: Sendgrid, AWS SES 등)
  // 현재는 임시 구현
  console.log(`📧 이메일 알림 발송: ${userId}, 제목: ${title}, 내용: ${message}`);
  
  // 여기에 이메일 발송 API 연동 코드 추가
  return true;
}

// SMS 알림 발송 함수 (실제 구현은 별도 서비스 연동 필요)
async function sendSmsNotification(userId: string, message: string) {
  // 실제 구현에서는 SMS 발송 API 연동 (예: Twilio, NHN Cloud, 네이버 클라우드 등)
  // 현재는 임시 구현
  console.log(`📱 SMS 알림 발송: ${userId}, 내용: ${message}`);
  
  // 여기에 SMS 발송 API 연동 코드 추가
  return true;
}

// 카카오톡 알림 발송 함수 (실제 구현은 별도 서비스 연동 필요)
async function sendKakaoNotification(userId: string, title: string, message: string) {
  // 실제 구현에서는 카카오 비즈메시지 API 연동
  // 현재는 임시 구현
  console.log(`🗨️ 카카오톡 알림 발송: ${userId}, 제목: ${title}, 내용: ${message}`);
  
  // 여기에 카카오 비즈메시지 API 연동 코드 추가
  return true;
}

// 배치 확정 시 알림 발송
export async function sendAssignmentNotification(
  userId: string,
  date: string,
  centerName: string,
  startTime?: string,
  endTime?: string,
  notes?: string
) {
  const title = '물류센터 배치 확정';
  const timeInfo = startTime && endTime ? `${startTime}~${endTime}` : '종일';
  const message = `${date} ${timeInfo} ${centerName} 물류센터에 배치되었습니다.${notes ? `\n${notes}` : ''}`;
  
  return sendNotification(userId, title, message, 'assignment');
}

// 배치 취소 시 알림 발송
export async function sendCancellationNotification(
  userId: string,
  date: string,
  centerName: string
) {
  const title = '물류센터 배치 취소';
  const message = `${date} ${centerName} 물류센터 배치가 취소되었습니다.`;
  
  return sendNotification(userId, title, message, 'cancellation');
}

// 배치 정보 변경 시 알림 발송
export async function sendUpdateNotification(
  userId: string,
  date: string,
  centerName: string,
  changes: string
) {
  const title = '물류센터 배치 정보 변경';
  const message = `${date} ${centerName} 물류센터 배치 정보가 변경되었습니다.\n변경사항: ${changes}`;
  
  return sendNotification(userId, title, message, 'update');
}

// 사용자별 알림 목록 가져오기
export async function getUserNotifications(userId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error(`Error fetching notifications for user ${userId}:`, error);
    throw error;
  }
  
  return data;
}

// 알림 읽음 상태 업데이트
export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
  
  return data;
}