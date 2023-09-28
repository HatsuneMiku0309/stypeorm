import { install } from 'source-map-support';
install();

import { IBaseObj, TDatabaseType } from './index.interface';
import * as _ from 'lodash';

type TBasicType = number | string | Date | bigint | boolean | Buffer | null;
type TOptionsExpr<T = TBasicType> = T | T[] | (Partial<{ [expr in keyof typeof EExpr]: TExprValue<expr> }>);
interface IBaseWhere<T = TOptionsExpr<TBasicType>> extends IBaseObj<T> { }
type TExtWhere = Partial<{ [cond in keyof typeof ECond]: ((IBaseWhere | TExtWhere) | (IBaseWhere | TExtWhere)[])[] }>;
type TMixWhere = (IBaseWhere | TExtWhere);
type TWhere = TMixWhere | TMixWhere[];
type TOrder = 'asc' | 'desc' | 'ASC' | 'DESC' | 1 | -1 | '1' | '-1';
interface IOrderType<T = TOrder> extends IBaseObj<T[]> { };

interface IQuery {
    select: string[];
    where?: TWhere;
    skip?: number;
    take?: number;
    order?: IOrderType;
    group?: string[];
}

// let qaq: IQuery = {
//     select: ['*'],
//     where: [{
//         '$and': [
//             { qaq: 123 }, { aqa: { '$eq': 123 } },
//             { '$and': [
//                 { qqq: 123 },
//                 [{ sadf: 123, dsanfdkl: "!23" }],
//                 [{ sadf: 123, dsanfdkl: "!23" }, { $and: [{ sadf: 123 }] }],
//                 { nklwqer: 32123, $and: [{ wbeqr: 654 }] },
//                 { '$or': [
//                     [{ aa: 123 }, { bb: 321 }],
//                     [{ $and: [{ asd: 123 }] }],
//                     { $or: [{ dsafd: 123 }] },
//                     { test: 123, ge: 'asdf', sadf: { $gt: 123 }, $and: [{ sadf: { $in: ['asdf', 'cxvasdf'] } }] },
//                     { asdf: '123' }]
//                 }, [{ '$or': [
//                     [{ aa: 123 }, { bb: 321 }],
//                     [{ $and: [{ asd: 123 }] }],
//                     { $or: [{ dsafd: 123 }] },
//                     { test: 123, ge: 'asdf', sadf: { $gt: 123 }, $and: [{ sadf: { $in: ['asdf', 'cxvasdf'] } }] },
//                     { asdf: '123' }]
//                 }]
//             ]}] 
//     }, {
//         asdfnkl: 123, $and: [{ sadf: 123 }]
//     }]
// }
enum ECond {
    $and = 'AND',
    $or = 'OR'
}

type TExprValue<T extends keyof typeof EExpr> = T extends '$between' | '$notBetween' | '$in' | '$notIn'
    ? TBasicType[]
    : T extends '$is' | '$isNot'
    ? null
    : TBasicType;
enum EExpr {
    // common oper
    $eq= '=', $ne= '!=',
    $gt= '>', $gte= '>=',
    $lt= '<', $lte= '<=',

    // extends oper
    $is= 'IS', $not= 'NOT', $isNot= 'IS NOT',
    $in= 'IN', $notIn= 'NOT IN',
    $like= 'LIKE', $notLike= 'NOT LIKE',
    $iLike= 'ILIKE', $notILike= 'NOT ILIKE',
    $between= 'BETWEEN', $notBetween= 'NOT BETWEEN',
    $regexp= '~', $notRegexp= '!~',
    $iRegexp= '~*', $notIRegexp= '!~*'
}

export interface IQueryBuilder<T> {
    type: T;
    /**
     * use by debug, don't use to query
     */
    toSql(): string;
    toQuery(): { sql: string, params: any };
}

class QueryBuilder<T extends TDatabaseType> implements IQueryBuilder<T> {
    private _type: T;
    private _query: IQuery;
    private _sql: string = '';
    private _params: any;
    constructor(type: T, query: IQuery) {
        this._type = type;
        this._query = query;
        this._built();
    }

    get type() {
        return this._type;
    }

    /**
     * use by debug, don't use to query
     * @returns 
     */
    toSql(): string {
        try {
            return this._sql;
        } catch (err) {
            throw err;
        }
    }

    toQuery(): { sql: string; params: any; } {
        try {
            return {
                sql: this._sql,
                params: this._params
            };
        } catch (err) {
            throw err;
        }
    }

    private _built(
        options?: { prefix?: string, suffix?: string }
    ) {
        try {
            try {
                this._builtQuery();
            } catch (err) {
                throw err;
            }
        } catch (err) {
            throw err;
        }
    }

    private _builtQuery(): any;
    private _builtQuery(options: { prefix?: string, suffix?: string }): any;
    private _builtQuery(options?: { prefix?: string, suffix?: string }): any {
        try {
            let where = this._parseQueryStringWhere(this._query.where, options);
            console.log(where);
        } catch (err) {
            throw err;
        }
    }

