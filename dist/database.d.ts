declare type TDatabaseType = 'oracle' | 'mysql' | 'mssql';
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
export declare enum ISOLATION_LEVEL {
    NO_CHANGE = 0,
    READ_UNCOMMITTED = 1,
    READ_COMMITTED = 2,
    REPEATABLE_READ = 3,
    SERIALIZABLE = 4,
    SNAPSHOT = 5
}
interface IMssqlConnectionOptions {
    driver?: string;
    user?: string;
    password?: string;
    host?: string;
    server?: string;
    port?: number;
    database?: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    pool?: {
        min?: number;
        max?: number;
        acquireTimeoutMillis?: number;
        createTimeoutMillis?: number;
        destroyTimeoutMillis?: number;
        idleTimeoutMillis?: number;
        createRetryIntervalMillis?: number;
        reapIntervalMillis?: number;
    };
    arrayRowMode?: boolean;
    options?: {
        beforeConnect?: void;
        connectionString?: string;
        trustedConnection?: boolean;
        port?: number;
        instanceName?: string;
        database?: string;
        connectTimeout?: number;
        requestTimeout?: number;
        cancelTimeout?: number;
        useUTC?: boolean;
        useColumnNames?: boolean;
        camelCaseColumns?: boolean;
        debug?: {
            packet?: boolean;
            data?: boolean;
            payload?: boolean;
            token?: boolean;
        };
        isolationLevel?: ISOLATION_LEVEL;
        connectionIsolationLevel?: ISOLATION_LEVEL;
        readOnlyIntent?: boolean;
        encrypt?: boolean;
        rowCollectionOnDone?: boolean;
        tdsVersion?: number;
        appName?: string;
        connectionRetryInterval?: number;
        datefirst?: number;
        dateFormat?: string;
        language?: string;
        textsize?: number;
        trustServerCertificate?: boolean;
    };
}
interface IDbConfig extends IMysqlConnectionOptions, IOracleConnectionOptions, IMssqlConnectionOptions {
}
interface IDatabase {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDatabase<T = any>(): Promise<T>;
    getDb<T = any>(): Promise<T>;
    connect(): Promise<void>;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
interface IDatabaseFactory {
    type: TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDatabase<T = any>(): Promise<T>;
    getDb(): Promise<IDatabase>;
    connect(): Promise<void>;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    transaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
declare class MysqlDatabase implements IDatabase {
    private _type;
    private _database;
    private _db?;
    private _config;
    constructor(config: IMysqlConnectionOptions);
    get type(): "mysql";
    getConfig(): Promise<IDbConfig>;
    getDatabase<T = any>(): Promise<T>;
    getDb<T = any>(): Promise<T>;
    connect(): Promise<void>;
    private _init;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
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
    getConfig(): Promise<IDbConfig>;
    getDatabase<T = any>(): Promise<T>;
    getDb<T = any>(): Promise<T>;
    connect(): Promise<void>;
    private _init;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    transaction<T>(db: T): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
declare class DatabaseFactory implements IDatabaseFactory {
    private _db;
    private _config;
    constructor(type: TDatabaseType, config: IDbConfig);
    get type(): TDatabaseType;
    getConfig(): Promise<IDbConfig>;
    getDatabase<T = any>(): Promise<T>;
    getDb(): Promise<IDatabase>;
    connect(): Promise<void>;
    query(sql: string, values?: any, options?: {
        [params: string]: any;
    }): Promise<{
        rows: any[];
    }>;
    transaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    end(): Promise<number>;
}
export { TDatabaseType, IDbConfig, IDatabase, IDatabaseFactory, MysqlDatabase, OracleDatabase, DatabaseFactory };
