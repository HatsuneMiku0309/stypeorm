import { install } from 'source-map-support';
install();

import { IDbConfig, TConfig, TDatabaseType } from './index.interface';

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
