import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseReady = Boolean(supabaseUrl && supabaseKey);

// 환경변수가 비어 있어도 앱 자체가 흰 화면으로 죽지 않게 placeholder를 사용합니다.
// 실제 읽기/쓰기는 supabaseReady가 true일 때만 수행됩니다.
export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabaseKey || "sb_publishable_placeholder"
);
