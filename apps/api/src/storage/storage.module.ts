import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CloudinaryStorageService } from "./cloudinary-storage.service";
import { SeaweedfsStorageService } from "./seaweedfs-storage.service";
import { MEDIA_STORAGE } from "./media-storage.interface";

/**
 * Selects the active `MediaStorageService` implementation from
 * `MEDIA_STORAGE_PROVIDER` (`"cloudinary"` — the default — or
 * `"seaweedfs"`). `AdminService` injects the `MEDIA_STORAGE` token rather
 * than a concrete class, so changing this env var is the whole switch;
 * nothing else needs editing.
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
  ],
  exports: [CloudinaryStorageService, SeaweedfsStorageService, MEDIA_STORAGE],
})
export class StorageModule {}
