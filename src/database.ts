require('dotenv').config();
import { install } from 'source-map-support';
install();

import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
import * as mssql from 'mssql';
import { PlatformTools } from './platform';
import * as process from 'process';
import * as os from 'os';
import { TDatabaseType, TDbConfig, TMssqlConfig, TMysqlConfig, TOracleConfig } from './index.interface';
import { IDbConfig, DbConfig } from './config';

const {
    ORACLE_LIB_DIR
} = process.env;


export enum ISOLATION_LEVEL {
    NO_CHANGE = 0x00,
    READ_UNCOMMITTED = 0x01,
    READ_COMMITTED = 0x02,
    REPEATABLE_READ = 0x03,
    SERIALIZABLE = 0x04,
    SNAPSHOT = 0x05
};

interface IDatabase {
    type: TDatabaseType;
    getConfig(): Promise<TDbConfig>;
    getDatabase(): Promise<typeof mysql | typeof mssql | typeof oracledb>;
    getDb<T = any>(): Promise<T>;
    pool(): Promise<IDatabase>;
    poolConnection(): Promise<mysql.PoolConnection | mssql.ConnectionPool | oracledb.Connection>;
    connect(): Promise<IDatabase>;
    query<T = any>(sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: T[] }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
};

interface IDatabaseFactory {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDatabase<T extends 'mysql'>(): Promise<typeof mysql>;
    getDatabase<T extends 'mssql'>(): Promise<typeof mssql>;
    getDatabase<T extends 'oracle'>(): Promise<typeof oracledb>;
    getDatabase<T extends TDatabaseType>(): Promise<typeof mysql | typeof mssql | typeof oracledb>;
    getDb(): Promise<IDatabase>;
    pool(): Promise<IDatabaseFactory>;
    poolConnection<T extends 'mysql'>(): Promise<mysql.PoolConnection>;
    poolConnection<T extends 'mssql'>(): Promise<mssql.ConnectionPool>;
    poolConnection<T extends 'oracle'>(): Promise<oracledb.Connection>;
    poolConnection<T extends TDatabaseType>(): Promise<mysql.PoolConnection | mssql.ConnectionPool | oracledb.Connection>;
    connect(): Promise<IDatabaseFactory>;
    query<T = any>(sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: T[] }>;
    transaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
};

