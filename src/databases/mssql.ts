import { install } from 'source-map-support';
install();

import * as mssql from 'mssql';
import { IDatabase, IDbConfig, TConnection, TPoolConnection, TTransactionReturn } from '../index.interface';
import { PlatformTools } from '../platform';

export class MssqlDatabase<T extends 'mssql'> implements IDatabase<T> {
    private _type: T = <T> 'mssql';
    private _database!: typeof mssql;
    private _pool!: mssql.ConnectionPool;
    private _db?: mssql.ConnectionPool;
    private _tx?: mssql.Transaction;
    private _config: IDbConfig<T>
    constructor(config: IDbConfig<T>) {
        this._config= config;
    }

    get type() {
        return this._type;
    }

    async getConfig(): Promise<IDbConfig<T>> {
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
    async getDb(): Promise<TConnection<T>> {
        try {
            if (!this._db) {
                throw new Error('No connection');
            }

            if (this._tx) {
                return <TConnection<T>> this._tx;
            }

            return <TConnection<T>> this._db;
        } catch (err) {
            throw err;
        }
    }

    async pool(): Promise<IDatabase<T>> {
        try {
            if (!this._pool) {
                let database = await this._init();
                this._pool = new database.ConnectionPool(this._config.getConfig());
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

            let db = await this._pool.connect();

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
            let pool = new database.ConnectionPool({
                ...this._config.getConfig(),
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
                const values = arg2 || { };
                let db = await this.getDb();
                let request = new this._database.Request(db);
                for (let column in values) {
                    request.input(column, values[column]);
                }
                let { recordset: rows } = await request.query<R>(sql);

                return {
                    rows
                };
            } else {
                const db = arg1;
                const sql = arg2;
                const values = arg3 || { };
                let request = new this._database.Request(db);
                for (let column in values) {
                    request.input(column, values[column]);
                }
                let { recordset: rows } = await request.query<R>(sql);

                return {
                    rows
                };
            }
        } catch (err) {
            throw err;
        }
    }
    
    /**
     * 
     * @param db 
     */
    async transaction(): Promise<TTransactionReturn<T>>
    async transaction(db?: TPoolConnection<T>): Promise<TTransactionReturn<T>> {
        try {
            if (db) {
                let transaction = new this._database.Transaction(db);
                await transaction.begin();

                return <TTransactionReturn<T>> transaction;
            } else {
                if (this._tx) {
                    return <TTransactionReturn<T>> this._tx;
                }
                if (!this._db) {
                    throw new Error('Need connection');
                }

                let transaction = new this._database.Transaction(this._db);
                await transaction.begin();
                this._tx = transaction;

                return <TTransactionReturn<T>> this._tx;
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
                if (this._tx) {
                    await this._tx.commit();
                    this._tx = undefined;
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
                if (this._tx) {
                    await this._tx.rollback();
                    this._tx = undefined;
                }
            }
        } catch (err) {
            throw err;
        }
    }

    async end(): Promise<number>
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
