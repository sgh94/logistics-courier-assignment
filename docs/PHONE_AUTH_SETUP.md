# Supabase Phone Authentication 설정 가이드

이 문서는 Supabase의 Phone Authentication을 Twilio Verify 서비스와 연동하는 방법을 안내합니다.

## 1. Twilio Verify 서비스 설정

1. [Twilio 콘솔](https://www.twilio.com/console)에 로그인합니다.
2. **Verify** 서비스로 이동합니다.
3. **Create Verify Service**를 클릭하고 서비스 이름을 입력합니다 (예: "물류 택배기사 인증").
4. 생성된 서비스의 **Service SID**를 기록해둡니다.

## 2. Supabase 설정

1. [Supabase 대시보드](https://app.supabase.io/)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. **Authentication** > **Providers** 메뉴로 이동합니다.
4. **Phone** 공급자를 활성화합니다.
5. SMS Provider에서 **Twilio Verify**를 선택합니다.
6. 다음 정보를 입력합니다:
   - **Account SID**: Twilio 계정 SID
   - **Auth Token**: Twilio 계정 Auth Token
   - **Verify Service SID**: 이전 단계에서 기록한 Verify Service SID
7. **Save** 버튼을 클릭합니다.

## 3. SMS 템플릿 설정 (선택 사항)

1. Supabase 대시보드에서 **Authentication** > **Email Templates** 메뉴로 이동합니다.
2. **SMS Template** 탭을 선택합니다.
3. 사용자 정의 템플릿을 설정할 수 있습니다 (예: "[택배기사 관리] 인증번호: {{ .Code }}").

## 4. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. 인증 설정 테스트

1. 회원가입 또는 로그인 페이지에서 핸드폰 번호 인증을 테스트합니다.
2. 전화번호 형식이 국제 표준 형식(+82XXXXXXXXXX)인지 확인합니다.
3. 인증 코드는 설정된 Twilio Verify 서비스를 통해 SMS로 발송됩니다.

## 주의 사항

- Twilio Verify 서비스는 유료입니다. 사용량에 따라 비용이 발생할 수 있습니다.
- 국가 및 지역에 따라 SMS 발송 제한이 있을 수 있습니다.
- 개발 환경에서는 실제 SMS 발송을 제한하여 불필요한 비용이 발생하지 않도록 주의하세요.
- 전화번호 형식은 항상 국제 표준 형식(+국가코드)을 사용해야 합니다. 국내 전화번호의 경우 010으로 시작하는 번호를 +8210으로 변환해야 합니다.

## 트러블슈팅

### SMS가 수신되지 않는 경우

1. Twilio 콘솔에서 로그를 확인하여 SMS 발송 상태를 확인합니다.
2. 전화번호 형식이 올바른지 확인합니다(예: +8210XXXXXXXX).
3. Twilio 계정의 잔액을 확인합니다.
4. 해당 국가 및 지역에 SMS 발송이 가능한지 확인합니다.

### 인증 코드 검증 실패

1. 사용자가 입력한 인증 코드와 발송된 코드가 일치하는지 확인합니다.
2. 인증 코드의 유효 시간이 지나지 않았는지 확인합니다.
3. 동일한 전화번호로 여러 번 인증 요청을 보낸 경우, 가장 최근에 발송된 코드를 사용해야 합니다.