class MysqlDatabase implements IDatabase {
    private _type: 'mysql' = 'mysql';
    private _database!: typeof mysql;
    private _pool?: mysql.Pool;
    private _db?: mysql.Connection;
    private _config: TMysqlConfig;
    constructor(config: TMysqlConfig) {
        this._config = config;
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<TMysqlConfig> {
        return this._config;
    }

    async getDatabase(): Promise<typeof mysql> {
        try {
            return this._database;
        } catch (err) {
            throw err;
        }
    }

    async getDb<T = any>(): Promise<T> {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }

            return <any> this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabase> {
        try {
            if (!!this._pool) {
                return this;
            }

            if (this._database) {
                this._pool = this._database.createPool(this._config);
            } else {
                let database = await this._init();
                this._pool = database.createPool(this._config);
            }

            return this;
        } catch (err) {
            throw err;
        }
    }

    async poolConnection(): Promise<mysql.PoolConnection> {
        try {
            if (!this._pool) {
                throw new Error('Need Create Pool');
            }

            let db = await this._pool?.getConnection();
            

            return db;
        } catch (err) {
            throw err;
        }
    }

    async connect(): Promise<IDatabase> {
        try {
            if (!!this._db) {
                return this;
            }

            let database = await this._init();
            this._db = await database.createConnection(this._config);

            return this;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<typeof mysql> {
        try {
            if (this._database) {
                return this._database;
            }

            let database = <typeof mysql> await PlatformTools.load(this._type);
            this._database = database;

            return this._database;
        } catch (err) {
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
     * @exmple
     * Prepared Statement:
     * 
     *      sql: `SELECT * FROM test WHERE ID = ?`; values: `[123]`
     */
    async query<T = any>(
        sql: string, values: any = [],
        options: { [params: string]: any } = { }
    ): Promise<{ rows: T[] }> {
        try {
            let db = await this.getDb<mysql.Connection>();
            let [rows] = <[T[], mysql.FieldPacket[]]> await db.query(sql, values);

            return {
                rows
            };
        } catch (err) {
            throw err;
        }
    }

    async transaction<T>(db: T): Promise<void> {
        try {
            let _db = <mysql.Connection> <unknown>db;
            await _db.beginTransaction();
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void> {
        try {
            if (this._db) {
                await this._db.commit();
            }
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void> {
        try {
            if (this._db) {
                await this._db.rollback();
            }
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            if (this._db) {
                await this._db.end();
                this._db = undefined;

                return 1;
            }

            return 0;
        } catch (err) {
            throw err;
        }
    }
}

class MssqlDatabase implements IDatabase {
    private _type: 'mssql' = 'mssql';
    private _database!: typeof mssql;
    private _pool!: mssql.ConnectionPool;
    private _db?: mssql.ConnectionPool;
    private _tx?: mssql.Transaction;
    private _config: TMssqlConfig
    constructor(config: TMssqlConfig) {
        this._config= config;
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<TMssqlConfig> {
        return this._config;
    }

    async getDatabase(): Promise<typeof mssql> {
        try {
            return this._database;
        } catch (err) {
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
    async getDb<T = any>(): Promise<T> {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }

            if (this._tx) {
                return <any> this._tx;
            }

            return <any> this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabase> {
        try {
            if (!this._pool) {
                let database = await this._init();
                this._pool = new database.ConnectionPool(this._config);
            }

            return this;
        } catch (err) {
            throw err;
        }
    }

    async poolConnection(): Promise<mssql.ConnectionPool> {
        try {
            if (!this._pool) {
                throw new Error('Need Create Pool');
            }

            let db = await this._pool.connect();

            return db;
        } catch (err) {
            throw err;
        }
    }

    async connect(): Promise<IDatabase> {
        try {
            if (!!this._db) {
                return this;
            }

            let database = await this._init();
            let pool = new database.ConnectionPool({
                ...this._config,
                pool: {
                    min: 0,
                    max: 1
                }
            });
            this._db = await pool.connect();

            return this;
        } catch (err) {
            throw err;
        }
    }

    private async _init(): Promise<typeof mssql> {
        try {
            if (this._database) {
                return this._database;
            }
            
            let database = <typeof mssql> await PlatformTools.load(this._type);
            this._database = database;

            return this._database;
        } catch (err) {
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
    async query<T = any>(
        sql: string, values: any,
        options: { [params: string]: any; }
    ): Promise<{ rows: T[]; }> {
        try {
            let db = await this.getDb<mssql.ConnectionPool & mssql.Transaction>();
            let request = new this._database.Request(db);
            for (let column in values) {
                request.input(column, values[column]);
            }
            let { recordset: rows } = await request.query<T>(sql);

            return {
                rows
            };
        } catch (err) {
            throw err;
        }
    }
    
    /**
     * 
     * @param db 
     */
    async transaction<T>(db: T): Promise<void> {
        try {
            if (this._tx) {
                return ;
            }

            let _db = <mssql.ConnectionPool> <unknown>db;
            let transaction = new this._database.Transaction(_db);
            await transaction.begin();
            this._tx = transaction;
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void> {
        try {
            if (this._tx) {
                await this._tx.commit();
                this._tx = undefined;
            }
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void> {
        try {
            if (this._tx) {
                await this._tx.rollback();
                this._tx = undefined;
            }
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            if (this._db) {
                await this._db.close();
                this._db = undefined;

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
    private _database!: typeof oracledb;
    private _db?: oracledb.Connection;
    private _pool?: oracledb.Pool;
    private _config: TOracleConfig;
    private _outFormat: number;
    /**
     * outFormat:
     *  
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */ 

    constructor(config: TOracleConfig, outFormat: number = 4002) {
        this._config = config;
        this._outFormat = outFormat
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<TOracleConfig> {
        return this._config;
    }

    async getDatabase(): Promise<typeof oracledb> {
        try {
            return this._database;
        } catch (err) {
            throw err;
        }
    }

    async getDb<T = any>(): Promise<T> {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }

            return <any> this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabase> {
        try {
            if (this._pool) {
                return this;
            }

            let database = await this._init();
            this._pool = await database.createPool(this._config);

            return this;
        } catch (err) {
            throw err;
        }
    }

    async poolConnection(): Promise<oracledb.Connection> {
        try {
            if (!this._pool) {
                throw new Error('Need Create Pool');
            }

            let db = await this._pool.getConnection();

            return db;
        } catch (err) {
            throw err;
        }
    }

    async connect(): Promise<IDatabase> {
        try {
            if (!!this._db) {
                return this;
            }

            let database = await this._init();
            this._db = await database.getConnection(this._config);

            return this;
        } catch (err) {
            throw err;
        }
    }
    
    private async _init(): Promise<typeof oracledb> {
        try {
            if (this._database) {
                return this._database;
            }

            let database = <typeof oracledb> await PlatformTools.load(this._type);
            database.outFormat = this._outFormat;
            this._database = database;

            if (os.platform() === 'darwin') {
                try {
                    this._database.initOracleClient({
                        libDir: ORACLE_LIB_DIR
                    });
                } catch (err) {
                    console.warn(err);
                }
            }
            this._database.autoCommit = true;

            return this._database;
        } catch (err) {
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
     * @exmple
     * Prepared Statement:
     * 
     *      sql: `SELECT * FROM test WHERE ID = :0`; values: `[123]`
     */
    async query<T = any>(
        sql: string, values: any = [],
        options: { [params: string]: any } = { }
    ): Promise<{ rows: T[] }> {
        try {
            let db = await this.getDb<oracledb.Connection>();
            let result = await db.execute<T>(sql, values, options);
            let rows = result.rows || [];

            return {
                rows: rows
            };
        } catch (err) {
            throw err;
        }
    }

    async transaction<T>(db: T): Promise<void> {
        try {
            this._database.autoCommit = false;
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void> {
        try {
            if (this._db) {
                await this._db.commit();
            }
            this._database.autoCommit = true;
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void> {
        try {
            if (this._db) {
                await this._db.rollback();
            }

            this._database.autoCommit = true;
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number> {
        try {
            if (this._db) {
                await this._db.close();
                this._db = undefined;

                return 1;
            }

            return 0;
        } catch (err) {
            throw err;
        }
    }
}

class DatabaseFactory <T extends TDatabaseType> implements IDatabaseFactory {
    private _type: T;
    private _db: IDatabase;
    private _config: IDbConfig;
    constructor(type: T, config: IDbConfig) {
        this._config = config;
        this._type = type;
        if (type === 'mysql') {
            this._db = new MysqlDatabase(config.getConfig());
        } else if (type === 'oracle') {
            if (ORACLE_LIB_DIR === undefined && os.platform() === 'darwin') {
                throw new Error('Should setting ORACLE_LIB_DIR env.');
            }
            this._db = new OracleDatabase(config.getConfig());
        } else if (type === 'mssql') {
            this._db = new MssqlDatabase(<TMssqlConfig> config.getConfig());
        } else {
            throw new Error('Unkowns type');
        }
    }

    get type() {
        return this._db.type;
    }

    async getConfig(): Promise<IDbConfig> {
        return this._config;
    }

    async getDatabase<T extends 'mysql'>(): Promise<typeof mysql>;
    async getDatabase<T extends 'mssql'>(): Promise<typeof mssql>;
    async getDatabase<T extends 'oracle'>(): Promise<typeof oracledb>;
    async getDatabase<T extends TDatabaseType>(): Promise<typeof mysql | typeof mssql | typeof oracledb> {
        try {
            return await this._db.getDatabase();
        } catch (err) {
            throw err;
        }
    }

    async getDb(): Promise<IDatabase> {
        try {
            return this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabaseFactory> {
        try {
            await this._db.pool();

            return this;
        } catch (err) {
            throw err;
        }
    }

    async poolConnection<T extends 'mysql'>(): Promise<mysql.PoolConnection>;
    async poolConnection<T extends 'mssql'>(): Promise<mssql.ConnectionPool>;
    async poolConnection<T extends 'oracle'>(): Promise<oracledb.Connection>;
    async poolConnection<T extends TDatabaseType>(
    ): Promise<mysql.PoolConnection | mssql.ConnectionPool | oracledb.Connection> {
        try {
            let db: mysql.PoolConnection | mssql.ConnectionPool | oracledb.Connection;
            switch (this._type) {
                case 'mysql':
                    db = await this._db.poolConnection();
                    break;
                case 'mssql':
                    db = await this._db.poolConnection();
                    break;
                case 'oracle':
                    db = await this._db.poolConnection();
                    break;
                default:
                    throw new Error('Unkowns type');
            }

            return db;
        } catch (err) {
            throw err;
        }
    }

    async connect(): Promise<IDatabaseFactory> {
        try {
            await this._db.connect();

            return this;
        } catch (err) {
            throw err;
        }
    }
    
    async query<T = any>(
        sql: string, values: any = [],
        options: { [params: string]: any; } = { }
    ): Promise<{ rows: T[]; }> {
        try {
            let result = await this._db.query<T>(sql, values, options);

            return result;
        } catch (err) {
            throw err;
        }
    }

    async transaction(): Promise<void> {
        try {
            let db = await (await this.getDb()).getDb();
            await this._db.transaction(db);
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void> {
        try {
            await this._db.commit();
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void> {
        try {
            await this._db.rollback();
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
    TMysqlConfig,
    TMssqlConfig,
    TOracleConfig,
    TDbConfig,
    IDatabase,
    IDatabaseFactory,    
    MysqlDatabase,
    OracleDatabase,
    DatabaseFactory,
    IDbConfig,
    DbConfig
}
