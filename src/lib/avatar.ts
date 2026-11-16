// ヘッダーのアバター。Cognito にはプロフィール画像が無いので、メールアドレスの頭文字と、
// メールアドレスから決まるグラデーションで描く(同じ人なら毎回同じ色になる)。

/** アバターに出す 1 文字。メールアドレスが無ければ「?」 */
export function avatarInitial(email: string | null): string {
  const first = email?.trim().charAt(0) ?? "";
  return first === "" ? "?" : first.toUpperCase();
}

/** 文字列から 0〜359 の色相を決める(FNV-1a) */
export function avatarHue(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 360;
}

/** アバターの背景(CSS の background-image)。白い文字が読める明るさにしてある */
export function avatarBackground(email: string | null): string {
  const hue = avatarHue(email?.trim().toLowerCase() ?? "");
  return `linear-gradient(135deg, oklch(0.68 0.16 ${hue}), oklch(0.52 0.18 ${(hue + 60) % 360}))`;
}
