// import * as OracleDB from 'oracledb';
import { DatabaseFactory, DbConfig, IDbConfig } from '../index';

(async () => {
    try {
        let config = new DbConfig('oracle', {
            user: 'TMCKETL',
            password: 'TMCKETL123',
            connectString: '10.128.128.25:1526/dcdb'
        });
        

        
        // let config: TDbConfig = {
        //     user: 'abc',
        //     password: 'abc',
        //     connectString: '127.0.0.1:1521/dcdb'
        // };
        
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
        await database.pool();
        let q = await database.poolConnection();
        // console.log(a);
        // let db = await database.connect();

        let qaq = await q.execute('SELECT * FROM SFISM4.R_LINE_OUTPUT_T rlot');
        console.log(qaq);

        await q.close();
    } catch (err) {
        console.error(err);
    }
})();