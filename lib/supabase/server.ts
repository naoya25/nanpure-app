import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function readSupabaseServerEnv():
  | { url: string; anonKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

/**
 * 未設定時はプレイ等のサーバー処理が createClient より前に落ちて 500 になるため、
 * ページ側で先に分岐するためのメッセージ（本番のホスティング設定ミス向け）。
 */
export function supabaseServerConfigErrorMessage(): string | null {
  if (readSupabaseServerEnv() !== null) {
    return null;
  }
  return "接続設定が不足しています。Vercel の Environment Variables に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定し、再デプロイしてください。";
}

export async function createClient() {
  const env = readSupabaseServerEnv();
  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const { url, anonKey } = env;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component など set できないコンテキストでは無視
        }
      },
    },
  });
}
