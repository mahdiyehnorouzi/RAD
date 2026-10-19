/**
 * Typed NestJS injection token for the currently-active `MediaStorage`
 * provider (selected by `MEDIA_STORAGE_PROVIDER`, see
 * `media-storage.provider.ts`). Inject with
 * `@Inject(MEDIA_STORAGE) storage: MediaStorage`.
 *
 * This is for NEW uploads only (signing + verifying what a client just
 * uploaded) — it must never be used to decide how to delete an EXISTING
 * `ProductImage` row, since a row written under a previously-active
 * provider must always be deleted through that same provider, regardless
 * of which one is active now. See `AdminService`'s `storageFor` helper.
 */
export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");
