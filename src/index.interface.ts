import { PoolOptions as mysqlPoolOptions, ConnectionOptions as mysqlConnectionOptions } from 'mysql2';
import { config as mssqlConfig } from 'mssql';
import { PoolAttributes as oraclePoolAttributes, ConnectionAttributes as oracleConnectionAttributes } from 'oracledb';

export type TDatabaseType = 'oracle' | 'mysql' | 'mssql';

export type TMysqlConfig = mysqlPoolOptions | mysqlConnectionOptions;
export type TMssqlConfig = mssqlConfig;
export type TOracleConfig = oraclePoolAttributes | oracleConnectionAttributes;
export type TDbConfig = TMysqlConfig | TMssqlConfig | TOracleConfig;