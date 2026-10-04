"use client";

import dynamic from "next/dynamic";

// localStorage を初回描画で読むため、サーバー側（静的エクスポート時）では描画しない
const LikedPuzzlesClient = dynamic(
  () => import("@/components/nanpure/LikedPuzzlesClient"),
  { ssr: false },
);

export function LikedPuzzlesLoader() {
  return <LikedPuzzlesClient />;
}
