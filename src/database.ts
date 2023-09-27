require('dotenv').config();
import { install } from 'source-map-support';
install();

import * as process from 'process';
import * as os from 'os';
import {
    IDatabase, IDatabaseFactory, IDbConfig,
    TDatabaseType
} from './index.interface';
import { MysqlDatabase } from './databases/mysql';
import { OracleDatabase } from './databases/oracle';
import { MssqlDatabase } from './databases/mssql';

const {
    ORACLE_LIB_DIR
} = process.env;

class DatabaseFactory implements IDatabaseFactory {
    private static _type: TDatabaseType;
    private static _db?: IDatabase<TDatabaseType>;
    private static _config: IDbConfig<TDatabaseType>;
    private constructor() { }

    static get type() {
        return DatabaseFactory._type;
    }

    static get config() {
        return DatabaseFactory._config;
    }

    static async createDatabase<T extends TDatabaseType, K extends T>(type: T, config: IDbConfig<K>): Promise<IDatabase<T>> {
        try {
            if (DatabaseFactory._db) {
                return <IDatabase<T>> DatabaseFactory._db;
            }
            DatabaseFactory._type = type;
            DatabaseFactory._config = config;

            if (type === 'mysql') {
                DatabaseFactory._db = new MysqlDatabase(<IDbConfig<'mysql'>> config);
            } else if (type === 'oracle') {
                if (ORACLE_LIB_DIR === undefined && os.platform() === 'darwin') {
                    throw new Error('Should setting ORACLE_LIB_DIR env.');
                }
                DatabaseFactory._db = new OracleDatabase(<IDbConfig<'oracle'>> config);
            } else if (type === 'mssql') {
                DatabaseFactory._db = new MssqlDatabase(<IDbConfig<'mssql'>> config);
            } else {
                throw new Error('Unkowns type');
            }

            return <IDatabase<T>> this._db;
        } catch (err) {
            throw err;
        }
    }
}

export {
    MysqlDatabase,
    OracleDatabase,
    DatabaseFactory
}
