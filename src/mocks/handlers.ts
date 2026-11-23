import { aiEdit, aiModels, aiUsage } from "./ai/edit";
import { billingStatus } from "./billing";
import { getWork } from "./works/detail";
import { favoriteHandlers } from "./works/favorites";
import { getHome } from "./works/home";
import { listWorks } from "./works/list";
import { listMyWorks } from "./works/mine";
import { moderationHandlers } from "./works/moderation";

// 偽のサーバー。ここに追加していく
export const handlers = [listWorks, listMyWorks, getHome, ...favoriteHandlers, getWork, ...moderationHandlers, aiEdit, aiModels, aiUsage, billingStatus];
