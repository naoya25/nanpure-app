import Link from "next/link";

import { LikedPuzzlesLoader } from "@/components/nanpure/LikedPuzzlesLoader";

export const metadata = {
  title: "いいねした問題 | ナンプレトレーニング",
};

export default function LikedPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900">いいねした問題</h1>
        <Link href="/" className="text-sm text-zinc-500 underline hover:text-zinc-800">
          トップ
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        この端末のブラウザに保存しています。ほかの端末やブラウザには引き継がれません。
      </p>
      <LikedPuzzlesLoader />
    </main>
  );
}
