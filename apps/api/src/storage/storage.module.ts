import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CloudinaryStorageService } from "./cloudinary-storage.service";
import { S3StorageService } from "./s3-storage.service";
import { MEDIA_STORAGE } from "./media-storage.token";
import {
  resolveMediaStorageProviderName,
  selectMediaStorageProvider,
} from "./media-storage.provider";

@Module({
  providers: [
    CloudinaryStorageService,
    S3StorageService,
    {
      provide: MEDIA_STORAGE,
      useFactory: (
        config: ConfigService,
        cloudinary: CloudinaryStorageService,
        s3: S3StorageService,
      ) => {
        const providerName = resolveMediaStorageProviderName(
          config.get<string>("MEDIA_STORAGE_PROVIDER"),
        );
        return selectMediaStorageProvider(providerName, cloudinary, s3);
      },
      inject: [ConfigService, CloudinaryStorageService, S3StorageService],
    },
  ],
  // Both concrete services are exported alongside the active-provider
  // token: AdminService needs them directly (not just the active one) to
  // delete an existing ProductImage through whichever provider its own
  // `storage` column actually recorded — see AdminService#storageFor.
  exports: [MEDIA_STORAGE, CloudinaryStorageService, S3StorageService],
})
export class StorageModule {}
