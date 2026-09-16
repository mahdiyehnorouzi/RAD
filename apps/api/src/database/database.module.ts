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
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: cleanDatabaseUrl(config.get<string>("DATABASE_URL") ?? process.env.DATABASE_URL),
        entities: [...entities],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([...entities]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
