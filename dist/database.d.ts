import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
declare type TDatabaseType = 'oracle' | 'mysql';
declare type TConnectionDb = oracledb.Connection | mysql.Connection;
interface IDbConfig extends oracledb.ConnectionAttributes, mysql.ConnectionOptions {
}
interface IDatabase {
    type: TDatabaseType;
    getDb(): Promise<TConnectionDb>;
    query(sql: string, values: any, options: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
declare class MysqlDatabase implements IDatabase {
    private _type;
    private _db?;
    private _config;
    constructor(config: mysql.ConnectionOptions);
    get type(): "mysql";
    getDb(): Promise<mysql.Connection>;
    private _init;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
declare class OracleDatabase implements IDatabase {
    private _type;
    private _db?;
    private _config;
    private _outFormat;
    /**
     * outFormat:
     *
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */
    constructor(config: oracledb.ConnectionAttributes, outFormat?: number);
    get type(): "oracle";
    getDb(): Promise<oracledb.Connection>;
    private _init;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
interface IDatabaseFactory {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDb(): Promise<TConnectionDb>;
    query(sql: string, values: any, options: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
declare class DatabaseFactory implements IDatabaseFactory {
    private _db;
    private _config;
    constructor(type: TDatabaseType, config: IDbConfig);
    get type(): TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDb<T extends 'mysql'>(): Promise<mysql.Connection>;
    getDb<T extends 'oracle'>(): Promise<oracledb.Connection>;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
export { TDatabaseType, TConnectionDb, IDbConfig, IDatabase, IDatabaseFactory, MysqlDatabase, OracleDatabase, DatabaseFactory };
