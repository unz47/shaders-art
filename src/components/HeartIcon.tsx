// お気に入りの ♡。filled で塗りつぶす。色は文字色(currentColor)に従う
export function HeartIcon({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5Z" />
    </svg>
  );
}
