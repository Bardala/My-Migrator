import { DbMigration } from "../../my-migrator/src";
// import { DbMigration } from "my-migrator";

import mysql from "mysql2";
import { Pool } from "mysql2/promise";
import { TestUser } from "./server";
import path from "path";

export class SqlDataStore {
  private pool!: Pool;

  async runDB() {
    this.pool = mysql
      .createPool({
        host: "127.0.0.1",
        user: "root",
        password: "88888888",
        database: "test_db_migration_tool",
        multipleStatements: true,
      })
      .promise();

    const migrationDir: string = path.join(__dirname, "./migration");
    const migration = new DbMigration(this.pool, migrationDir);

    await migration.run();
    return this;
  }

  async createTestUser(user: TestUser): Promise<void> {
    await this.pool.query(
      `INSERT INTO test_user (id, age, name, email) VALUES (?, ?, ?, ?)`,
      [user.id, user.age, user.name, user.email],
    );
  }
}
