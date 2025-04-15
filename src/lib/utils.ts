/**
 * 전화번호를 국제 표준 형식으로 변환
 * 
 * @param phoneNumber 사용자 입력 전화번호 (예: '01012345678', '010-1234-5678', '+8210-1234-5678')
 * @returns 국제 표준 형식 전화번호 (예: '+821012345678')
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // 디버깅 로그 추가
  console.log('Formatting phone number input:', phoneNumber);
  
  // 모든 특수문자(-, 공백 등) 제거
  const cleaned = phoneNumber.replace(/\D/g, '');
  console.log('Cleaned phone number:', cleaned);
  
  let formatted: string;
  
  // 이미 국제 형식인 경우 (+로 시작)
  if (phoneNumber.startsWith('+')) {
    formatted = '+' + cleaned;
    console.log('Phone already in international format. Formatted:', formatted);
    return formatted;
  }
  
  // 한국 전화번호 규칙 (010으로 시작하는 경우)
  if (cleaned.startsWith('010')) {
    formatted = '+82' + cleaned.substring(1);
    console.log('Phone is Korean mobile. Formatted:', formatted);
    return formatted;
  }
  
  // 한국 전화번호이지만 지역번호로 시작하는 경우 (02, 031, 032 등)
  if (cleaned.length >= 9 && (
    cleaned.startsWith('02') || 
    cleaned.startsWith('03') || 
    cleaned.startsWith('04') || 
    cleaned.startsWith('05') || 
    cleaned.startsWith('06')
  )) {
    formatted = '+82' + cleaned;
    console.log('Phone is Korean landline. Formatted:', formatted);
    return formatted;
  }
  
  // 기타 경우는 그대로 반환 (국가코드 없이는 인증이 작동하지 않을 수 있음)
  // 형식을 확인할 수 없는 경우 한국 번호로 가정
  formatted = '+82' + cleaned;
  console.log('Unknown phone format, assuming Korean. Formatted:', formatted);
  return formatted;
}

/**
 * 전화번호 유효성 검사
 * 
 * @param phoneNumber 검사할 전화번호
 * @returns 유효한 전화번호인지 여부
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  console.log('Validating phone number:', phoneNumber);
  
  // 국제 표준 형식으로 변환
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  // 기본적인 유효성 검사 (국가 코드 + 최소 자릿수)
  if (!formattedNumber.startsWith('+') || formattedNumber.length < 10) {
    console.log('Phone validation failed: too short or missing country code');
    return false;
  }
  
  // 한국 전화번호 검사 (통상적으로 +82 + 9~10자리)
  if (formattedNumber.startsWith('+82')) {
    // 휴대폰 번호 (+8210XXXXXXXX)
    if (formattedNumber.length === 13 && formattedNumber.substring(3, 5) === '10') {
      console.log('Valid Korean mobile number');
      return true;
    }
    
    // 지역번호 (+822XXXXXXX 또는 +8231XXXXXXX 등)
    if (formattedNumber.length >= 11 && formattedNumber.length <= 13) {
      console.log('Valid Korean landline number');
      return true;
    }
    
    console.log('Korean number format validation failed');
    return false;
  }
  
  // 기타 국가 번호 검사는 추가 가능
  console.log('Non-Korean number validation: assuming valid');
  return true; // 기본적으로 형식이 맞으면 허용
}

/**
 * 전화번호 표시 형식 변환 (사용자 화면 표시용)
 * 
 * @param phoneNumber 국제 표준 형식 전화번호 (예: '+821012345678')
 * @returns 표시용 형식 전화번호 (예: '010-1234-5678')
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  console.log('Formatting phone for display:', phoneNumber);
  
  // 한국 번호인 경우
  if (phoneNumber.startsWith('+82')) {
    const withoutCountryCode = phoneNumber.substring(3);
    let formatted: string;
    
    // 휴대폰 번호 (01X로 시작)
    if (withoutCountryCode.startsWith('10')) {
      if (withoutCountryCode.length === 10) { // 10-XXXX-XXXX
        formatted = `0${withoutCountryCode.substring(0, 2)}-${withoutCountryCode.substring(2, 6)}-${withoutCountryCode.substring(6)}`;
        console.log('Formatted Korean mobile for display:', formatted);
        return formatted;
      }
    }
    
    // 서울 지역번호 (02로 시작)
    if (withoutCountryCode.startsWith('2')) {
      formatted = `0${withoutCountryCode.substring(0, 1)}-${withoutCountryCode.substring(1, 5)}-${withoutCountryCode.substring(5)}`;
      console.log('Formatted Seoul number for display:', formatted);
      return formatted;
    }
    
    // 기타 지역번호
    formatted = `0${withoutCountryCode}`;
    console.log('Formatted Korean number for display:', formatted);
    return formatted;
  }
  
  // 기타 국가 번호는 그대로 반환
  console.log('Non-Korean number, returning as is for display');
  return phoneNumber;
}