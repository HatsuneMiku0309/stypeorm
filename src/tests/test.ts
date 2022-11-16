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
        // let config: IDbConfig = {
        //     user: 'abc',
        //     password: 'abc',
        //     connectString: '127.0.0.1:1526/dcdb',
        // };
        let config : IDbConfig = {
            user: 'abc',
            password: 'abc',
            server: '127.0.0.1',
            port: 1433,
            database: 'HMMS',
            options: {
                encrypt: false
            }
        }
        let msDatabase = new DatabaseFactory('mssql', config);
        let msDatabase2 = new DatabaseFactory('mssql', config);
        let db = await msDatabase.connect();
        let db2 = await msDatabase2.connect();

        let qaq = await db.query('SELECT TOP 1 * FROM DPM_EMPAttendance');
        console.log(qaq);
        await db.end();
        await db.query('SELECT TOP 1 * FROM DPM_EMPAttendance');
        let result = await db2.query('SELECT TOP 1 * FROM DPM_EMPAttendance');

        console.log(result.rows);
    } catch (err) {
        console.error(err);
    }
})();