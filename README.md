# 동아리 장소 취합소

React + Vite + Supabase 버전입니다.

## 1. Supabase 만들기

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 전체를 실행합니다.
3. Project URL과 Publishable key를 복사합니다.

## 2. 로컬 실행

`.env.example`을 `.env.local`로 복사하고 값을 채웁니다.

```bash
npm install
npm run dev
```

## 3. GitHub에 올리기

이 폴더 안의 파일 전체를 `leechaehyun-debug/dong-a-ri` 저장소 루트에 올립니다.

## 4. Vercel 배포

1. Vercel에서 New Project를 누릅니다.
2. GitHub의 `dong-a-ri` 저장소를 선택합니다.
3. Environment Variables에 아래 2개를 추가합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

4. Deploy를 누릅니다.

## 보안 주의

현재 버전은 별도 로그인 없이 링크를 아는 사람이 데이터를 읽고 수정할 수 있는 간편 운영 버전입니다.
실제 장기 운영 시에는 Supabase Auth 또는 학교 계정 로그인을 붙이고 RLS 정책을 사용자별로 제한하는 것을 권장합니다.
