import { getWork } from "./works/detail";
import { listWorks } from "./works/list";

// 偽のサーバー。ここに追加していく
export const handlers = [listWorks, getWork];
