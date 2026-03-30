/** 一手進める（redo） */
export function RedoIcon({ className }: { className?: string }) {
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
      <path d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
    </svg>
  );
}
