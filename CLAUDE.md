# meve — Claude Code Context

## 프로젝트 개요
AI 기반 개인화 스킨케어 진단 앱. 20대 MZ 여성 타겟 (한국 K-뷰티 시장).
핵심 플로우: 진단 (AI 페이스 스캐너) → 분석 (성분 스캐너) → 처방 (AI 루틴 코치) → 추적 (일별 로깅)

## 기술 스택
- React Native + Expo (SDK 55) + TypeScript
- Supabase (ap-northeast-2 서울, PIPA 준수)
- Zustand (상태관리)
- OpenAI GPT-4 Vision (성분 스캐너)
- Facecard LLM (페이스 스캐너, 파트너십 연동 예정)

## 현재 앱 플로우
```
Splash → Welcome (3 slides) → AuthGate → [Mode Selection*] → Home
```
*Mode Selection: 디자이너 UI 작업 후 구현 예정 (AUR2-145)

## 현재 작업 상태 (Sprint 1 — Apr 4~11)

### 완료된 것
- theme.ts 라이트모드 교체 완료
- types/index.ts, store/index.ts 교체 완료
- OnboardingNavigator.tsx — Welcome → AuthGate → (Home)
- RootNavigator.tsx — 세션 분기 로직 완료
- WelcomeScreen.tsx — 슬라이드 3장
- AuthGateScreen.tsx — 카카오/Apple/이메일 버튼
- EmailSignUpScreen.tsx — 이메일 회원가입
- OTPVerifyScreen.tsx — 이메일 OTP 인증
- OnboardingCompleteScreen.tsx — 완료 화면 + Supabase 저장
- HomeScreen.tsx — 홈 메인
- MainNavigator.tsx — 4탭 (홈/AI Scanner/Ingredient Scanner/My Page)
- Supabase user_profiles 테이블 + RLS 완료
- Expo 패키지 업데이트 완료

### 지금 할 것
- Welcome 슬라이드 카피 수정 (아래 정확한 카피 참고)
- 우상단 파란 설정 아이콘 제거
- 이메일 로그인 → Home 플로우 end-to-end 테스트

## Welcome 슬라이드 정확한 카피
- Slide 1: headline "왜 내 피부가 이래요?" / sub "AI가 내 피부를 정확히 진단해 드려요."
- Slide 2: headline "내 피부에 맞는 성분만" / sub "수천 개 성분 중 나에게 맞는 것만 골라드려요."
- Slide 3: headline "AI가 처방하는 나만의 30일 루틴" / sub "AI 코치가 루틴을 함께 만들어 드려요."

## Skin Mode System (AUR2-145 — 디자이너 작업 후 구현)
유저가 Auth 후 자신의 상황에 맞는 모드 선택. 모드에 따라 AI 추천 방향이 달라짐.

| 모드 | 타겟 | 철학 |
|------|------|------|
| 💍 Wedding Mode | 예비신부 | 트러블 제로, 자극 최소화, 안전한 성분만 |
| 🌿 Everyday Mode | 일반 유저 | 장기 개선, experimental & explorative |
| 🎓 Graduation Mode | 졸업 준비 학생 | 3개월 단기 집중 |

UI: 카드형 모드 선택 화면, 모드별 고유 비주얼 테마.
모드는 마이페이지에서 언제든 변경 가능.
**→ 아직 구현하지 말 것. 디자이너 UI 확정 후 구현.**

## 디자인 시스템

### 브랜드 방향 (디자이너와 확정 중)
- 타겟: 20대 MZ 여성
- 무드: Clean Girl Aesthetic — baby pink + light blue, 유리 텍스처
- 레퍼런스: Glossier, Glow Recipe, Curology
- 라이트모드 전용, 다크모드 없음

### 현재 Colors (theme.ts — 디자이너 확정 후 업데이트 예정)
```
bg: '#FAF7F2'
surface: '#FFFFFF'
surfaceElevated: '#F2E8E1'
accent: '#C9A99A'
accentMuted: '#E8D5CE'
success: '#8FAF94'
warning: '#F2C94C'
danger: '#EB5757'
textPrimary: '#1A1A1A'
textSecondary: '#888888'
textDisabled: '#CCCCCC'
border: '#EEEEEE'
borderMuted: '#F5F0EC'
brandBlue: '#2E5BFF'
overlay: 'rgba(0,0,0,0.4)'
```

### 컴포넌트 스펙
- Primary Button: accent 배경, 흰 텍스트, h56, radius 12
- Input Field: white 배경, border 테두리 1pt, h52, radius 10
- Bottom Tab Bar: white 배경, 상단 border 1pt

### 디바이스 기준
- iPhone 15 Pro (393x852pt), Safe Area 상단 59pt / 하단 34pt

## 탭바 구성 (4탭)
- 홈 (Home)
- AI Scanner (페이스 스캐너)
- Ingredient Scanner (성분 스캐너 / Dupe Finder)
- My Page

## Supabase 스키마
user_profiles 테이블 (생성 완료):
- id, display_name, skin_type, skin_concerns, routine_steps
- routine_brands, experience_level, goal
- onboarding_completed (bool, default false)
- skin_mode (text) — wedding/everyday/graduation (추후 추가 예정)
- created_at, updated_at

## Auth 방식
- 카카오 OAuth: UI 있음, 앱키 대기 중
- Apple Sign-In: Apple Developer 계정 등록 후 활성화 예정
- 이메일 OTP: 현재 작동

## 네비게이션 타입
OnboardingStackParamList: Welcome, AuthGate, EmailSignUp, OTPVerify: { email: string }
MainTabParamList: Home, Scanner, Ingredient, MyPage

## 코딩 규칙
- 모든 UI 카피: 한국어 해요체
- 공통 컴포넌트: src/components/ui/index.tsx
- 네비게이션: useNavigation<Nav>() 타입 명시 필수
- Supabase 호출: try/catch 필수, 에러 메시지 한국어 Alert
- 브랜치: feature/AUR2-[이슈번호]-[설명] → dev PR

## 주요 파일 위치
- 타입: src/types/index.ts
- 스토어: src/store/index.ts
- 네비게이션: src/navigation/
- 온보딩 화면: src/screens/onboarding/
- 공통 컴포넌트: src/components/ui/index.tsx
- 테마: src/constants/theme.ts
- Supabase: src/services/supabase.ts