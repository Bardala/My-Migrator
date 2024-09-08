import { Pool } from "mysql2/promise";
export declare class DbMigration {
    migrationDir: string;
    constructor(pool: Pool, dir: string);
    private pool;
    run(): Promise<void>;
    private checkOldMigrations;
    private runPendingMigration;
    private checkMigrationFilesNameSyntax;
    private markMigrationAsInstalled;
    private calculateChecksum;
    private extractVersionFromFileName;
    private getInstalledMigrations;
    private getMigrationFiles;
    private createSchemaHistoryTable;
}
