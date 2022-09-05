"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
(async () => {
    try {
        // let config: IDbConfig = {
        //     user: 'dpmapi',
        //     password: '!2020donthackmE!',
        //     database: 'DPM',
        //     host: '10.129.137.48',
        //     port: 3306
        // };
        // let config: IDbConfig = {
        //     user: 'TMCKETL',
        //     password: 'TMCKETL123',
        //     connectString: '10.129.128.123:1526/dcdb',
        // };
        let config = {
            user: 'TMCKETL',
            password: 'Jan2020&DPM',
            server: '10.128.2.160',
            port: 1433,
            database: 'HMMS',
            options: {
                encrypt: false
            }
        };
        let msDatabase = new index_1.DatabaseFactory('mssql', config);
        let db = await msDatabase.connect();
        let result = await db.query('SELECT * FROM DPM_EMPAttendance');
        console.log(result.rows);
        await db.end();
    }
    catch (err) {
        console.error(err);
    }
})();
//# sourceMappingURL=test.js.map