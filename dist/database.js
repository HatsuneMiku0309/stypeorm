"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = exports.OracleDatabase = exports.MysqlDatabase = exports.ISOLATION_LEVEL = void 0;
const platform_1 = require("./platform");
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
    async getDb() {
        try {
            if (this._db) {
                return this._db;
            }
            let db = await this._init();
            return db;
        }
        catch (err) {
            throw err;
        }
    }
    async _init() {
        try {
            this._db = await (await platform_1.PlatformTools.load(this._type)).createConnection(this._config);
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
            return db;
        }
        catch (err) {
            throw err;
        }
    }
    async commit(db) {
        try {
            let _db = db;
            await _db.commit();
        }
        catch (err) {
            throw err;
        }
    }
    async rollback(db) {
        try {
            let _db = db;
            await _db.rollback();
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            if (this._db) {
                await this._db.end();
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
    _type = 'oracle';
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
    async getDb() {
        try {
            if (this._db) {
                return this._db;
            }
            let db = await this._init();
            return db;
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
            this._db = await database.connect(_config);
            return this._db;
        }
        catch (err) {
            throw err;
        }
    }
    async query(sql, values, options) {
        try {
            let db = await this.getDb();
            let request = new this._database.Request(db);
            values.forEach((value, column) => {
                request.input(column, value);
            });
            let { recordset: rows } = await request.query(sql);
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
            let transaction = new this._database.Transaction(_db);
            await transaction.begin();
            return db;
        }
        catch (err) {
            throw err;
        }
    }
    commit(db) {
        throw new Error('Method not implemented.');
    }
    rollback(db) {
        throw new Error('Method not implemented.');
    }
    async end() {
        try {
            if (this._db) {
                await this._db.close();
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
    async getDb() {
        try {
            if (this._db) {
                return this._db;
            }
            let db = await this._init();
            return db;
        }
        catch (err) {
            throw err;
        }
    }
    async _init() {
        try {
            let database = await platform_1.PlatformTools.load(this._type);
            database.outFormat = this._outFormat;
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
            let result = await db.execute(sql, values);
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
            return db;
        }
        catch (err) {
            throw err;
        }
    }
    async commit(db) {
        try {
            let _db = db;
            await _db.commit();
        }
        catch (err) {
            throw err;
        }
    }
    async rollback(db) {
        try {
            let _db = db;
            await _db.rollback();
        }
        catch (err) {
            throw err;
        }
    }
    async end() {
        try {
            if (this._db) {
                await this._db.close();
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
    async getDb() {
        try {
            return await this._db.getDb();
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
            let db = await this.getDb();
            let _db = await this._db.transaction(db);
            return _db;
        }
        catch (err) {
            throw err;
        }
    }
    async commit() {
        try {
            let db = await this.getDb();
            await this._db.commit(db);
        }
        catch (err) {
            throw err;
        }
    }
    async rollback() {
        try {
            let db = await this.getDb();
            await this._db.rollback(db);
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