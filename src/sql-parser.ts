import { install } from 'source-map-support';
install();

import { TDatabaseType } from './index.interface';
import * as _ from 'lodash';

type TBasicType = number | string | Date | bigint | boolean | Buffer | null | undefined;
enum ECond {
    $eq = '=',
    $lt = '<',
    $gt = '>',
    $lte = '<=',
    $gte = '>='
}

enum EExpr {
    AND = 'AND',
    OR = 'OR'
}

export interface ISqlParser<T> {
    type: T;
    parserSql(
        table: string | { name: string, alias?: string },
        columns: { col: string, showCol?: string }[],
        values: { [column: string]: { v: TBasicType | TBasicType[], cond: keyof typeof ECond } },
        options: { [params: string]: any }
    ): { sql: string, params: any }
}

class SqlParser<T extends TDatabaseType> implements ISqlParser<T> {
    private _type: T;
    constructor(type: T) {
        this._type = type;
    }

    get type() {
        return this._type;
    }

    private _mysqlParseSql(
        table: string | { name: string, alias?: string },
        columns: { col: string, showCol?: string }[],
        values: { [column: string]: { v: TBasicType | TBasicType[], cond: keyof typeof ECond } },
        options: { [params: string]: any }
    ) {
        try {
            if (this._type !== 'mysql') return ;
            const { table: tableName, alias } = typeof table === 'string'
                ? { table: table, alias: table }
                : { table: table.name, alias: table.alias };
            let whereSql = [];
            let params = [];

            for (let column in values) {
                const { v, cond } = values[column];
                whereSql.push(`${alias}.${column} ${ECond[cond]} ?`);
                params.push(v);
            }

            let colSql = _.map(columns, (column) => {
                const { col, showCol = column.col } = column;
                return `${alias}.${col} AS ${showCol}`;
            });
            
            let sql = `
            SELECT
                ${colSql.join(', ')}
            FROM
                ${table} ${alias}
            ${ whereSql.length !== 0 ? `WHERE ${whereSql.join(' AND ')}` : '' }
            `
        } catch (err) {
            throw err;
        }
    }

    private _mssqlParseSql(
        table: string | { name: string, alias?: string },
        columns: { col: string, showCol?: string }[],
        values: { [column: string]: { v: TBasicType | TBasicType[], cond: keyof typeof ECond } },
        options: { [params: string]: any }
    ) {
        try {
            if (this._type !== 'mssql') return ;
        } catch (err) {
            throw err;
        }
    }

    private _oracleParseSql(
        table: string | { name: string, alias?: string },
        columns: { col: string, showCol?: string }[],
        values: { [column: string]: { v: TBasicType | TBasicType[], cond: keyof typeof ECond } },
        options: { [params: string]: any }
    ) {
        try {
            if (this._type !== 'oracle') return ;
        } catch (err) {
            throw err;
        }
    }

    parserSql(
        table: string | { name: string, alias?: string },
        columns: { col: string, showCol?: string }[],
        values: { [column: string]: { v: TBasicType | TBasicType[], cond: keyof typeof ECond } },
        options: { [params: string]: any }
    ): { sql: string; params: any; } {
        try {
            let result;
            result = this._mysqlParseSql(table, columns, values, options);
            result = this._mssqlParseSql(table, columns, values, options);
            result = this._oracleParseSql(table, columns, values, options);
            if (result === undefined) {
                throw new Error(`[${this._type}] Unkowns parser type`);
            }

            return {
                sql: '',
                params: { }
            };
        } catch (err) {
            throw err;
        }
    }
}

export {
    SqlParser
}
