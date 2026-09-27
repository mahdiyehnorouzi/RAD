import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { cleanDatabaseUrl } from "./data-source";
import { entities } from "./entities";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const synchronize =
          (config.get<string>("TYPEORM_SYNCHRONIZE") ?? process.env.TYPEORM_SYNCHRONIZE ?? "true") !==
          "false";
        return {
          type: "postgres" as const,
          url: cleanDatabaseUrl(config.get<string>("DATABASE_URL") ?? process.env.DATABASE_URL),
          entities: [...entities],
          synchronize,
          logging: false,
          extra: {
            max: 5,
            keepAlive: true,
            keepAliveInitialDelayMillis: 1000,
            connectionTimeoutMillis: 20_000,
            idleTimeoutMillis: 10_000,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([...entities]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
