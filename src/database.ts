import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
import { PlatformTools } from './platform';

type TDatabaseType = 'oracle' | 'mysql';
type TConnectionDb = oracledb.Connection | mysql.Connection;

interface IDbConfig extends oracledb.ConnectionAttributes, mysql.ConnectionOptions {
    
};

interface IDatabase {
    type: TDatabaseType,
    getDb(): Promise<TConnectionDb>,
    query(sql: string, values: any, options: { [params: string]: any }): Promise<{ rows: any[] }>,
    end(): Promise<number>
};

class MysqlDatabase implements IDatabase {
    private _type: 'mysql' = 'mysql';
    private _db?: mysql.Connection;
    private _config: mysql.ConnectionOptions;
    constructor(config: mysql.ConnectionOptions) {
        this._config = config;
    }

    get type() {
        return this._type;
    }

    async getDb(): Promise<mysql.Connection> {
        try {
            if (this._db) {
                return this._db;
            }
            let db = await this._init();

            return db;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<mysql.Connection> {
        try {
            this._db = <mysql.Connection> (await PlatformTools.load(this._type)).createConnection(this._config);

            return this._db;
        } catch (err) {
            throw err;
        }
    }

    async query(sql: string, values: any = [], options: { [params: string]: any } = { }): Promise<{ rows: any[] }> {
        try {
            let db = await this.getDb();
            let [rows] = <[any[], mysql.FieldPacket[]]> await (<mysql.Connection> db).query(sql, values);

            return {
                rows
            };
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            if (this._db) {
                await this._db.end();

                return 1;
            }

            return 0;
        } catch (err) {
            throw err;
        }
    }
}

class OracleDatabase implements IDatabase {
    private _type: 'oracle' = 'oracle';
    private _db?: oracledb.Connection;
    private _config: oracledb.ConnectionAttributes;
    private _outFormat: number;
    /**
     * outFormat:
     *  
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */ 

    constructor(config: oracledb.ConnectionAttributes, outFormat: number = 4002) {
        this._config = config;
        this._outFormat = outFormat
    }

    get type() {
        return this._type;
    }

    async getDb(): Promise<oracledb.Connection> {
        try {
            if (this._db) {
                return this._db;
            }
            let db = await this._init();

            return db;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<oracledb.Connection> {
        try {
            let database = <any> await PlatformTools.load(this._type);
            database.outFormat = this._outFormat;
            this._db = <oracledb.Connection> (database).getConnection(this._config);

            return this._db;
        } catch (err) {
            throw err;
        }
    }

    async query(sql: string, values: any = [], options: { [params: string]: any } = { }): Promise<{ rows: any[] }> {
        try {
            let db = await this.getDb();
            let result = await db.execute(sql, values);
            let rows = result.rows || [];

            return {
                rows: rows
            };
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            if (this._db) {
                await this._db.close();

                return 1;
            }

            return 0;
        } catch (err) {
            throw err;
        }
    }
}

interface IDatabaseFactory {
    type: TDatabaseType,
    getConfig(): Promise<IDbConfig>,
    getDb(): Promise<TConnectionDb>,
    query(sql: string, values: any, options: { [params: string]: any }): Promise<{ rows: any[] }>,
    end(): Promise<number>
};

class DatabaseFactory implements IDatabaseFactory {
    private _db: IDatabase;
    private _config: IDbConfig;
    constructor(type: TDatabaseType, config: IDbConfig) {
        this._config = config;
        if (type === 'mysql') {
            this._db = new MysqlDatabase(config);
        } else if (type === 'oracle') {
            this._db = new OracleDatabase(config);
        } else {
            throw new Error('Unkowns type');
        }
    }

    get type(): TDatabaseType {
        return this._db.type;
    }

    async getConfig() {
        return this._config;
    }

    async getDb<T extends 'mysql'>(): Promise<mysql.Connection>
    async getDb<T extends 'oracle'>(): Promise<oracledb.Connection>
    async getDb<T extends TDatabaseType>(): Promise<TConnectionDb> {
        try {
            return await this._db.getDb();
        } catch (err) {
            throw err;
        }
    }
    
    async query(sql: string, values: any = [], options: { [params: string]: any; } = { }): Promise<{ rows: any[]; }> {
        try {
            let result = await this._db.query(sql, values, options);

            return result;
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            let result = await this._db.end();

            return result;
        } catch (err) {
            throw err;
        }
    }

}

export {
    TDatabaseType,
    TConnectionDb,
    IDbConfig,
    IDatabase,
    IDatabaseFactory,    
    MysqlDatabase,
    OracleDatabase,
    DatabaseFactory
}
