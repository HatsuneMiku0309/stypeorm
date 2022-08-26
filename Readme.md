stypeorm
===

[TOC]

## Install
### Custom build
1. Clone project
```bash=
$ git clone `project`
```

2. Npm install
```bash=
$ npm i
```

3. Build Project
```bash=
$ npm run build
```

4. Copy at your `project/node_modules`

### Dependencies
**In `Compal LAN` can't use this method...**

at your `package.json` dependencies add
```json=
dependencies: {
    "stypeorm": "git+ssh://git@10.129.137.30:mckdddteam/stypeorm.git"
}
```
And
```bash=
$ npm i
```

## Using
The project only support `mysql2` and `oracledb`.

You should install either, or all
1. mysql2
```bash=
$ npm i mysql2
```

2. oracledb
```bash=
$ npm i oracledb
```

## Sample
* Oracle
```javascript=
import { IDbConfig, DatabaseFactory } from 'stypeorm';

let config: IDbConfig = {
    ...omit
};
let db = new DatabaseFactory('oracle', config);
let sql = 'SELECT * FROM TEST';
let result = await db.query(sql);
console.log(result.rows);
await db.end();
```

* Mysql
```javascript=
let config: IDbConfig = {
    ...omit
};
let db = new DatabaseFactory('mysql', config);
let sql = 'SELECT * FROM TEST';
let result = await db.query(sql);
console.log(result.rows);
await db.end();
```

## Desc

The ORM is simply module, not support `Pool`, `Trancation`...