# MyMigrator

**MyMigrator** is a simple database migration tool for managing MySQL database schema changes in Node.js projects using `mysql2/promise`. It helps to ensure that database migrations are applied in order and prevents accidental modifications to previously run migrations.

## Installation

You can install the migration tool as an npm package:

```bash
npm install my-migrator
```

## Usage

### 1. Import the `DbMigration` class

```ts
import { DbMigration } from "my-migrator";
import { createPool } from "mysql2/promise";
```

### 2. Create a connection pool to your MySQL database

```ts
const pool = createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "your_database",
  // multipleStatements: true, // Allows executing multiple SQL statements in a single query
});
```

### 3. Initialize the migration instance

The `DbMigration` class requires two arguments:

- **pool**: The MySQL connection pool.
- **dir**: The directory where your migration files are stored.

```ts
const migrationDir = path.join(__dirname, "migrations");
const dbMigration = new DbMigration(pool, migrationDir);
```

### 4. Create your migration files

Migration files must follow a specific naming convention for the tool to recognize and process them. The correct naming format is:

```
V<number>__<description>.sql
```

For example:

```
V1__create_table_users.sql
V2__add_column_email_to_users.sql
```

Each migration file should contain valid SQL statements for the database changes you want to apply.

Here’s how you can update the section with a warning to ensure the user understands that the application should stop running if a migration fails:

---

### 5. Run migrations

To apply the pending migrations, call the `run()` method of the `DbMigration` instance.

```ts
(async () => {
  try {
    await dbMigration.run();
  } catch (error) {
    console.error("Migration failed:", error);
  }
})();
```

**Important:** If an error occurs during the migration, **do not edit or delete any existing migration files** that have already been installed in the database. Instead, you should create a new migration file to fix the issue rather than modifying the one that caused the error. Editing an already-installed migration file will lead to the following error:

```
Error: Migrations have been edited after being installed in ⚠️ V3__create_post_table.sql⚠️
        🙏please revert the changes and try again
```

To resolve the error:

1. Leave the problematic migration file as is.
2. Create a new migration file that fixes the issue.
3. Re-run the migration process to apply the new changes.

This ensures that the migration history remains consistent, preventing further errors and maintaining the integrity of the database.

### Migration Details

- **Automatic Checksums**: Each migration file's content is hashed using SHA256 and stored in the database to ensure no tampering occurs. If a previously installed migration file is edited or deleted, the tool will throw an error, preventing inconsistent migrations.
- **Schema History Table**: A `schema_history` table is automatically created in the database to track applied migrations, their versions, file names, and checksums. Below is an example of the `schema_history` table:

```sql
mysql> select * from schema_history;
```

| version | file_name                   | check_sum                                                        | installed_by | installed_in        | success |
| ------- | --------------------------- | ---------------------------------------------------------------- | ------------ | ------------------- | ------- |
| 1       | V1\_\_create_test_table.sql | b4af9bdc0c7f329322cb1beb4413ba129acbc1fce4263828bf117dbd9ca218a6 | admin        | 2024-09-08 16:19:34 | 1       |
| 2       | V2\_\_create_post_table.sql | be5f8428ee1311b9067b6176ae62794f3cdff552e846d8b906693b33c38ab428 | admin        | 2024-09-08 16:19:34 | 0       |
| 3       | V3\_\_create_post_table.sql | 63115d3fe315f39956249a792a183bb905cd5b66e82432087febea49b424cd5c | admin        | 2024-09-08 16:19:55 | 1       |

---

- **Columns Explained**:
  - **version**: The version number of the migration.
  - **file_name**: The name of the migration file.
  - **check_sum**: The SHA256 hash of the migration file’s content to detect changes.
  - **installed_by**: The username that applied the migration (retrieved from environment variables or set as "unknown").
  - **installed_in**: The timestamp of when the migration was applied.
  - **success**: Whether the migration was applied successfully (`1` for success, `0` for failure).

---

This table helps track all applied migrations, ensuring the integrity of the database schema.

### Error Handling

If any of the migrations fail, the tool will:

1. **Print the error message to the console**: The exact reason for the failure will be logged.
2. **Terminate the database connection**: The tool will stop further migration execution and close the database connection.
3. **Require a new migration file**: The failed migration **will not be rolled back automatically**. To fix the issue, you must create a **new migration file** rather than modifying or deleting the failed one.

**Important**: Once a migration fails:

- **Do not edit** the migration file that caused the error.
- Create a **new migration file** to resolve the issue.

Attempting to modify or delete the failed migration file will result in the following error when re-running the migration:

```
Error: Migrations have been edited after being installed in ⚠️ V2__create_post_table.sql⚠️
        🙏please revert the changes and try again
```

The migration process is designed this way to ensure the integrity of the database and maintain a clear history of changes.

### Example of Running Migrations

Here's a full example of how to use the `DbMigration` tool:

```ts
import { DbMigration } from "my-migrator";
import { createPool } from "mysql2/promise";
import path from "path";

(async () => {
  const pool = createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "my_database",
  });

  const migrationDir = path.join(__dirname, "migrations");

  const dbMigration = new DbMigration(pool, migrationDir);

  await dbMigration.run();
  await pool.end();
})();
```

## Important Notes

- **File Naming**: Make sure the migration files follow the `V<number>__<description>.sql` pattern. Any file that doesn't match this pattern will cause an error.
- **Checksum Integrity**: Once a migration file is applied, do not modify its content. The tool compares checksums of installed migrations to detect any changes.
- **Database Schema Table**: Ensure the `schema_history` table is created in the correct database. The tool handles this automatically, but it’s crucial to use the same database in your connection pool.

## License

This project is licensed under the MIT License.

---

### Contributing

Feel free to submit pull requests or open issues to improve this project.

---
