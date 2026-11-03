import { aiEdit } from "./ai/edit";
import { getWork } from "./works/detail";
import { getHome } from "./works/home";
import { listWorks } from "./works/list";
import { listMyWorks } from "./works/mine";

// 偽のサーバー。ここに追加していく
export const handlers = [listWorks, listMyWorks, getHome, getWork, aiEdit];
