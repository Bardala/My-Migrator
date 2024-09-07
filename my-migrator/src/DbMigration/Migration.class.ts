import { Pool } from "mysql2/promise";
import path from "path";
import { RowDataPacket } from "mysql2";
import fs from "fs";
import crypto from "node:crypto";
import { HashedFile } from "../types";
import { ERROR } from "../Error";

/**@description This class is responsible for managing database migrations. */
export class DbMigration {
  /**@description The directory where migration files are stored.*/
  migrationDir: string = "";

  /**
   * @description Creates an instance of DbMigration.
   * @param {Pool} pool - The connection pool to the MySQL database.
   */
  constructor(pool: Pool, dir: string) {
    this.pool = pool;
    this.migrationDir = dir;
  }

  /**@description The connection pool to the MySQL database.*/
  private pool: Pool;

  /**
   * @description Runs the database migrations.
   * @throws {Error} - If any of the migration files have been edited after being installed in the database.
   */
  async run(): Promise<void> {
    await this.createSchemaHistoryTable();
    const migrationFiles = this.getMigrationFiles(this.migrationDir);
    if (!this.checkMigrationFilesNameSyntax(migrationFiles)) {
      throw new Error(ERROR.INVALID_MIGRATION_FILE_NAME);
    }
    const installedMigrations: HashedFile[] =
      await this.getInstalledMigrations();
    this.checkOldMigrations(installedMigrations, migrationFiles);
    const pendingMigrations = migrationFiles.filter((file) => {
      return !installedMigrations.some(
        (migration) => migration.fileName === file,
      );
    });
    await this.runPendingMigration(pendingMigrations);
    console.log("\n\t\t🎈 🎉 🎊 🥳\n\tAll DB migrations up to date😊\n");
  }

  /**
   * @description Checks if the migration files have been edited after being installed in the database.
   * @param {HashedFile[]} installedMigrations - The list of installed migrations.
   * @param {string[]} migrationFiles - The list of migration files.
   * @throws {Error} - If any of the migration files have been edited after being installed in the database.
   * */
  private checkOldMigrations(
    installedMigrations: HashedFile[],
    migrationFiles: string[],
  ): void {
    const editedMigrations = installedMigrations.filter(
      (installedMigration) => {
        const migrationFile = migrationFiles.find(
          (file) => file === installedMigration.fileName,
        );
        if (!migrationFile) return true;
        const checkSum = this.calculateChecksum(migrationFile);
        return checkSum !== installedMigration.hash;
      },
    );

    if (editedMigrations.length > 0) {
      const editedFileNames = editedMigrations.map((edited) => edited.fileName);
      throw new Error(
        `Migrations have been edited after being installed in ⚠️ ${editedFileNames.join(
          ",",
        )}⚠️
        🙏please revert the changes and try again\n`,
      );
    }
  }

  /**
   * @description Runs the pending migrations.
   * @param {string[]} pendingMigrations - The list of pending migration files.
   */
  private async runPendingMigration(
    pendingMigrations: string[],
  ): Promise<void> {
    for (const currFile of pendingMigrations) {
      const version = this.extractVersionFromFileName(currFile);
      const migrationContent = fs.readFileSync(
        path.join(this.migrationDir, currFile),
        "utf8",
      );
      try {
        await this.pool.query(migrationContent);
        await this.markMigrationAsInstalled(version, currFile, true);
        // Extract the process name from the file name, ex: V1__create_table_car.sql => create table car
        const processName = currFile
          .match(/^V\d+__(\w+)\.sql$/)![1]
          .replace(/_/g, " ");
        console.log(
          `\n\t👏 Migration ${version} applied successfully, \n\t✅ process: ${processName}`,
        );
      } catch (error) {
        console.error(
          `\t⛔Error applying migration in Version(${version}): \n\t⛔${error}`,
        );
        await this.markMigrationAsInstalled(version, currFile, false);
        await this.pool.end();
        process.exit(1);
      }
    }
  }

  /**
   * @description Checks if the migration files have the correct naming syntax.
   * @param {string[]} migrationFiles - The list of migration files.
   * @returns {boolean} - True if all the migration files have the correct naming syntax, false otherwise.
   */
  private checkMigrationFilesNameSyntax(migrationFiles: string[]): boolean {
    return migrationFiles.every((file) => /^V\d+__\w+\.sql$/.test(file));
  }

  /**
   * @description Marks a migration as installed in the database.
   * @param {number} version - The version of the migration.
   * @param {string} fileName - The name of the migration file.
   * @param {boolean} success - True if the migration was applied successfully, false otherwise.
   */
  private async markMigrationAsInstalled(
    version: number,
    fileName: string,
    success: boolean,
  ): Promise<void> {
    const checkSum = this.calculateChecksum(fileName);
    const installedBy = process.env.MY_SQL_DB_USER || "unknown";

    const insertQuery = `
    INSERT INTO schema_history (version, file_name, check_sum, installed_by, success)
    VALUES (?, ?, ?, ?, ?)  
    `;

    await this.pool.query(insertQuery, [
      version,
      fileName,
      checkSum,
      installedBy,
      success,
    ]);
  }

  /**
   * @description Calculates the checksum of a file.
   * @param {string} fileName - The name of the file.
   * @returns {string} - The checksum of the file.
   */
  private calculateChecksum(fileName: string): string {
    const algorithm = "sha256";
    const hash = crypto.createHash(algorithm);

    const fileDir = path.join(this.migrationDir, fileName);
    const fileContent = fs.readFileSync(fileDir, "utf8");
    hash.update(fileContent, "utf8");

    const checksum = hash.digest("hex");
    return checksum;
  }

  /**
   * @description Extracts the version number from the migration file name.
   * @param {string} fileName - The name of the migration file.
   * @returns {number} - The version number of the migration.
   */
  private extractVersionFromFileName(fileName: string): number {
    return parseInt(fileName.match(/^V(\d+)/)![1], 10);
  }

  /**
   * @description Retrieves the list of installed migrations from the database.
   * @returns {HashedFile[]} - The list of installed migrations.
   */
  private async getInstalledMigrations(): Promise<HashedFile[]> {
    const query = `SELECT file_name AS fileName, check_sum AS hash FROM schema_history`;
    const [rows] = await this.pool.query<RowDataPacket[]>(query);
    return rows as HashedFile[];
  }

  /**
   * @description Retrieves the list of migration files from the migration directory.
   * @param {string} migrationDir - The directory where migration files are stored.
   * @returns {string[]} - The list of migration files.
   */
  private getMigrationFiles(migrationDir: string): string[] {
    const migrationFiles: string[] = fs.readdirSync(migrationDir);
    return migrationFiles;
  }

  /**
   * @description Creates the schema_history table in the database.
   */
  private createSchemaHistoryTable = async (): Promise<void> => {
    const migrationTableDir = path.join(__dirname, "./migration_table.sql");
    const migrationTableContent = fs.readFileSync(migrationTableDir, "utf8");
    await this.pool.query(migrationTableContent);
  };
}
