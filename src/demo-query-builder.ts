import { install } from 'source-map-support';
install();

import { Config } from '../config';
import * as Typeorm from 'typeorm';
import * as _ from 'lodash';
import * as Joi from '@hapi/joi';

// anyway write user data when insert or update in database
// as for whether it is really insert or update, it is set by the typeorm parameter
export interface IModelBase {
    readonly createdAt?: Date;
    readonly createdUserId?: string;
    readonly updatedAt?: Date;
    readonly updatedUserId?: string;
}

export interface IExtJoin<T> {
    type: 'left' | 'inner';
    alias?: string;
    joinWhere?: Typeorm.FindConditions<T>[] | Typeorm.FindConditions<T> | Typeorm.ObjectLiteral;
}


// interface A {
//     x: string
// }

// interface B extends Omit<A, 'x'> {
//   x: number
// }
export interface IQueryString<T, T2 = any> extends Typeorm.FindManyOptions<T> {
    // <type><join / joinMapOne / joinMapMany>
    extJoin?: T2;
    group?: (keyof T)[] | string[];
}

export abstract class ModelBase {
    createdUserId!: string;
    updatedUserId!: string;
}

interface IOperatorsAliasesString {
    $eq: '='; $ne: '!=';
    $gt: '>'; $gte: '>=';
    $lt: '<'; $lte: '<=';

    $is: 'IS'; $not: 'NOT'; $notIs: 'IS NOT';
    $in: 'IN'; $notIn: 'NOT IN';
    $like: 'LIKE'; $notLike: 'NOT LIKE';
    $iLike: 'ILIKE'; $notILike: 'NOT ILIKE';
    $between: 'BETWEEN'; $notBetween: 'NOT BETWEEN';
    $regexp: '~'; $notRegexp: '!~';
    $iRegexp: '~*'; $notIRegexp: '!~*';
    $and: 'AND'; $or: 'OR';
    // $any: 'ANY'; $all: 'ALL'; $values: 'VALUES';

    $col: '='; $notCol: '!=';
    $gtCol: '>'; $gteCol: '>=';
    $ltCol: '<'; $lteCol: '<=';

    // $overlap: '&&'; $contains: '@>'; $contained: '<@';
    // $adjacent: '-|-'; $strictLeft: '<<'; $strictRight: '>>';
    // $noExtendRight: '&<'; $noExtendLeft: '&>';
}

const operatorsAliasesString = {
    // common oper
    $eq: '=', $ne: '!=',
    $gt: '>', $gte: '>=',
    $lt: '<', $lte: '<=',

    // extends oper
    $is: 'IS', $not: 'NOT', $notIs: 'IS NOT',
    $in: 'IN', $notIn: 'NOT IN',
    $like: 'LIKE', $notLike: 'NOT LIKE',
    $iLike: 'ILIKE', $notILike: 'NOT ILIKE',
    $between: 'BETWEEN', $notBetween: 'NOT BETWEEN',
    $regexp: '~', $notRegexp: '!~',
    $iRegexp: '~*', $notIRegexp: '!~*',
    $and: 'AND', $or: 'OR',
    // $any: 'ANY', $all: 'ALL', $values: 'VALUES',

    // col oper
    $col: '=', $notCol: '!=',
    $gtCol: '>', $gteCol: '>=',
    $ltCol: '<', $lteCol: '<='

    // over extends oper (很特別的操作子，幾乎都是PG的，所以應該不開放。)
    // $overlap: '&&', $contains: '@>', $contained: '<@',
    // $adjacent: '-|-', $strictLeft: '<<', $strictRight: '>>',
    // $noExtendRight: '&<', $noExtendLeft: '&>'
};


export const findQueryWhereOper$And$Or = (joiLazyObject: Joi.LazySchema) => {
    return {
        $and: Joi.array().items(joiLazyObject).description('$and recursive'),
        $or: Joi.array().items(joiLazyObject).description('$or recursive')
    };
};

