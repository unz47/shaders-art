// AI 機能を示す ✦(Figma "Icon/Sparkle")。色は文字色(currentColor)に従う
export function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.5 1.5Q7.2 6.3 12 7Q7.2 7.7 6.5 12.5Q5.8 7.7 1 7Q5.8 6.3 6.5 1.5Z" />
      <path d="M12.5 1Q12.8 3.2 15 3.5Q12.8 3.8 12.5 6Q12.2 3.8 10 3.5Q12.2 3.2 12.5 1Z" />
    </svg>
  );
}
