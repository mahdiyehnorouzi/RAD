/** The package only exposes types via `exports`, which `moduleResolution: node` ignores. */
declare module "embedded-postgres" {
  export default class EmbeddedPostgres {
    constructor(options: {
      databaseDir: string;
      user: string;
      password: string;
      port: number;
      persistent?: boolean;
      onLog?: (message: string) => void;
      onError?: (message: unknown) => void;
    });
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    createDatabase(name: string): Promise<void>;
  }
}
