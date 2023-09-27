import { install } from 'source-map-support';
install();

import { TDatabaseType, TMssqlConfig, TMysqlConfig, TOracleConfig } from './index.interface';

export interface IDbConfig<T extends TDatabaseType> {
    readonly type: T;
    getConfig(): TConfig<T>;
}

export type TConfig<T extends TDatabaseType> = T extends 'mysql'
    ? TMysqlConfig
    : T extends 'mssql'
    ? TMssqlConfig
    : T extends 'oracle'
    ? TOracleConfig
    : never;

class DbConfig <T extends TDatabaseType> implements IDbConfig<T> {
    readonly type: T;
    private readonly _config: TConfig<T>;
    constructor(type: T, config: TConfig<T>) {
        this.type = type;
        this._config = config;
    }

    getConfig(): TConfig<T> {
        return <TConfig<T>> this._config;
    }
}

export {
    DbConfig
}
