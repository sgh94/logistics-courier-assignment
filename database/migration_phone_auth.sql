-- 이메일 인증에서 핸드폰 인증으로 전환하기 위한 마이그레이션 스크립트

-- 1. 기존 users 테이블 백업
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. users 테이블 변경
-- 핸드폰 번호를 필수로 설정하고 이메일을 선택 사항으로 변경
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- 3. notification_settings 테이블 기본값 변경
-- SMS를 기본 알림 방법으로 설정
ALTER TABLE notification_settings ALTER COLUMN email_enabled SET DEFAULT false;
ALTER TABLE notification_settings ALTER COLUMN sms_enabled SET DEFAULT true;

-- 4. 기존 사용자 데이터 업데이트
-- 핸드폰 번호가 없는 기존 사용자에게 임시 핸드폰 번호 부여
UPDATE users 
SET phone = 'temp-' || (SUBSTRING(id::text, 1, 8) || SUBSTRING(id::text, 10, 4)) 
WHERE phone IS NULL OR phone = '';

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- 주의사항: 
-- 1. 이 마이그레이션은 기존 사용자의 로그인 방식을 변경합니다.
-- 2. 임시 핸드폰 번호가 부여된 사용자에게 실제 번호를 입력하도록 안내해야 합니다.
-- 3. 실제 환경에서 실행하기 전에 반드시 데이터베이스 백업을 진행하세요.
