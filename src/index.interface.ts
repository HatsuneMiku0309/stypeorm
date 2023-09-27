import { PoolOptions as mysqlPoolOptions, ConnectionOptions as mysqlConnectionOptions } from 'mysql2';
import { config as mssqlConfig } from 'mssql';
import { PoolAttributes as oraclePoolAttributes, ConnectionAttributes as oracleConnectionAttributes } from 'oracledb';
import oracledb = require('oracledb');
import * as mysql from 'mysql2/promise';
import * as mssql from 'mssql';

export type TDatabaseType = 'oracle' | 'mysql' | 'mssql';
export type TMysqlConfig = mysqlPoolOptions | mysqlConnectionOptions;
export type TMssqlConfig = mssqlConfig;
export type TOracleConfig = oraclePoolAttributes | oracleConnectionAttributes;
export type TDbConfig = TMysqlConfig | TMssqlConfig | TOracleConfig;
export type TConfig<T extends TDatabaseType> = T extends 'mysql'
    ? TMysqlConfig
    : T extends 'mssql'
    ? TMssqlConfig
    : T extends 'oracle'
    ? TOracleConfig
    : never;

export interface IDbConfig<T extends TDatabaseType> {
    readonly type: T;
    getConfig(): TConfig<T>;
}

export interface IDatabase<T extends TDatabaseType> {
    type: T;
    getConfig(): Promise<IDbConfig<T>>;
    getDatabase(): Promise<typeof mysql | typeof mssql | typeof oracledb>;
    getDb(): Promise<TConnection<T>>;
    pool(): Promise<IDatabase<T>>;
    poolConnection(): Promise<TPoolConnection<T>>;
    connect(): Promise<IDatabase<T>>;
    query<R = any>(sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: R[] }>;
    query<R = any>(db: TPoolConnection<T>, sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: R[] }>;
    transaction(db: TPoolConnection<T>): Promise<TTransactionReturn<T>>;
    transaction(): Promise<TTransactionReturn<T>>;
    commit(db: TPoolConnection<T>): Promise<void>;
    commit(): Promise<void>;
    rollback(db: TPoolConnection<T>): Promise<void>;
    rollback(): Promise<void>;
    end(db: TPoolConnection<T>): Promise<number>;
    end(): Promise<number>;
};

export interface IDatabaseFactory { };

export type TTransactionReturn<T> = T extends 'mysql' | 'oracle'
    ? void
    : T extends 'mssql'
    ? mssql.Transaction
    : never;

export type TPoolConnection<T extends TDatabaseType> = T extends 'mysql'
    ? mysql.PoolConnection
    : T extends 'mssql'
    ? mssql.ConnectionPool & mssql.Transaction
    : T extends 'oracle'
    ? oracledb.Connection
    : never;

export type TConnection<T extends TDatabaseType> = T extends 'mysql'
    ? mysql.Connection
    : T extends 'mssql'
    ? mssql.ConnectionPool & mssql.Transaction
    : T extends 'oracle'
    ? oracledb.Connection
    : never;