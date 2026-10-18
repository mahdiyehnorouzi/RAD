import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CloudinaryStorageService } from "./cloudinary-storage.service";
import { SeaweedfsStorageService } from "./seaweedfs-storage.service";
import {
  MEDIA_STORAGE,
  MEDIA_STORAGE_RESOLVER,
  createMediaStorageResolver,
} from "./media-storage.interface";

/**
 * Selects the active `MediaStorageService` implementation from
 * `MEDIA_STORAGE_PROVIDER` (`"cloudinary"` — the default — or
 * `"seaweedfs"`). `AdminService` injects the `MEDIA_STORAGE` token rather
 * than a concrete class, so changing this env var is the whole switch for
 * signing brand-new uploads; nothing else needs editing.
 *
 * `MEDIA_STORAGE_RESOLVER` is separate on purpose: it dispatches by a
 * given row's own `storage` kind, not by whichever provider is currently
 * active, so existing rows stay verifiable/deletable through a provider
 * switch (see the doc comment on that token).
 */
@Module({
  providers: [
    CloudinaryStorageService,
    SeaweedfsStorageService,
    {
      provide: MEDIA_STORAGE,
      useFactory: (
        config: ConfigService,
        cloudinaryStorage: CloudinaryStorageService,
        seaweedfsStorage: SeaweedfsStorageService,
      ) =>
        config.get<string>("MEDIA_STORAGE_PROVIDER") === "seaweedfs"
          ? seaweedfsStorage
          : cloudinaryStorage,
      inject: [ConfigService, CloudinaryStorageService, SeaweedfsStorageService],
    },
    {
      provide: MEDIA_STORAGE_RESOLVER,
      useFactory: createMediaStorageResolver,
      inject: [CloudinaryStorageService, SeaweedfsStorageService],
    },
  ],
  exports: [
    CloudinaryStorageService,
    SeaweedfsStorageService,
    MEDIA_STORAGE,
    MEDIA_STORAGE_RESOLVER,
  ],
})
export class StorageModule {}
