declare type TDatabaseType = 'oracle' | 'mysql';
interface IMysqlConnectionOptions {
    user?: string;
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
    rowsAsArray?: boolean;
}
interface IOracleConnectionOptions {
    connectString?: string;
    connectionString?: string;
    password?: string;
    user?: string;
}
interface IDbConfig extends IMysqlConnectionOptions, IOracleConnectionOptions {
}
interface IDatabase {
    type: TDatabaseType;
    getDb<T = any>(): Promise<T>;
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
    constructor(config: IMysqlConnectionOptions);
    get type(): "mysql";
    getDb<T = any>(): Promise<T>;
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
    constructor(config: IOracleConnectionOptions, outFormat?: number);
    get type(): "oracle";
    getDb<T = any>(): Promise<T>;
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
    getDb<T = any>(): Promise<T>;
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
    getDb<T>(): Promise<T>;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    end(): Promise<number>;
}
export { TDatabaseType, IDbConfig, IDatabase, IDatabaseFactory, MysqlDatabase, OracleDatabase, DatabaseFactory };
