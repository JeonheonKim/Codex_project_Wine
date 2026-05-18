# WINE TOGETHER MVP

와인 광고 배너, 사진 인증 갤러리, 선입금 기반 와인 모임 모집, Admin 신청/승인 흐름을 검증하기 위한 정적 웹앱 프로토타입입니다.

## 실행

브라우저에서 `index.html`을 열면 바로 실행됩니다. 현재 버전은 백엔드 없이 `localStorage`에 데이터를 저장합니다.

## Supabase 설정

`app.js`에는 Supabase Project URL과 anon public key가 연결되어 있습니다. Supabase 콘솔의 SQL Editor에서 `supabase-schema.sql`을 실행한 뒤 Kakao Auth provider를 활성화하면 카카오 로그인부터 검증할 수 있습니다.

## 배포

정적 웹앱이므로 Cloudflare Pages 또는 Netlify에 GitHub 저장소를 연결해 배포할 수 있습니다.

- Build command: 비워두기
- Output directory: `/` 또는 비워두기
- 배포 후 Supabase Authentication URL Configuration에 실제 사이트 URL을 추가합니다.
- Kakao Developers에는 Supabase Callback URL과 배포 도메인을 등록합니다.

## MVP 범위

- 카카오 로그인 플로우를 연결하기 전의 LOGIN/USER INFO 상태 시뮬레이션
- 좌우 이동형 광고 배너
- 와인 사진 갤러리 업로드
- USER의 Admin 신청 페이지
- Admin의 신청 승인 페이지
- Admin 승인 유저만 와인 모임 생성
- 선입금 금액, 계좌, 예금주 정보 표시
- 참가 신청 시 모집 인원 증가

## 다음 구현 후보

- Kakao OAuth JavaScript SDK 연결
- Supabase/Firebase 같은 BaaS 기반 사용자, 게시글, 댓글 저장
- 계좌 정보 노출 범위와 입금 확인 운영 정책
- 이미지 업로드 스토리지
- 모임 신고, 환불, 모집 취소 정책
