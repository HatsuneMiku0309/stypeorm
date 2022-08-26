"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = exports.OracleDatabase = exports.MysqlDatabase = void 0;
const platform_1 = require("./platform");
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
            this._db = await (database).getConnection(this._config);
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
;
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
        else {
            throw new Error('Unkowns type');
        }
    }
    get type() {
        return this._db.type;
    }
    async getConfig() {
        return this._config;
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