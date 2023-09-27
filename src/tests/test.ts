// import * as OracleDB from 'oracledb';
import { DatabaseFactory, DbConfig } from '../index';

(async () => {
    try {
        let config = new DbConfig('oracle', {
            user: 'TMCKETL',
            password: 'TMCKETL123',
            connectString: '10.128.128.25:1526/dcdb'
        });
        // let config = new DbConfig('mssql', {
        //     user: 'TMCKETL',
        //     password: 'Jan2020&DPM',
        //     server: '10.128.2.160',
        //     port: 1433,
        //     database: 'HMMS',
        //     options: {
        //         encrypt: false
        //     }
        // });
        // let config = new DbConfig('mysql', {
        //     user: 'dpmapi',
        //     password: '!2020donthackmE!',
        //     database: 'DPM',
        //     host: '10.129.137.48',
        //     port: 3306
        // });

        let oracleDatabase = await DatabaseFactory.createDatabase('oracle', config);
        let pool = await oracleDatabase.pool();
        try {
            let db = await pool.poolConnection();
            await pool.transaction(db);

            let sql = `
                SELECT
                    SUM(FAIL_QTY) FAIL_QTY ,
                    SUM(REFAIL_QTY) REFAIL_QTY ,
                    SUM(GAP_QTY) GAP_QTY,
                    SUM("OUTPUT") OUTPUT,
                    (SUM(GAP_QTY) / SUM("OUTPUT")),
                    (1 - ((SUM(FAIL_QTY) + SUM(REFAIL_QTY)) / SUM("OUTPUT")) - (SUM(GAP_QTY) / SUM("OUTPUT"))) * 100 INSIGHT_FPY
                FROM
                    SFISM4.R_LINE_FPY_T rlft 
                WHERE
                    PLANT_CODE = :0
                    AND LINE_NAME = 'CTYSMTB'
            `;
            let { rows } = await pool.query(db, sql, ['CTY']);
            console.log(rows);

            await pool.commit();
        } catch (err) {
            await pool.rollback();
            throw err;
        } finally {
            // await pool.end();
        }
    } catch (err) {
        console.error(err);
    }
})();