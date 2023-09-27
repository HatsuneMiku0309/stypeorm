import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
import * as mssql from 'mssql';
import { TDatabaseType, TDbConfig, TMssqlConfig, TMysqlConfig, TOracleConfig } from './index.interface';
import { IDbConfig, DbConfig } from './config';
export declare enum ISOLATION_LEVEL {
    NO_CHANGE = 0,
    READ_UNCOMMITTED = 1,
    READ_COMMITTED = 2,
    REPEATABLE_READ = 3,
    SERIALIZABLE = 4,
    SNAPSHOT = 5
}
interface IDatabase {
    type: TDatabaseType;
    getConfig(): Promise<TDbConfig>;
    getDatabase(): Promise<typeof mysql | typeof mssql | typeof oracledb>;
    getDb<T = any>(): Promise<T>;
    pool(): Promise<IDatabase>;
    poolConnection(): Promise<mysql.PoolConnection | mssql.ConnectionPool | oracledb.Connection>;
    connect(): Promise<IDatabase>;
    query<T = any>(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: T[];
    }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
interface IDatabaseFactory<T extends TDatabaseType> {
    getConfig(): Promise<IDbConfig<T>>;
    getDatabase(): Promise<TDatabase<T>>;
    getDb(): Promise<IDatabase>;
    pool(): Promise<IDatabaseFactory<T>>;
    poolConnection(): Promise<TPoolConnection<T>>;
    connect(): Promise<IDatabaseFactory<T>>;
    query<T = any>(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: T[];
    }>;
    transaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
type TDatabase<T> = T extends 'mysql' ? typeof mysql : T extends 'mssql' ? typeof mssql : T extends 'oracle' ? typeof oracledb : never;
type TPoolConnection<T> = T extends 'mysql' ? mysql.PoolConnection : T extends 'mssql' ? mssql.ConnectionPool : T extends 'oracle' ? oracledb.Connection : never;
declare class MysqlDatabase implements IDatabase {
    private _type;
    private _database;
    private _pool?;
    private _db?;
    private _config;
    constructor(config: TMysqlConfig);
    get type(): "mysql";
    getConfig(): Promise<TMysqlConfig>;
    getDatabase(): Promise<typeof mysql>;
    getDb<T = any>(): Promise<T>;
    pool(): Promise<IDatabase>;
    poolConnection(): Promise<mysql.PoolConnection>;
    connect(): Promise<IDatabase>;
    private _init;
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
    query<T = any>(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: T[];
    }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
declare class OracleDatabase implements IDatabase {
    private _type;
    private _database;
    private _db?;
    private _pool?;
    private _config;
    private _outFormat;
    /**
     * outFormat:
     *
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */
    constructor(config: TOracleConfig, outFormat?: number);
    get type(): "oracle";
    getConfig(): Promise<TOracleConfig>;
    getDatabase(): Promise<typeof oracledb>;
    getDb<T = any>(): Promise<T>;
    pool(): Promise<IDatabase>;
    poolConnection(): Promise<oracledb.Connection>;
    connect(): Promise<IDatabase>;
    private _init;
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
    query<T = any>(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: T[];
    }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
declare class DatabaseFactory<T extends TDatabaseType, K extends T> implements IDatabaseFactory<T> {
    private _type;
    private _db;
    private _config;
    constructor(type: T, config: IDbConfig<K>);
    get type(): TDatabaseType;
    getConfig(): Promise<IDbConfig<T>>;
    getDatabase(): Promise<TDatabase<T>>;
    getDb(): Promise<IDatabase>;
    pool(): Promise<IDatabaseFactory<T>>;
    poolConnection(): Promise<TPoolConnection<T>>;
    connect(): Promise<IDatabaseFactory<T>>;
    query<T = any>(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: T[];
    }>;
    transaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
export { TDatabaseType, TMysqlConfig, TMssqlConfig, TOracleConfig, TDbConfig, IDatabase, IDatabaseFactory, MysqlDatabase, OracleDatabase, DatabaseFactory, IDbConfig, DbConfig };
