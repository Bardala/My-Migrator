"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbMigration = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const Error_1 = require("../Error");
class DbMigration {
    constructor(pool, dir) {
        this.migrationDir = "";
        this.createSchemaHistoryTable = () => __awaiter(this, void 0, void 0, function* () {
            const migrationTableDir = path_1.default.join(__dirname, "./migration_table.sql");
            const migrationTableContent = fs_1.default.readFileSync(migrationTableDir, "utf8");
            yield this.pool.query(migrationTableContent);
        });
        this.pool = pool;
        this.migrationDir = dir;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createSchemaHistoryTable();
            const migrationFiles = this.getMigrationFiles(this.migrationDir);
            if (!this.checkMigrationFilesNameSyntax(migrationFiles)) {
                throw new Error(Error_1.ERROR.INVALID_MIGRATION_FILE_NAME);
            }
            const installedMigrations = yield this.getInstalledMigrations();
            this.checkOldMigrations(installedMigrations, migrationFiles);
            const pendingMigrations = migrationFiles.filter((file) => {
                return !installedMigrations.some((migration) => migration.fileName === file);
            });
            yield this.runPendingMigration(pendingMigrations);
            console.log("\n\t\t🎈 🎉 🎊 🥳\n\tAll DB migrations up to date😊\n");
        });
    }
    checkOldMigrations(installedMigrations, migrationFiles) {
        const editedMigrations = installedMigrations.filter((installedMigration) => {
            const migrationFile = migrationFiles.find((file) => file === installedMigration.fileName);
            if (!migrationFile)
                return true;
            const checkSum = this.calculateChecksum(migrationFile);
            return checkSum !== installedMigration.hash;
        });
        if (editedMigrations.length > 0) {
            const editedFileNames = editedMigrations.map((edited) => edited.fileName);
            throw new Error(`Migrations have been edited after being installed in ⚠️ ${editedFileNames.join(",")}⚠️
        🙏please revert the changes and try again\n`);
        }
    }
    runPendingMigration(pendingMigrations) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const currFile of pendingMigrations) {
                const version = this.extractVersionFromFileName(currFile);
                const migrationContent = fs_1.default.readFileSync(path_1.default.join(this.migrationDir, currFile), "utf8");
                try {
                    yield this.pool.query(migrationContent);
                    yield this.markMigrationAsInstalled(version, currFile, true);
                    const processName = currFile
                        .match(/^V\d+__(\w+)\.sql$/)[1]
                        .replace(/_/g, " ");
                    console.log(`\n\t👏 Migration ${version} applied successfully, \n\t✅ process: ${processName}`);
                }
                catch (error) {
                    console.error(`\t⛔Error applying migration in Version(${version}): \n\t⛔${error}`);
                    yield this.markMigrationAsInstalled(version, currFile, false);
                    yield this.pool.end();
                    process.exit(1);
                }
            }
        });
    }
    checkMigrationFilesNameSyntax(migrationFiles) {
        return migrationFiles.every((file) => /^V\d+__\w+\.sql$/.test(file));
    }
    markMigrationAsInstalled(version, fileName, success) {
        return __awaiter(this, void 0, void 0, function* () {
            const checkSum = this.calculateChecksum(fileName);
            const installedBy = process.env.MY_SQL_DB_USER || "unknown";
            const insertQuery = `
    INSERT INTO schema_history (version, file_name, check_sum, installed_by, success)
    VALUES (?, ?, ?, ?, ?)  
    `;
            yield this.pool.query(insertQuery, [
                version,
                fileName,
                checkSum,
                installedBy,
                success,
            ]);
        });
    }
    calculateChecksum(fileName) {
        const algorithm = "sha256";
        const hash = node_crypto_1.default.createHash(algorithm);
        const fileDir = path_1.default.join(this.migrationDir, fileName);
        const fileContent = fs_1.default.readFileSync(fileDir, "utf8");
        hash.update(fileContent, "utf8");
        const checksum = hash.digest("hex");
        return checksum;
    }
    extractVersionFromFileName(fileName) {
        return parseInt(fileName.match(/^V(\d+)/)[1], 10);
    }
    getInstalledMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `SELECT file_name AS fileName, check_sum AS hash FROM schema_history`;
            const [rows] = yield this.pool.query(query);
            return rows;
        });
    }
    getMigrationFiles(migrationDir) {
        const migrationFiles = fs_1.default.readdirSync(migrationDir);
        return migrationFiles;
    }
}
exports.DbMigration = DbMigration;
