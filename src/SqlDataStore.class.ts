import { DbMigration } from "./DbMigration/Migration.class";
import mysql from "mysql2";
import { Pool } from "mysql2/promise";
import { TestUser } from "./types";

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

    const migration = new DbMigration(this.pool);
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
