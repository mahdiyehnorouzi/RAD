import { Injectable } from "@nestjs/common";
import type { SessionState } from "@rad/types";
import { FavoritesService } from "../favorites/favorites.service";
import { NoticesService } from "../notices/notices.service";
import type { Actor } from "../common/identity";

@Injectable()
export class SessionService {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly notices: NoticesService,
  ) {}

  async state(actor: Actor): Promise<SessionState> {
    const [favorites, notices] = await Promise.all([
      this.favorites.list(actor),
      this.notices.list(actor),
    ]);
    return {
      user: actor.user,
      favorites: favorites.slugs,
      notices: notices.notices,
      unread: notices.unread,
    };
  }
}
