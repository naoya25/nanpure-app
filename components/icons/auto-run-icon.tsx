/** テクニック自動実行（繰り返し適用） */
export function AutoRunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* auto: circular arrows */}
      <path d="M19 6v4h-4" />
      <path d="M5 18v-4h4" />
      <path d="M19 10.5a7.6 7.6 0 0 0-13-2.7" />
      <path d="M5 13.5a7.6 7.6 0 0 0 13 2.7" />
      {/* run: play symbol (slightly smaller and right-shifted) */}
      <path d="M11.4 9.8v4.4l3.4-2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}