export const findQueryWhereOperBase = {
    $eq: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $ne: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $gt: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $gte: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $lt: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $lte: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $is: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $notIs: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()),
    $in: Joi.array().items(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()).min(1),
    $notIn: Joi.array().items(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()).min(1),
    $like: Joi.string(),
    $notLike: Joi.string(),
    $iLike: Joi.string(),
    $notILike: Joi.string(),
    $between: Joi.array().items(Joi.string(), Joi.number(), Joi.date()).length(2),
    $notBetween: Joi.array().items(Joi.string(), Joi.number(), Joi.date()).length(2),
    $regexp: Joi.string(),
    $notRegexp: Joi.string(),
    $iRegexp: Joi.string(),
    $notIRegexp: Joi.string(),
    $col: Joi.string(),
    $notCol: Joi.string(),
    $gtCol: Joi.string(),
    $gteCol: Joi.string(),
    $ltCol: Joi.string(),
    $lteCol: Joi.string()
};

/**
 * 因為避免單例影響，每個query就build一個，而不放在Db class內了。
 */
export class QueryBuildParse<T, T2 = any> {
    query: { [key: string]: any } = { };
    /**
     * query build where sql string
     */
    whereSqlString: string[] = [];
    /**
     * query build join where sql string
     */
    joinWhereSqlString: { [PP in keyof T2]: string[] } = <{ [PP in keyof T2]: string[] }> { };
    /**
     * query build where sql params
     */
    whereSqlParams: { [key: string]: any } = { };
    /**
     * query build join where sql params
     */
    joinWhereSqlParams: {
        [PP in keyof T2]: { [key: string]: any }
    } = <{ [PP in keyof T2]: { [key: string]: any } }> { };
    /**
     * PG only:
     * 1. $iLike
     * 2. $iRegexp
     * 3. $notILike
     * 4. $iLike
     * 5. $overlap: [1, 2] => $$ [1, 2)
     * 6. $contains: [1, 2] => @> [1, 2)
     * 7. $contained: [1, 2] => <@ [1, 2)
     * 8. $adjacent: [1, 2] => -|- [1, 2)
     * 9. $strictLeft: [1, 2] => << [1, 2)
     * 10. $strictRight: [1, 2] => >> [1, 2)
     * 11. $noExtendRight: [1, 2] => &< [1, 2)
     * 12. $noExtendLeft: [1, 2] => &> [1, 2)
     * 13. $any: [2, 3] => ANY ARRAY[2, 3]::INTERGER / $any ['2', '3'] => ANY ARRAY['2', '3']::TEXT (基本上不使用這個)
     * 
     * commend:`
     * 1. $gt: { $all: 'SELECT 1' } => ALL (SELECT 1) (不知道這啥東西，基本上不使用)
     * 2. $values: [4, 5, 6] => VALUES (4), (5), (6)
     * 3. $col: 'table.col' => "table"."col" (此需要小心使用，會被inject)
     */
    readonly operatorsAliasesString = operatorsAliasesString;
    private _extJoinAlias: string[] = [];
    private _builder: Typeorm.SelectQueryBuilder<T>;
    private _runner?: Typeorm.QueryRunner;
    private _reCol = /["-']/g;
    private _resource?: {
        conn: Typeorm.Connection,
        mainModel: any,
        otherModel?: any[]
    };
    // private _options: { prefix?: string, suffix?: string, runner?: Typeorm.QueryRunner };
    constructor(
        builder: Typeorm.SelectQueryBuilder<T>,
        query?: IQueryString<T, T2>,
        options: {
            prefix?: string, suffix?: string, runner?: Typeorm.QueryRunner
            resource?: {
                conn: Typeorm.Connection, mainModel: any, otherModel?: any[]
            }
        } = { }
    ) {
        this._builder = builder;
        this.query = query || { };
        this._runner = options.runner;
        this._resource = options.resource;
        // this._options = options;

        // transaction setting
        if (this._runner !== undefined) {
            this._builder.setQueryRunner(this._runner);
        }

        this._built(options);
    }

    getBuilder() {
        return this._builder;
    }

    get builder() {
        return this._builder;
    }

    /**
     * init built
     * @param options 
     */
    private _built(
        options: { prefix?: string, suffix?: string }
    ) {
        try {
            this._builtQuery(options);
        } catch (err) {
            throw err;
        }
    }

    private _parseQueryStringWhere(where: { [key: string]: any } | { [key: string]: any }[]): void;
    private _parseQueryStringWhere(
        where: { [key: string]: any } | { [key: string]: any }[],
        options: { prefix?: string, suffix?: string }
    ): void;
    /**
     * like oper value prefix/suffix '%'
     * 
     * @param options 調控前/後綴
     */
    private _parseQueryStringWhere(
        where: { [key: string]: any } | { [key: string]: any }[],
        options: { prefix?: string, suffix?: string } = { }
    ): void {
        try {
            let _where: any;
            if (where) {
                // array 屬於 object, 所以放在第一個條件上（不允許變換順序）
                if (_.isArray(where)) {
                    _where = _.reduce(where, (__where: { [key: string]: any }[], data, index) => {
                        __where.push(this._parseQueryStringWhereOper(data, options));

                        return __where;
                    }, [ ]);
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

    private _parseQueryStringWhereOper(where: { [key: string]: any }): { [key: string]: any };
    private _parseQueryStringWhereOper(
        where: { [key: string]: any },
        options: { prefix?: string, suffix?: string }
    ): { [key: string]: any };
    private _parseQueryStringWhereOper(where: { [key: string]: any }[]): { [key: string]: any }[];
    private _parseQueryStringWhereOper(
        where: { [key: string]: any }[],
        options: { prefix?: string, suffix?: string }
    ): { [key: string]: any }[];
    /**
     * append pre/suffix
     * @param where 
     * @param options 
     */
    private _parseQueryStringWhereOper(
        where: { [key: string]: any } | { [key: string]: any }[],
        options: { prefix?: string, suffix?: string } = { }
    ): { [key: string]: any } | { [key: string]: any }[] {
        let { prefix = '%', suffix = '%' } = options;
        let _where: { [key: string]: any } = { };
        let _arrWhere: { [key: string]: any }[] = [ ];
        try {
            // [[{ no: { $iLike: 'test11' }, name: 'test_name11'}, { no: 'test22' }], { no: 'test33' }]
            // [[[{ no: { $iLike: 'test11' }, name: 'test_name11'}, { no: 'test22' }], { no: 'test33' }], { no: 'test22' }]
            if (_.isArray(where)) {
                _.forEach(where, (datas, index) => {
                    if (_.isArray(datas)) {
                        _arrWhere.push(this._parseQueryStringWhereOper(
                            datas, options
                        ));
                    } else if (_.isObject(datas)) {
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
                        _.forEach(<{ [P in keyof IOperatorsAliasesString]: any }> data, (d, oper) => {
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

    /**
     * 解析where為query builder使用的資料
     * 
     * @param key 
     * @param datas 
     * @param index 
     * @param oper 
     */
    private _parseQueryStringWhereToSqlUes(
        key: string | number, datas: any, index: string,
        options: { oper?: keyof IOperatorsAliasesString, isJoin?: keyof T2 } = { }
    ): string {
        let { isJoin, oper: $oper = '$eq' } = options;
        let oper = <keyof IOperatorsAliasesString> $oper;
        let where = '';
        try {
            if (['$and', '$or'].includes(key.toString())) {
                let tempWhereSql: string[] = [];
                // { $and: [{ no: 'test11' }, { no: 'test44' }] }
                // { $and: [{ no: { $iLike: 'test' } }, { no: 'test44' }] }
                // { $and: [{ no: 'test11', name: 'test_name11' }, { no: 'test44' }] }
                // { $or:  [{ no: 'test11' }, { no: 'test44' }] }
                // { $or:  [{ no: { $iLike: 'test' } }, { no: 'test44' }] }
                // { $or:  [{ no: 'test11', name: 'test_name11' }, { no: 'test44' }] }
                _.forEach(datas, (data, _index) => {
                    let innerTempWhereSql: string[] = [];
                    _.forEach(data, (d, _key) => {
                        let __index = `${index}_${_index}`;
                        // 因為object又判斷，所以此部份不需將在取出d物件的操作子
                        innerTempWhereSql.push(this._parseQueryStringWhereToSqlUes(_key, d, __index, { isJoin }));
                    });
                    if (innerTempWhereSql.length === 1) {
                        tempWhereSql.push(`${innerTempWhereSql.join(` ${this.operatorsAliasesString.$and} `)}`);
                    } else {
                        tempWhereSql.push(`(${innerTempWhereSql.join(` ${this.operatorsAliasesString.$and} `)})`);
                    }
                });

                where = `(${tempWhereSql.join(` ${this.operatorsAliasesString[<'$and' | '$or'> key]} `)})`;
            } else {
                if (_.isArray(datas) && oper === '$eq') {
                    // [[{ no: 'test11' }, { no: 'test44' }], { no: 'test33' }]
                    let tempWhere: string[] = [];
                    _.forEach(datas, (data, _index) => {
                        tempWhere.push(this._parseQueryStringWhereToSqlUes(
                            _index, data, index, { isJoin }
                        ));
                    });

                    // todo-cosmo:
                    // 經過測試後修正錯誤, 但不確定是否完全正確！
                    // ~觀察~
                    if (tempWhere.length === 1) {
                        where = `${tempWhere.join(` ${this.operatorsAliasesString.$or} `)}`;
                    } else {
                        where = `(${tempWhere.join(` ${this.operatorsAliasesString.$or} `)})`;
                    }
                } else if (_.isObject(datas) && oper === '$eq') {
                    // [{ no: 'test' }]
                    // { no: { $iLike: '%test%' } }
                    let whereCount = 1;
                    let tempWhere: string[] = [];
                    _.forEach(datas, (data, _oper) => {
                        let _index = `${index}_${whereCount.toString()}`;
                        if (_.isNumber(key)) {
                            tempWhere.push(this._parseQueryStringWhereToSqlUes(
                                _oper, data, _index, { isJoin }
                            ));
                        } else {
                            // tempWhere.push(this._parseQueryStringWhereToSqlUes(
                            //     key, data, _index, (<keyof IOperatorsAliasesString> _oper)
                            // ));
                            tempWhere.push(this._parseQueryStringWhereToSqlUes(
                                key, data, _index, { oper: (<keyof IOperatorsAliasesString> _oper), isJoin }
                            ));
                        }
                    });
                    if (tempWhere.length === 1) {
                        where = `${tempWhere.join(` ${this.operatorsAliasesString.$and} `)}`;
                    } else {
                        where = `(${tempWhere.join(` ${this.operatorsAliasesString.$and} `)})`;
                    }
                } else {
                    let tableCol = '';
                    // todo-cosmo: 如果存在 " 符號會很慘
                    if (this._reCol.test(key.toString())) {
                        throw new Error(`[PARAM:ERROR] Has unsupported character [${key}]`);
                    }

                    let splitKey = key.toString().split('.');
                    if (splitKey.length === 1) {
                        tableCol = `${this._builder.alias}.${key}`;

                        if (isJoin) {
                            tableCol = `${isJoin}.${key}`;
                        }
                    } else if (splitKey.length > 1) {
                        let table = <string> splitKey.shift();
                        if (!this._extJoinAlias.includes(table)) {
                            throw new Error(`[PARAM:ERROR] WHERE join table not join [${table}]`);
                        }

                        tableCol = `${table}.${splitKey.join('.')}`;
                    }
                    /**
                     * 如果不是object or array
                     * example:
                     *  { no: 'test11' },
                     *  { $iLike: '%test%' }
                     */
                    switch (oper) {
                        case '$in':
                            where = `${tableCol} ${this.operatorsAliasesString[oper]} (:...${index})`;
                            break;
                        case '$notIn':
                            where = `${tableCol} ${this.operatorsAliasesString[oper]} (:...${index})`;
                            break;
                        case '$between':
                            where = `
                                ${tableCol} ${this.operatorsAliasesString[oper]} :${index}_start AND :${index}_end
                            `.trim();
                            this.whereSqlParams[`${index}_start`] = datas[0];
                            this.whereSqlParams[`${index}_end`] = datas[1];
                            break;
                        case '$notBetween':
                            where = `
                                ${tableCol} ${this.operatorsAliasesString[oper]} :${index}_start AND :${index}_end
                            `.trim();
                            this.whereSqlParams[`${index}_start`] = datas[0];
                            this.whereSqlParams[`${index}_end`] = datas[1];
                            break;
                        case '$col':
                        case '$notCol':
                        case '$gtCol':
                        case '$gteCol':
                        case '$ltCol':
                        case '$lteCol':
                            let tableDataCol = '';
                            // todo-cosmo: 如果存在 " 符號會很慘
                            if (this._reCol.test(<string> datas)) {
                                throw new Error(`[PARAM:ERROR] Has unsupported character [${datas}]`);
                            }

                            let splitData = datas.split('.');
                            if (splitData.length === 1) {
                                tableDataCol = `${this._builder.alias}.${datas}`;

                                if (isJoin) {
                                    tableDataCol = `${isJoin}.${datas}`;
                                }
                            } else if (
                                splitData.length > 1 && (
                                    isJoin === undefined
                                    || (
                                        tableDataCol[0] === this._builder.alias
                                        && isJoin !== undefined
                                    )
                                )
                            ) {
                                let table = <string> splitData.shift();
                                if (!this._extJoinAlias.includes(table)) {
                                    throw new Error(`[PARAM:ERROR] WHERE join table not join [${table}]`);
                                }

                                tableDataCol = `${table}.${splitData.join('.')}`;
                            }

                            where = `${tableCol} ${this.operatorsAliasesString[oper]} ${tableDataCol}`;
                            break;
                        default:
                            if (!(oper in this.operatorsAliasesString)) {
                                throw new Error(`[SQL:ERROR] Unknown oper [${oper}]`);
                            }

                            where = `${tableCol} ${this.operatorsAliasesString[oper]} :${index}`;
                            break;
                    }

                    // 如果不為$col則需要紀錄indx: datas
                    if (!['$col', '$notCol', '$gtCol', '$gteCol', '$ltCol', '$lteCol'].includes(oper) && !isJoin) {
                        this.whereSqlParams[index] = datas;
                    } else if (
                        !['$col', '$notCol', '$gtCol', '$gteCol', '$ltCol', '$lteCol'].includes(oper)
                        && isJoin
                    ) {
                        this.joinWhereSqlParams[isJoin] = {
                            ...this.joinWhereSqlParams[isJoin],
                            [index]: datas
                        };
                    }
                }
            }

            return where;
        } catch (err) {
            throw err;
        }
    }

    private _builtQuery(): Typeorm.SelectQueryBuilder<T>;
    private _builtQuery(options: { prefix?: string, suffix?: string }): Typeorm.SelectQueryBuilder<T>;
    /**
     * because `query` can replace, though can new class, but not must and wasting space.
     * @param options 
     */
    private _builtQuery(options: { prefix?: string, suffix?: string } = { }): Typeorm.SelectQueryBuilder<T> {
        this.query.where = this._parseQueryStringWhere(this.query.where, options);
        _.forEach(this.query.extJoin, (data, joinCol) => {
            let alias = data.alias || joinCol;
            if (this._reCol.test(alias.toString())) {
                throw new Error(`[PARAM:ERROR] Has unsupported character [${alias}]`);
            }

            this._extJoinAlias.push(alias);
            data.joinWhere = this._parseQueryStringWhere(data.joinWhere, options);
        });
        return this._parseFindOptions();
    }

    private _parseFindOptions() {
        try {
            if (!('select' in this.query)) {
                throw new Error('[PARAM:ERROR] Lack SELECT parameter');
            }

            return _.reduce(this.query, (_builder, data, key) => {
                switch (key.toLocaleLowerCase()) {
                    case 'select':
                        // let joinSelect: string[] = [];
                        let mainSelect = data.reduce((_mainSelect: string[], d: string, k: number) => {
                            if (this._reCol.test(<string> d)) {
                                throw new Error(`[PARAM:ERROR] Has unsupported character [${d}]`);
                            }

                            let splitD = d.split('.');
                            if (splitD.length === 1) {
                                _mainSelect.push(`${this._builder.alias}.${d}`);
                            } else if (splitD.length > 1) {
                                if (!this._extJoinAlias.includes(splitD[0])) {
                                    throw new Error(`[PARAM:ERROR] SELECT join table not join [${splitD[0]}]`);
                                }

                                _mainSelect.push(d);
                            }

                            return _mainSelect;
                        }, []);

                        if (mainSelect.length === 0) {
                            throw new Error('[PARAM:ERROR] Main table at least output one column');
                        }

                        _builder.select(mainSelect);
                        break;
                    case 'where':
                        let whereCount = 0;
                        _.forEach(data, (_data, _key) => {
                            this.whereSqlString.push(
                                this._parseQueryStringWhereToSqlUes(_key, _data, whereCount.toString())
                            );
                            whereCount++;
                        });

                        if (_.isArray(data)) {
                            _builder.where(this.whereSqlString.join(' OR '), this.whereSqlParams);
                        } else {
                            _builder.where(this.whereSqlString.join(' AND '), this.whereSqlParams);
                        }
                        break;
                    case 'order':
                        let orderCount = 0;
                        if (_.isObject(data)) {
                            _.forEach(<{ [P in keyof T]: 'ASC' | 'DESC' }> data, (d, k) => {
                                if (!this.query.select.includes(k) && this.query.extJoin !== undefined) {
                                    throw new Error(`[PARAM:ERROR] ORDER params exist SELECT not has params [${k}]`);
                                }

                                if (_.isArray(this.query.group) && !this.query.group.includes(k)) {
                                    throw new Error(`[PARAM:ERROR] ORDER params exist GROUP not has params [${k}]`);
                                }

                                let splitKey = k.split('.');
                                let tableCol = '';
                                if (splitKey.length === 1) {
                                    tableCol = `${_builder.alias}.${k}`;
                                } else if (splitKey.length > 1) {
                                    let table = <string> splitKey.shift();
                                    if (!this._extJoinAlias.includes(table)) {
                                        throw new Error(`[PARAM:ERROR] ORDER join table not join [${table}]`);
                                    }

                                    tableCol = `${table}.${splitKey.join('.')}`;
                                }

                                if (orderCount === 0) {
                                    _builder.orderBy(tableCol, (<'ASC' | 'DESC'> d.toLocaleUpperCase()));
                                } else {
                                    _builder.addOrderBy(tableCol, (<'ASC' | 'DESC'> d.toLocaleUpperCase()));
                                }
                                orderCount++;
                            });
                        }
                        break;
                    case 'group':
                        let groupCount = 0;
                        if (_.isArray(data)) {
                            _.forEach(data, (d) => {
                                let splitKey = d.split('.');
                                let tableCol = '';
                                if (splitKey.length === 1) {
                                    tableCol = `${_builder.alias}.${d}`;
                                } else if (splitKey.length > 1) {
                                    let table = <string> splitKey.shift();
                                    if (!this._extJoinAlias.includes(table)) {
                                        throw new Error(`[PARAM:ERROR] GROUP join table not join [${table}]`);
                                    }

                                    tableCol = `${table}.${splitKey.join('.')}`;
                                }

                                if (groupCount === 0) {
                                    _builder.groupBy(tableCol);
                                } else {
                                    _builder.addGroupBy(tableCol);
                                }

                                groupCount++;
                            });
                        }
                        break;
                    case 'extjoin':
                        _.forEach(<{ [PP in keyof T2]: IExtJoin<T2> }> data, (d, joinCol) => {
                            let alias = <keyof T2> (d.alias || joinCol);
                            let joinWhereCount = 0;
                            let joinWhere = '';
                            this.joinWhereSqlString[alias] = this.joinWhereSqlString[alias] || [];
                            this.joinWhereSqlParams[alias] = this.joinWhereSqlParams[alias] || { };
                            _.forEach(d.joinWhere, (_data, _key) => {
                                this.joinWhereSqlString[alias].push(
                                    this._parseQueryStringWhereToSqlUes(
                                        _key, _data, `J_${joinWhereCount.toString()}`, { isJoin: alias }
                                    )
                                );
                                joinWhereCount++;
                            });

                            if (_.isArray(d.joinWhere)) {
                                joinWhere = this.joinWhereSqlString[alias].join(' OR ');
                            } else {
                                joinWhere = this.joinWhereSqlString[alias].join(' AND ');
                            }
                            switch (d.type.toLocaleLowerCase()) {
                                case 'left':
                                    _builder.leftJoin(
                                        `${_builder.alias}.${joinCol}`,
                                        <string> alias,
                                        joinWhere,
                                        this.joinWhereSqlParams[alias]
                                    );
                                    break;
                                case 'inner':
                                    _builder.innerJoin(
                                        `${_builder.alias}.${joinCol}`,
                                        <string> alias,
                                        joinWhere,
                                        this.joinWhereSqlParams[alias]
                                    );
                                    break;
                                default:
                                    throw new Error('[SQL:ERROR] JOIN type unknown');
                                    break;
                            }
                        });
                        break;
                    case 'take':
                        if (!_.isNumber(data)) {
                            throw new Error('[SQL:ERROR] TASK is not number');
                        }

                        _builder.take(<number> data);
                        break;
                    case 'skip':
                        if (!_.isNumber(data)) {
                            throw new Error('[SQL:ERROR] SKIP is not number');
                        }

                        _builder.skip(<number> data);
                        break;
                    default:
                        // do not thing
                        break;
                }

                return _builder;
            }, this._builder);
        } catch (err) {
            throw err;
        }
    }

    /**
     * 取得build出來的sql, 大多debug用
     */
    toSql() {
        return this._builder.getSql();
    }

    findOne() {
        return this._builder.getOne();
    }

    async find(): Promise<{ datas: T[], filterCount: number, totalCount: number }>;
    async find(options: { resource: { conn: Typeorm.Connection, mainModel: any } }): Promise<{ datas: T[], filterCount: number, totalCount: number }>;
    async find(options: { isGetCount: true }): Promise<{ datas: T[], filterCount: number, totalCount: number }>;
    async find(options: { isGetCount: true, resource: { conn: Typeorm.Connection, mainModel: any } }): Promise<{ datas: T[], filterCount: number, totalCount: number }>;
    async find(options: { isGetCount: false }): Promise<T[]>;
    /**
     * options.isGetCount = true and default value call filterCount and totalCount, and you must input conn and mainModel, if you in constructor input can not need input
     * 
     * options.isGetCount = false only call getMany
     * @param options 
     */
    async find(options: { isGetCount?: boolean, resource?: { conn: Typeorm.Connection, mainModel: any } } = { })
    : Promise<{ datas: T[], filterCount: number, totalCount: number } | T[]> {
        let { isGetCount = true, resource = undefined } = options;
        if (isGetCount) {
            if (this._resource === undefined && resource === undefined ) {
                throw new Error('[RESOUCE:ERROR] Connection is undefined');
            }

            return {
                datas: await this.findAll(),
                filterCount: await this.filterCount(),
                totalCount: await this.totalCount(resource)
            };
        }

        return await this.findAll();
    }

    /**
     * call getMany()
     */
    async findAll() {
        return await this._builder.getMany();
    }

    /**
     * call getCount()
     */
    async filterCount() {
        return await this._builder.getCount();
    }

    /**
     * call count(), you must input conn and mainModel, if you in constructor input can not need input
     * 
     * @param resource 
     *  conn: this database name connection
     * 
     *  mainModel: this queryBuild using model
     */
    async totalCount(resource?: { conn: Typeorm.Connection, mainModel: any }): Promise<number> {
        let { conn, mainModel/*, otherModel = []*/ } = resource || this._resource || { };
        if (conn === undefined || mainModel === undefined) {
            throw new Error('[RESOUCE:ERROR] Connection is undefined');
        }

        return await conn.manager.count(mainModel);
    }

    // findAndCount() {
    //     return this._builder.getManyAndCount();
    // }

    // Count() {
    //     return this._builder.getCount();
    // }
}


export class Db {
    // /**
    //  * 此部份暫時commend out, 等待適用時機
    //  * 使用此請注意該運算子是否適用於database(有些是限定db使用的。)
    //  */
    // readonly operatorsAliases = {
    //     $eq: Typeorm.Equal,
    //     $ne: Typeorm.Not,
    //     $gte: Typeorm.MoreThanOrEqual,
    //     $gt: Typeorm.MoreThan,
    //     $lte: Typeorm.LessThanOrEqual,
    //     $lt: Typeorm.LessThan,
    //     $in: Typeorm.In,
    //     $notIn: Typeorm.Not(Typeorm.In),
    //     $is: (key: string, value: any) => {
    //         return this.operatorsAliases.$raw(key, '$is', value);
    //     },
    //     $like: Typeorm.Like,
    //     $notLike: Typeorm.Not(Typeorm.Like),
    //     $iLike: (key: string, value: any) => {
    //         return this.operatorsAliases.$raw(key, '$iLike', value);
    //     },
    //     $noILike: (key: string, value: any) => {
    //         return Typeorm.Not(this.operatorsAliases.$iLike(key, value));
    //     },
    //     $regexp: (key: string, value: any) => {
    //         return this.operatorsAliases.$raw(key, '$regexp', value);
    //     },
    //     $noRegexp: (key: string, value: any) => {
    //         return Typeorm.Not(this.operatorsAliases.$regexp(key, value));
    //     },
    //     $iRegexp: (key: string, value: any) => {
    //         return this.operatorsAliases.$raw(key, '$iRegexp', value);
    //     },
    //     $noIRegexp: (key: string, value: any) => {
    //         return Typeorm.Not(this.operatorsAliases.$iRegexp(key, value));
    //     },
    //     $between: Typeorm.Between,
    //     $notBetwwen: Typeorm.Not(Typeorm.Between),
    //     $overlap: (key: string, value: any) => {
    //         return this.operatorsAliases.$raw(key, '$overlap', value);
    //     },
    //     /**
    //      * 可能會被inject
    //      */
    //     $raw: (key: string, cond: keyof IOperatorsAliasesString, value: any) => {
    //         return Typeorm.Raw((alias) => {
    //             if (!(cond in this.operatorsAliasesString)) {
    //                 throw new Error('資料庫操作子錯誤。');
    //             }
    //             let _value = _.isString(value) ? `'${value}'` : value;
    //             return `${alias} ${this.operatorsAliasesString[cond]} ${_value}`;
    //         });
    //     },
    //     $col: (key: string, cond: keyof IOperatorsAliasesString, value: string) => {
    //         return Typeorm.Raw((alias) => {
    //             return `${alias} ${this.operatorsAliasesString[cond]} ${value}`;
    //         });
    //     }
    // };

    /**
     * PG only:
     * 1. $iLike
     * 2. $iRegexp
     * 3. $notILike
     * 4. $iLike
     * 5. $overlap: [1, 2] => $$ [1, 2)
     * 6. $contains: [1, 2] => @> [1, 2)
     * 7. $contained: [1, 2] => <@ [1, 2)
     * 8. $adjacent: [1, 2] => -|- [1, 2)
     * 9. $strictLeft: [1, 2] => << [1, 2)
     * 10. $strictRight: [1, 2] => >> [1, 2)
     * 11. $noExtendRight: [1, 2] => &< [1, 2)
     * 12. $noExtendLeft: [1, 2] => &> [1, 2)
     * 13. $any: [2, 3] => ANY ARRAY[2, 3]::INTERGER / $any ['2', '3'] => ANY ARRAY['2', '3']::TEXT (基本上不使用這個)
     * 
     * commend:
     * 1. $gt: { $all: 'SELECT 1' } => ALL (SELECT 1) (不知道這啥東西，基本上不使用)
     * 2. $values: [4, 5, 6] => VALUES (4), (5), (6)
     * 3. $col: 'table.col' => "table"."col" (此需要小心使用，會被inject)
     */
    readonly operatorsAliasesString = operatorsAliasesString;
    readonly db: typeof Typeorm = Typeorm;
    private readonly _QueryBuildParse: typeof QueryBuildParse = QueryBuildParse;
    private readonly _config: Config;
    private readonly _dbConfig: Typeorm.ConnectionOptions;
    /**
     * @param config 
     * @param alias // default connection name
     */
    constructor(config: Config, alias: string) {
        this._config = config;
        this._dbConfig = this._config.dbConfig(alias);
    }

    get QueryBuildParse() {
        return this._QueryBuildParse;
    }

    async createTable(): Promise<void>;
    async createTable(dbConfig: Typeorm.ConnectionOptions): Promise<void>;
    /**
     * auto create table
     * 
     * because entities set models path, so can create table :)
     * 
     * config.entities "very important", don't setting wrong.
     */
    async createTable(dbConfig?: Typeorm.ConnectionOptions): Promise<void> {
        let connection = await this.db.createConnection(dbConfig || this._dbConfig);
        await connection.synchronize();

        return await connection.close();
    }

    async connection(): Promise<Typeorm.Connection>;
    async connection(dbConfig: Typeorm.ConnectionOptions): Promise<Typeorm.Connection>;
    /**
     * get connection
     * 
     * if you connection lose create new connection
     * 
     * call after you can 
     * 
     * @param dbConfig 
     * @example
     * connection(); // 預設連線(this._dbConfig)
     * connection(dbConfig); // 變更連線
     */
    async connection(dbConfig?: Typeorm.ConnectionOptions): Promise<Typeorm.Connection> {
        let _dbConfig = dbConfig || this._dbConfig;
        let connection;
        try {
            connection = await this.db.getConnection(_dbConfig.name);
            if (!connection.isConnected) {
                connection = await this.db.createConnection(dbConfig || this._dbConfig);
            }

            return connection;
        } catch (err) {
            connection = await this.db.createConnection(dbConfig || this._dbConfig);

            return connection;
        }
        // return await this.db.createConnection(dbConfig || this._dbConfig);
    }
}
