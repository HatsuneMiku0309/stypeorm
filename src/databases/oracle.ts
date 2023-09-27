import { install } from 'source-map-support';
install();

import oracledb = require('oracledb');
import { IDatabase, IDbConfig, TConnection, TPoolConnection, TTransactionReturn } from '../index.interface';
import { PlatformTools } from '../platform';
import * as os from 'os';

const {
    ORACLE_LIB_DIR
} = process.env;

export class OracleDatabase <T extends 'oracle'> implements IDatabase<T> {
    private _type: T = <T> 'oracle';
    private _database!: typeof oracledb;
    private _db?: oracledb.Connection;
    private _pool?: oracledb.Pool;
    private _config: IDbConfig<T>;
    private _outFormat: number;
    /**
     * outFormat:
     *  
     *  OUT_FORMAT_ARRAY: 4001,
     *  OUT_FORMAT_OBJECT: 4002
     */ 

    constructor(config: IDbConfig<T>, outFormat: number = 4002) {
        this._config = config;
        this._outFormat = outFormat
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<IDbConfig<T>> {
        return this._config;
    }

    async getDatabase(): Promise<typeof oracledb> {
        try {
            return this._database;
        } catch (err) {
            throw err;
        }
    }

    async getDb(): Promise<TConnection<T>> {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }

            return <TConnection<T>> this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabase<T>> {
        try {
            if (this._pool) {
                return this;
            }

            let database = await this._init();
            this._pool = await database.createPool(this._config.getConfig());

            return this;
        } catch (err) {
            throw err;
        }
    }

    async poolConnection(): Promise<TPoolConnection<T>> {
        try {
            if (!this._pool) {
                throw new Error('Need Create Pool');
            }

            let db = await this._pool.getConnection();

            return <TPoolConnection<T>> db;
        } catch (err) {
            throw err;
        }
    }

    async connect(): Promise<IDatabase<T>> {
        try {
            if (!!this._db) {
                return this;
            }

            let database = await this._init();
            this._db = await database.getConnection(this._config.getConfig());

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
    query<R = any>(sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: R[] }>;
    query<R = any>(db: TPoolConnection<T>, sql: string, values?: any, options?: { [params: string]: any }): Promise<{ rows: R[] }>;
    async query<R = any>(
        arg1: TPoolConnection<T> | string,
        arg2?: string | any,
        arg3?: any | { [params: string]: any },
        arg4?: { [params: string]: any } 
    ): Promise<{ rows: R[] }> {
        try {
            if (typeof arg1 === 'string') {
                const sql = arg1;
                const values = arg2 || [];
                const options = arg3 || { };
                let db = await this.getDb();
                let result = await db.execute<R>(sql, values, options);
                let rows = result.rows || [];

                return {
                    rows: rows
                };
            } else {
                const db = arg1;
                const sql = arg2;
                const values = arg3 || [];
                const options = arg4 || { };
                let result = await db.execute<R>(sql, values, options);
                let rows = result.rows || [];

                return {
                    rows: rows
                };
            }
            
        } catch (err) {
            throw err;
        }
    }

    async transaction(): Promise<TTransactionReturn<T>>;
    async transaction(db?: TPoolConnection<T>): Promise<void> {
        try {
            if (db) {
                await this.query(db, 'BEGIN');
            } else {
                if (!this._database) {
                    throw new Error('Need connection');
                }
                if (this._db) {
                    await this.query('BEGIN');
                }
                // this._database.autoCommit = false;
            }
        } catch (err) {
            throw err;
        }
    }

    async commit(): Promise<void>;
    async commit(db?: TPoolConnection<T>): Promise<void> {
        try {
            if (db) {
                await db.commit();
            } else {
                if (this._db) {
                    await this._db.commit();
                }
                // this._database.autoCommit = true;
            }
        } catch (err) {
            throw err;
        }
    }

    async rollback(): Promise<void>;
    async rollback(db?: TPoolConnection<T>): Promise<void> {
        try {
            if (db) {
                await db.rollback();
            } else {
                if (this._db) {
                    await this._db.rollback();
                }

                // this._database.autoCommit = true;
            }
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number>;
    async end(db?: TPoolConnection<T>): Promise<number> {
        try {
            if (db) {
                await db.close();

                return 1;
            } else {
                if (this._db) {
                    await this._db.close();
                    this._db = undefined;

                    return 1;
                }

                return 0;
            }
        } catch (err) {
            throw err;
        }
    }
}
