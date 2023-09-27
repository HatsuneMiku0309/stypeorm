import { install } from 'source-map-support';
install();

import * as mysql from 'mysql2/promise';
import { IDatabase, IDbConfig, TConnection, TPoolConnection, TTransactionReturn } from '../index.interface';
import { PlatformTools } from '../platform';

export class MysqlDatabase<T extends 'mysql'> implements IDatabase<T> {
    private _type: T = <T> 'mysql';
    private _database!: typeof mysql;
    private _pool?: mysql.Pool;
    private _db?: mysql.Connection;
    private _config: IDbConfig<T>;
    constructor(config: IDbConfig<T>) {
        this._config = config;
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<IDbConfig<T>> {
        return this._config;
    }

    async getDatabase(): Promise<typeof mysql> {
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
            if (!!this._pool) {
                return this;
            }

            if (this._database) {
                this._pool = this._database.createPool(this._config.getConfig());
            } else {
                let database = await this._init();
                this._pool = database.createPool(this._config.getConfig());
            }

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

            let db = await this._pool?.getConnection();
            

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
            this._db = await database.createConnection(this._config.getConfig());

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
                let db = await this.getDb();
                let [rows] = <[R[], mysql.FieldPacket[]]> await db.query(sql, values);

                return {
                    rows
                };
            } else {
                const db = arg1;
                const sql = arg2;
                const values = arg3 || [];
                let [rows] = <[R[], mysql.FieldPacket[]]> await db.query(sql, values);

                return {
                    rows
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
                await db.beginTransaction();
            } else {
                if (!this._db) {
                    throw new Error('Need connection');
                }
                await this._db.beginTransaction();
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
            }
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number>;
    async end(db?: TPoolConnection<T>): Promise<number> {
        try {
            if (db) {
                await db.end();

                return 1;
            } else {
                if (this._db) {
                    await this._db.end();
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