    private _parseQueryStringWhere(
        where: TWhere | undefined,
        options?: {
            prefix?: string, suffix?: string
        }
    ) {
        try {
            let _where;
            if (where) {
                if (_.isArray(where)) {
                    _where = _.reduce(where, (_r, data, index) => {
                        _r.push(this._parseQueryStringWhereOper(data, options));

                        return _r;
                    }, <any[]> []);
                } else if (_.isObject(where)) {
                    _where  = this._parseQueryStringWhereOper(where, options);
                } else {
                    throw new Error('[PARAM:ERROR] Unknown WHERE format');
                }
            }

            return _where;
        } catch (err) {
            throw err;
        }
    }

    private _parseQueryStringWhereOper(
        where: TWhere,
        options: { prefix?: string, suffix?: string } = { }
    ) {
        try {
            const { prefix = '%', suffix = '%' } = options;
            let _where: { [key: string]: any } = { };
            let _arrWhere: { [key: string]: any }[] = [];
            if (_.isArray(where)) {
                _.forEach(where, (datas, index) => {
                    if (_.isObject(datas) || _.isArray(datas)) {
                        _arrWhere.push(this._parseQueryStringWhereOper(
                            datas, options
                        ));
                    } else {
                        throw new Error('[PARAM:ERROR] Error WHERE format');
                    }
                });
            } else if (_.isObject(where)) {
                _.forEach(where, (data, key) => {
                    if (_.isObject(data)) {
                        _.forEach(data, (d, oper) => {
                            if (['$like', '$notLike', '$iLike', '$notILike'].includes(oper)) {
                                _where[key] = { [oper]: `${prefix}${d}${suffix}` };
                            } else if (['$and', '$or'].includes(key)) {
                                _where[key] = _where[key] || [];
                                _where[key].push(this._parseQueryStringWhereOper(d, options));
                            } else {
                                _where[key] = data;
                            }
                        });
                    } else {
                        _where[key] = data;
                    }
                });
            } else {
                throw new Error('[PARAM:ERROR] Error WHERE format');
            }

            return  _arrWhere.length !== 0 ? _arrWhere : _where;
        } catch (err) {
            throw err;
        }
    }

    // private _mysqlParseSql(
    //     table: string | { name: string, alias?: string },
    //     columns: { col: string, showCol?: string }[],
    //     values: IValue[],
    //     options: { [params: string]: any }
    // ) {
    //     try {
    //         if (this._type !== 'mysql') return ;
    //         const { table: tableName, alias } = typeof table === 'string'
    //             ? { table: table, alias: table }
    //             : { table: table.name, alias: table.alias };
    //         let whereSql = [];
    //         let params = [];
    //         _.forEach(values, (val, index) => {

    //         })

    //         // for (let column in values) {
    //         //     const val = values[column];
    //         //     if (Array.isArray(v)) {

    //         //     } else if (Object.prototype.toString.call(v) === 'object') {
    //         //         whereSql.push(`${alias}.${column} = ?`);
    //         //     } else {
    //         //         whereSql.push(`${alias}.${column} = ?`);
    //         //     }
    //         //     params.push(v);
    //         // }

    //         let colSql = _.map(columns, (column) => {
    //             const { col, showCol = column.col } = column;
    //             return `${alias}.${col} AS ${showCol}`;
    //         });
            
    //         let sql = `
    //         SELECT
    //             ${colSql.join(', ')}
    //         FROM
    //             ${table} ${alias}
    //         ${ whereSql.length !== 0 ? `WHERE ${whereSql.join(' AND ')}` : '' }
    //         `
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // private _mssqlParseSql(
    //     table: string | { name: string, alias?: string },
    //     columns: { col: string, showCol?: string }[],
    //     values: IValue[],
    //     options: { [params: string]: any }
    // ) {
    //     try {
    //         if (this._type !== 'mssql') return ;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // private _oracleParseSql(
    //     table: string | { name: string, alias?: string },
    //     columns: { col: string, showCol?: string }[],
    //     values: IValue[],
    //     options: { [params: string]: any }
    // ) {
    //     try {
    //         if (this._type !== 'oracle') return ;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // parserSql(
    //     table: string | { name: string, alias?: string },
    //     columns: { col: string, showCol?: string }[],
    //     values: IValue[],
    //     options: { [params: string]: any }
    // ): { sql: string; params: any; } {
    //     try {
    //         let result;
    //         result = this._mysqlParseSql(table, columns, values, options);
    //         result = this._mssqlParseSql(table, columns, values, options);
    //         result = this._oracleParseSql(table, columns, values, options);
    //         if (result === undefined) {
    //             throw new Error(`[${this._type}] Unkowns parser type`);
    //         }

    //         return {
    //             sql: '',
    //             params: { }
    //         };
    //     } catch (err) {
    //         throw err;
    //     }
    // }
}

export {
    QueryBuilder
}
