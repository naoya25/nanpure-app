import Link from "next/link";

export default function Home() {
  return (
    <main className="relative isolate min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(14,165,233,0.14),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(to right, rgb(228 228 231 / 0.65) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(228 228 231 / 0.65) 1px, transparent 1px)`,
          backgroundSize: "2.25rem 2.25rem",
        }}
        aria-hidden
      />

      <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-20 md:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Nanpure Training
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 md:text-[2.75rem] md:leading-[1.12]">
          ナンプレ
          <br />
          トレーニング
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 md:text-[17px]">
          ナンプレの<strong className="font-semibold text-zinc-800">解法テクニック</strong>
          を学び、盤上で試すためのアプリです。問題に取り組みながら、論理の手筋を少しずつ身につけられます。
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/play"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
          >
            練習を始める
          </Link>
          <Link
            href="/create"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-7 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            盤面を作る
          </Link>
        </div>
      </div>
    </main>
  );
}
