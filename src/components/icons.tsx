// ヘッダーと下のタブバーで使う線のアイコン。色は currentColor なので、置いた場所の文字色(テーマ)に従う。
// (src/icons/*.svg を <Image> で出すと色が SVG に焼き込まれ、ダークモードで背景に沈む)

type IconProps = { size?: number; className?: string };

function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

/** filled を付けると塗りつぶす(ダークモードが入っている印) */
export function MoonIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M8 2a4.24 4.24 0 0 0 6 6 6 6 0 1 1-6-6Z"
        strokeWidth="1.5"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7.33" cy="7.33" r="5.33" strokeWidth="1.4" />
      <path d="M14 14l-2.87-2.87" strokeWidth="1.4" />
    </Svg>
  );
}

export function GalleryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="5" height="5" rx="1" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1" strokeWidth="1.4" />
    </Svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" strokeWidth="1.4" />
    </Svg>
  );
}

export function LearnIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 3.5c2-.8 4-.6 6 .8v9c-2-1.4-4-1.6-6-.8v-9ZM14 3.5c-2-.8-4-.6-6 .8v9c2-1.4 4-1.6 6-.8v-9Z" strokeWidth="1.3" />
    </Svg>
  );
}
