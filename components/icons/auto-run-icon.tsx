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
      <path d="M17 3v6h-6" />
      <path d="M7 21v-6h6" />
      <path d="M17 9a7.7 7.7 0 0 0-13.2-2.6M7 15a7.7 7.7 0 0 0 13.2 2.6" />
    </svg>
  );
}
