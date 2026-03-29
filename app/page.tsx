import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          nanpure-app
        </h1>
        <p className="text-base leading-relaxed text-zinc-600">
          データベースに登録されたナンプレを表示し、プレイできるアプリです（開発中）。
        </p>
      </div>
      <Link
        href="/play"
        className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        プレイする
      </Link>
    </main>
  );
}
