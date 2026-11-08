// 特定商取引法に基づく表記(/legal/commerce)に出す運営者の情報(issue #42)。
// 有料で売るなら表記が必須。個人で運営する場合、氏名・住所・電話番号は「請求があれば遅滞なく開示する」と書いて
// 省略できる(消費者庁「通信販売の広告について」)。ただし請求されたら本当に開示できるよう、控えは手元に持っておくこと。
// メールアドレスは省略できないので、本番で売る前に必ず入れる。入っていないうちは、本番の鍵(sk_live_)では
// 買えないようにしてある(POST /api/billing/checkout の canSellLive)。テストモードでは買える。

export interface CommerceInfo {
  /** 販売事業者(個人なら氏名)。null なら「請求があれば開示」と出す */
  seller: string | null;
  /** 運営統括責任者。null なら「請求があれば開示」と出す */
  manager: string | null;
  /** 所在地。null なら「請求があれば開示」と出す */
  address: string | null;
  /** 電話番号。null なら「請求があれば開示」と出す */
  phone: string | null;
  /** 問い合わせ先のメールアドレス。省略できない */
  email: string | null;
}

// TODO(運営者): 本番で売る前に email を入れる。氏名・住所・電話番号は載せるなら入れる(載せないなら null のまま)
export const COMMERCE_INFO: CommerceInfo = {
  seller: null,
  manager: null,
  address: null,
  phone: null,
  email: null,
};

/** 本番の鍵で売ってよいか(特定商取引法の表記に、省略できない項目がそろっているか) */
export function canSellLive(info: CommerceInfo = COMMERCE_INFO): boolean {
  return info.email !== null && /^[^@\s]+@[^@\s]+$/.test(info.email);
}
