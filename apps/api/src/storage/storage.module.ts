import { Module } from "@nestjs/common";
import { SeaweedfsStorageService } from "./seaweedfs-storage.service";
import {
  MEDIA_STORAGE,
  MEDIA_STORAGE_RESOLVER,
  createMediaStorageResolver,
} from "./media-storage.interface";

/** The S3-compatible media store is the sole provider for new uploads. */
@Module({
  providers: [
    SeaweedfsStorageService,
    { provide: MEDIA_STORAGE, useExisting: SeaweedfsStorageService },
    {
      provide: MEDIA_STORAGE_RESOLVER,
      useFactory: createMediaStorageResolver,
      inject: [SeaweedfsStorageService],
    },
  ],
  exports: [SeaweedfsStorageService, MEDIA_STORAGE, MEDIA_STORAGE_RESOLVER],
})
export class StorageModule {}
