// import * as OracleDB from 'oracledb';
import { IDbConfig, DatabaseFactory } from '../index';

(async () => {
    try {
        // let config: IDbConfig = {
        //     user: 'abc',
        //     password: 'abc',
        //     database: 'DPM',
        //     host: '127.0.0.1',
        //     port: 3306
        // };
        let config: IDbConfig = {
            user: 'abc',
            password: 'abc',
            connectString: '127.0.0.1:1521/dcdb'
        };
        // let config : IDbConfig = {
        //     user: 'abc',
        //     password: 'abc',
        //     server: '127.0.0.1',
        //     port: 1433,
        //     database: 'HMMS',
        //     options: {
        //         encrypt: false
        //     }
        // }
        let database = new DatabaseFactory('oracle', config);

        // set database after _init(), so this call is undefined. 
        let a = await database.getDatabase();
        console.log(a);
        let db = await database.connect();

        let qaq = await db.query('SELECT ＊ FROM SFISM4.R_LINE_OUTPUT_T rlot');
        console.log(qaq);

        await db.end();
    } catch (err) {
        console.error(err);
    }
})();