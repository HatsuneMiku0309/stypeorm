"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
(async () => {
    let config = {
        user: 'dpmapi',
        password: '!2020donthackmE!',
        database: 'DPM',
        host: '10.129.137.48',
        port: 3306
    };
    // let config: IDbConfig = {
    //     user: 'TMCKETL',
    //     password: 'TMCKETL123',
    //     connectString: '10.129.128.123:1526/dcdb',
    // };
    let a = new index_1.DatabaseFactory('mysql', config);
    let result = await a.query('SELECT * FROM C_PLANT_DEF_T cpdt');
    console.log(result.rows);
})();
//# sourceMappingURL=test.js.map