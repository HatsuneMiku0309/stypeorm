import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
import { PlatformTools } from './platform';

type TDatabaseType = 'oracle' | 'mysql';

interface IMysqlConnectionOptions {
    user?: string,
    password?: string;
    database?: string;
    charset?: string;
    host?: string;
    port?: number;
    timezone?: string | 'local';
    connectTimeout?: number;
    typeCast?: boolean | ((field: any, next: () => void) => any);
    queryFormat?: (query: string, values: any) => void;
    dateStrings?: boolean | Array<'TIMESTAMP' | 'DATETIME' | 'DATE'>;
    debug?: any;
    trace?: boolean;
    rowsAsArray?: boolean
}

interface IOracleConnectionOptions {
    connectString?: string;
    connectionString?: string;
    password?: string;
    user?: string;
}

interface IDbConfig extends IMysqlConnectionOptions, IOracleConnectionOptions {

};

interface IDatabase {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDb<T = any>(): Promise<T>;
    query(sql: string, values: any, options: { [params: string]: any }): Promise<{ rows: any[] }>;
    transaction<T>(db: T): Promise<T>;
    commit<T>(db: T): Promise<void>;
    rollback<T>(db: T): Promise<void>;
    end(): Promise<number>;
};

interface IDatabaseFactory {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDb<T = any>(): Promise<T>;
    query(sql: string, values: any, options: { [params: string]: any }): Promise<{ rows: any[] }>;
    transaction<T>(): Promise<T>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
};

class MysqlDatabase implements IDatabase {
    private _type: 'mysql' = 'mysql';
    private _db?: mysql.Connection;
    private _config: IMysqlConnectionOptions;
    constructor(config: IMysqlConnectionOptions) {
        this._config = config;
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<IDbConfig> {
        return this._config;
    }

    async getDb<T = any>(): Promise<T> {
        try {
            if (this._db) {
                return <any> this._db;
            }
            let db = await this._init();

            return <any> db;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<mysql.Connection> {
        try {
            this._db = await (<typeof mysql>await PlatformTools.load(this._type)).createConnection(this._config);

            return this._db;
        } catch (err) {
            throw err;
        }
    }

    async query(sql: string, values: any = [], options: { [params: string]: any } = { }): Promise<{ rows: any[] }> {
        try {
            let db = await this.getDb<mysql.Connection>();
            let [rows] = <[any[], mysql.FieldPacket[]]> await db.query(sql, values);

            return {
                rows
            };
        } catch (err) {
            throw err;
        }
    }

    async transaction<T>(db: T): Promise<T> {
        try {
            let _db = <mysql.Connection> <unknown>db;
            await _db.beginTransaction();

            return db;
        } catch (err) {
            throw err;
        }
    }

    async commit<T>(db: T): Promise<void> {
        try {
            let _db = <mysql.Connection> <unknown>db;
            await _db.commit();
        } catch (err) {
            throw err;
        }
    }

    async rollback<T>(db: T): Promise<void> {
        try {
            let _db = <mysql.Connection> <unknown>db;
            await _db.rollback();
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
    private _config: IOracleConnectionOptions;
    private _outFormat: number;
    /**
     * outFormat:
     *  
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */ 

    constructor(config: IOracleConnectionOptions, outFormat: number = 4002) {
        this._config = config;
        this._outFormat = outFormat
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<IDbConfig> {
        return this._config;
    }

    async getDb<T = any>(): Promise<T> {
        try {
            if (this._db) {
                return <any> this._db;
            }
            let db = await this._init();

            return <any> db;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<oracledb.Connection> {
        try {
            let database = <typeof oracledb> await PlatformTools.load(this._type);
            database.outFormat = this._outFormat;
            this._db = await database.getConnection(this._config);

            return this._db;
        } catch (err) {
            throw err;
        }
    }

    async query(sql: string, values: any = [], options: { [params: string]: any } = { }): Promise<{ rows: any[] }> {
        try {
            let db = await this.getDb<oracledb.Connection>();
            let result = await db.execute(sql, values);
            let rows = result.rows || [];

            return {
                rows: rows
            };
        } catch (err) {
            throw err;
        }
    }

    async transaction<T>(db: T): Promise<T> {
        try {
            return db;
        } catch (err) {
            throw err;
        }
    }

    async commit<T>(db: T): Promise<void> {
        try {
            let _db = <oracledb.Connection> <unknown> db;
            await _db.commit();
        } catch (err) {
            throw err;
        }
    }

    async rollback<T>(db: T): Promise<void> {
        try {
            let _db = <oracledb.Connection> <unknown>db;
            await _db.rollback();
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

    async getConfig(): Promise<IDbConfig> {
        return await this._config;
    }

    async getDb<T = any>(): Promise<T> {
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

    async transaction<T>(): Promise<T> {
        try {
            let db = await this.getDb<T>();
            let _db = await this._db.transaction(db);

            return _db;
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void> {
        try {
            let db = await this.getDb();
            await this._db.commit(db);
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void> {
        try {
            let db = await this.getDb();
            await this._db.rollback(db);
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
    IDbConfig,
    IDatabase,
    IDatabaseFactory,    
    MysqlDatabase,
    OracleDatabase,
    DatabaseFactory
}
