import { IDatabase, IDatabaseFactory, IDbConfig, TDatabaseType } from './index.interface';
import { MysqlDatabase } from './databases/mysql';
import { OracleDatabase } from './databases/oracle';
declare class DatabaseFactory implements IDatabaseFactory {
    private static _type;
    private static _db?;
    private static _config;
    private constructor();
    static get type(): TDatabaseType;
    static get config(): IDbConfig<TDatabaseType>;
    static createDatabase<T extends TDatabaseType, K extends T>(type: T, config: IDbConfig<K>): Promise<IDatabase<T>>;
}
export { MysqlDatabase, OracleDatabase, DatabaseFactory };
