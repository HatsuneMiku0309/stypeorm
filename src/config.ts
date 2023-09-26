import { install } from 'source-map-support';
install();

import { TDatabaseType, TDbConfig, TMssqlConfig, TMysqlConfig, TOracleConfig } from './index.interface';

export interface IDbConfig {
    readonly type: TDatabaseType;
    getConfig<T extends 'mysql'>(): TMysqlConfig
    getConfig<T extends 'mssql'>(): TMssqlConfig
    getConfig<T extends 'oracle'>(): TOracleConfig
    getConfig<T extends TDatabaseType>(): TDbConfig;
}

class DbConfig <T extends TDatabaseType> implements IDbConfig {
    readonly type: T;
    private readonly _config: TDbConfig;
    constructor(type: 'mysql', config: TMysqlConfig);
    constructor(type: 'mssql', config: TMssqlConfig);
    constructor(type: 'oracle', config: TOracleConfig)
    constructor(type: T, config: TDbConfig) {
        this.type = type;
        this._config = config;
    }

    getConfig<T extends 'mysql'>(): TMysqlConfig
    getConfig<T extends 'mssql'>(): TMssqlConfig
    getConfig<T extends 'oracle'>(): TOracleConfig
    getConfig<T extends TDatabaseType>(): TDbConfig {
        return this._config;
    }
}

export {
    DbConfig
}
