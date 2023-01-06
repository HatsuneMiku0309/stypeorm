"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = exports.OracleDatabase = exports.MysqlDatabase = exports.ISOLATION_LEVEL = void 0;
require('dotenv').config();
const source_map_support_1 = require("source-map-support");
(0, source_map_support_1.install)();
const platform_1 = require("./platform");
const process = require("process");
const os = require("os");
const { ORACLE_LIB_DIR } = process.env;
var ISOLATION_LEVEL;
(function (ISOLATION_LEVEL) {
    ISOLATION_LEVEL[ISOLATION_LEVEL["NO_CHANGE"] = 0] = "NO_CHANGE";
    ISOLATION_LEVEL[ISOLATION_LEVEL["READ_UNCOMMITTED"] = 1] = "READ_UNCOMMITTED";
    ISOLATION_LEVEL[ISOLATION_LEVEL["READ_COMMITTED"] = 2] = "READ_COMMITTED";
    ISOLATION_LEVEL[ISOLATION_LEVEL["REPEATABLE_READ"] = 3] = "REPEATABLE_READ";
    ISOLATION_LEVEL[ISOLATION_LEVEL["SERIALIZABLE"] = 4] = "SERIALIZABLE";
    ISOLATION_LEVEL[ISOLATION_LEVEL["SNAPSHOT"] = 5] = "SNAPSHOT";
})(ISOLATION_LEVEL = exports.ISOLATION_LEVEL || (exports.ISOLATION_LEVEL = {}));
;
;
;
;
class MysqlDatabase {
    _type = 'mysql';
    _database;
    _db;
    _config;
    constructor(config) {
        this._config = config;
    }
    get type() {
        return this._type;
    }
    async getConfig() {
        return this._config;
    }
    async getDatabase() {
        try {
            return this._database;
        }
        catch (err) {
            throw err;
        }
    }
    async getDb() {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async connect() {
        try {
            if (!!this._db) {
                return this;
            }
            if (this._database) {
                this._db = await this._database.createConnection(this._config);
            }
            else {
                await this._init();
            }
            return this;
        }
        catch (err) {
            throw err;
        }
    }
    async _init() {
        try {
            let database = await platform_1.PlatformTools.load(this._type);
            this._database = database;
            this._db = await database.createConnection(this._config);
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async query(sql, values = [], options = {}) {
        try {
            let db = await this.getDb();
            let [rows] = await db.query(sql, values);
            return {
                rows
            };
        }
        catch (err) {
            throw err;
        }
    }
    async transaction(db) {
        try {
            let _db = db;
            await _db.beginTransaction();
        }
        catch (err) {
            throw err;
        }
    }
    async commit() {
        try {
            if (this._db) {
                await this._db.commit();
            }
        }
        catch (err) {
            throw err;
        }
    }
    async rollback() {
        try {
            if (this._db) {
                await this._db.rollback();
            }
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            if (this._db) {
                await this._db.end();
                this._db = undefined;
                return 1;
            }
            return 0;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.MysqlDatabase = MysqlDatabase;
class MssqlDatabase {
    _type = 'mssql';
    _database;
    _pool;
    _db;
    _tx;
    _config;
    constructor(config) {
        this._config = config;
    }
    get type() {
        return this._type;
    }
    async getConfig() {
        return this._config;
    }
    async getDatabase() {
        try {
            return this._database;
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * @descript
     *  If have `tx`(transaction), return tx.
     *
     *  How to knowns return `tx` or `db`?, when call The method after called `transaction()`.
     *
     *  When you called `commit` or `rollback`, you call again the method get `db`
     *
     * @returns
     */
    async getDb() {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }
            if (this._tx) {
                return this._tx;
            }
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async connect() {
        try {
            if (this._pool) {
                this._db = await this._pool.connect();
            }
            else {
                await this._init();
            }
            return this;
        }
        catch (err) {
            throw err;
        }
    }
    async _init() {
        try {
            let database = await platform_1.PlatformTools.load(this._type);
            this._database = database;
            let _config = {
                ...this._config,
                server: this._config.server
                    ? this._config.server
                    : this._config.host
            };
            this._pool = new database.ConnectionPool(_config);
            this._db = await this._pool.connect();
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    /**
     *
     * @param sql
     * @param values
     * @param options
     * @returns
     *
     * @descript
     *  If have `tx`(transaction), first use `tx`.
     *
     * @exmple
     * Prepared Statement:
     *
     *      sql: `SELECT * FROM test WHERE ID = @ID`; values: `{ ID: 123 }`
     */
    async query(sql, values, options) {
        try {
            let db = await this.getDb();
            let request = new this._database.Request(db);
            for (let column in values) {
                request.input(column, values[column]);
            }
            let { recordset: rows } = await request.query(sql);
            return {
                rows
            };
        }
        catch (err) {
            throw err;
        }
    }
    /**
     *
     * @param db
     */
    async transaction(db) {
        try {
            if (this._tx) {
                return;
            }
            let _db = db;
            let transaction = new this._database.Transaction(_db);
            await transaction.begin();
            this._tx = transaction;
        }
        catch (err) {
            throw err;
        }
    }
    async commit() {
        try {
            if (this._tx) {
                await this._tx.commit();
                this._tx = undefined;
            }
        }
        catch (err) {
            throw err;
        }
    }
    async rollback() {
        try {
            if (this._tx) {
                await this._tx.rollback();
                this._tx = undefined;
            }
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            if (this._db) {
                await this._db.close();
                this._db = undefined;
                return 1;
            }
            return 0;
        }
        catch (err) {
            throw err;
        }
    }
}
class OracleDatabase {
    _type = 'oracle';
    _database;
    _db;
    _config;
    _outFormat;
    /**
     * outFormat:
     *
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */
    constructor(config, outFormat = 4002) {
        this._config = config;
        this._outFormat = outFormat;
    }
    get type() {
        return this._type;
    }
    async getConfig() {
        return this._config;
    }
    async getDatabase() {
        try {
            return this._database;
        }
        catch (err) {
            throw err;
        }
    }
    async getDb() {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async connect() {
        try {
            if (!!this._db) {
                return this;
            }
            if (this._database) {
                this._db = await this._database.getConnection(this._config);
            }
            else {
                await this._init();
            }
            return this;
        }
        catch (err) {
            throw err;
        }
    }
    async _init() {
        try {
            let database = await platform_1.PlatformTools.load(this._type);
            database.outFormat = this._outFormat;
            this._database = database;
            if (os.platform() === 'darwin') {
                this._database.initOracleClient({
                    libDir: ORACLE_LIB_DIR
                });
            }
            this._database.autoCommit = true;
            this._db = await database.getConnection(this._config);
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async query(sql, values = [], options = {}) {
        try {
            let db = await this.getDb();
            let result = await db.execute(sql, values, options);
            let rows = result.rows || [];
            return {
                rows: rows
            };
        }
        catch (err) {
            throw err;
        }
    }
    async transaction(db) {
        try {
            this._database.autoCommit = false;
        }
        catch (err) {
            throw err;
        }
    }
    async commit() {
        try {
            if (this._db) {
                await this._db.commit();
            }
            this._database.autoCommit = true;
        }
        catch (err) {
            throw err;
        }
    }
    async rollback() {
        try {
            if (this._db) {
                await this._db.rollback();
            }
            this._database.autoCommit = true;
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            if (this._db) {
                await this._db.close();
                this._db = undefined;
                return 1;
            }
            return 0;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.OracleDatabase = OracleDatabase;
class DatabaseFactory {
    _db;
    _config;
    constructor(type, config) {
        this._config = config;
        if (type === 'mysql') {
            this._db = new MysqlDatabase(config);
        }
        else if (type === 'oracle') {
            if (ORACLE_LIB_DIR === undefined && os.platform() === 'darwin') {
                throw new Error('Should setting ORACLE_LIB_DIR env.');
            }
            this._db = new OracleDatabase(config);
        }
        else if (type === 'mssql') {
            this._db = new MssqlDatabase(config);
        }
        else {
            throw new Error('Unkowns type');
        }
    }
    get type() {
        return this._db.type;
    }
    async getConfig() {
        return await this._config;
    }
    async getDatabase() {
        try {
            return await this._db.getDatabase();
        }
        catch (err) {
            throw err;
        }
    }
    async getDb() {
        try {
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async connect() {
        try {
            await this._db.connect();
            return this;
        }
        catch (err) {
            throw err;
        }
    }
    async query(sql, values = [], options = {}) {
        try {
            let result = await this._db.query(sql, values, options);
            return result;
        }
        catch (err) {
            throw err;
        }
    }
    async transaction() {
        try {
            let db = await (await this.getDb()).getDb();
            await this._db.transaction(db);
        }
        catch (err) {
            throw err;
        }
    }
    async commit() {
        try {
            await this._db.commit();
        }
        catch (err) {
            throw err;
        }
    }
    async rollback() {
        try {
            await this._db.rollback();
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            let result = await this._db.end();
            return result;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.DatabaseFactory = DatabaseFactory;
//# sourceMappingURL=database.js.map