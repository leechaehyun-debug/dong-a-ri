# 동아리 장소 취합소 — 휴대폰 업로드용

이 버전은 `src` 폴더 없이 모든 실행 파일을 한 폴더에 모아둔 React + Vite + Supabase 프로젝트입니다.

## GitHub에 올릴 때

이 ZIP을 휴대폰에서 **압축 해제**한 뒤, 아래 파일을 전부 `leechaehyun-debug/dong-a-ri` 저장소의 맨 바깥(root)에 업로드하세요.

- `index.html`
- `package.json`
- `vite.config.js`
- `main.jsx`
- `App.jsx`
- `global.css`
- `supabase.js`
- `supabase-schema.sql`
- `README.md`

ZIP 파일 자체는 올리지 않아도 됩니다.

## 그 다음

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql`의 전체 내용을 실행합니다.
3. Supabase Project URL과 Publishable key를 확인합니다.
4. Vercel에서 GitHub의 `dong-a-ri` 저장소를 Import합니다.
5. Environment Variables에 아래 두 값을 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Deploy를 누릅니다.

## 보안 주의

현재 버전은 별도 로그인 없이 링크를 아는 사람이 데이터를 읽고 수정할 수 있는 간편 운영형입니다.
실제 장기 운영 시에는 로그인과 더 제한적인 RLS 정책을 추가하는 것을 권장합니다.
