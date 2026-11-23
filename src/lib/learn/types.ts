// 学習(/learn)のレッスンのデータの形。
// レッスンの本文は日本語と英語を 1 つのデータに並べて持つ(訳し漏れが型とテストで見つかるように)。
// 画面に出すときは、サーバーで見る人の言語だけに絞ってから描く(lib/learn/localize)。
// レッスンのファイル(lessons/*.ts)は Node でもそのまま読めるよう、ここからは `import type` だけで読み込む
// (シェーダーのコンパイルを確かめるスクリプトが、Next を通さずに読む)。

/** 日本語と英語の文。本文の中では `コード` と **強調** と [リンク](/learn/…) が使える */
export interface Text {
  ja: string;
  en: string;
}

export type LessonBlock =
  /** 小見出し。レッスンの先頭の「この回の内容」にも並ぶ */
  | { type: "heading"; text: Text }
  | { type: "paragraph"; text: Text }
  | { type: "list"; items: Text[]; ordered?: boolean }
  /** 補足(tip)と、つまずきやすいところの注意(warning) */
  | { type: "note"; tone?: "tip" | "warning"; text: Text }
  /** 読み取り専用のコード。render 関数の形になっていない断片でもよい(描画はしない) */
  | { type: "code"; source: string; caption?: Text }
  /**
   * その場で書き換えられるコードとプレビュー。source は作品と同じ形(vec4 render(vec2 uv, vec2 p) を含む)。
   * caption には「どこを変えると何が起きるか」を書く。attention を使う回だけ、プレビューの下にスライダーを出す。
   * expectError はエラーの読み方を見せるために、わざとコンパイルが通らないコードを置くときだけ付ける
   */
  | { type: "playground"; source: string; caption?: Text; attentionSlider?: boolean; expectError?: boolean }
  /**
   * 課題。starter は書き始めのコード(そのままでもコンパイルが通る。エラーを直す課題だけ starterHasError を付ける)、
   * solution は見本。ヒントは 1 つずつ開ける
   */
  | {
      type: "exercise";
      title: Text;
      prompt: Text;
      starter: string;
      solution: string;
      hints?: Text[];
      attentionSlider?: boolean;
      starterHasError?: boolean;
    };

export interface Lesson {
  /** URL(/learn/{slug})。英小文字・数字・ハイフン */
  slug: string;
  title: Text;
  /** 目次に出す 1 行の説明 */
  summary: Text;
  /** かかる時間の目安(分)。読む・試す・課題をすべて含めて 30〜60 */
  minutes: number;
  /** この回でできるようになること */
  goals: Text[];
  blocks: LessonBlock[];
  /** 目次に出す絵のコード。省略すると、最後の課題の見本(無ければ最初の playground)を使う */
  cover?: string;
}

export interface CoursePart {
  id: string;
  title: Text;
  description: Text;
  lessons: Lesson[];
}
