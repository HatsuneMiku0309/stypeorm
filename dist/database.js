"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = exports.OracleDatabase = exports.MysqlDatabase = void 0;
require('dotenv').config();
const source_map_support_1 = require("source-map-support");
(0, source_map_support_1.install)();
const process = require("process");
const os = require("os");
const mysql_1 = require("./databases/mysql");
Object.defineProperty(exports, "MysqlDatabase", { enumerable: true, get: function () { return mysql_1.MysqlDatabase; } });
const oracle_1 = require("./databases/oracle");
Object.defineProperty(exports, "OracleDatabase", { enumerable: true, get: function () { return oracle_1.OracleDatabase; } });
const mssql_1 = require("./databases/mssql");
const { ORACLE_LIB_DIR } = process.env;
class DatabaseFactory {
    static _type;
    static _db;
    static _config;
    constructor() { }
    static get type() {
        return DatabaseFactory._type;
    }
    static get config() {
        return DatabaseFactory._config;
    }
    static async createDatabase(type, config) {
        try {
            if (DatabaseFactory._db) {
                return DatabaseFactory._db;
            }
            DatabaseFactory._type = type;
            DatabaseFactory._config = config;
            if (type === 'mysql') {
                DatabaseFactory._db = new mysql_1.MysqlDatabase(config);
            }
            else if (type === 'oracle') {
                if (ORACLE_LIB_DIR === undefined && os.platform() === 'darwin') {
                    throw new Error('Should setting ORACLE_LIB_DIR env.');
                }
                DatabaseFactory._db = new oracle_1.OracleDatabase(config);
            }
            else if (type === 'mssql') {
                DatabaseFactory._db = new mssql_1.MssqlDatabase(config);
            }
            else {
                throw new Error('Unkowns type');
            }
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.DatabaseFactory = DatabaseFactory;
//# sourceMappingURL=database.js.map