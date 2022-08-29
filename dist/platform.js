"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformTools = void 0;
class PlatformTools {
    static async load(type) {
        try {
            if (type === 'mysql') {
                return await Promise.resolve().then(() => require('mysql2/promise'));
            }
            else if (type === 'oracle') {
                return await Promise.resolve().then(() => require('oracledb'));
            }
            else if (type === 'mssql') {
                return await Promise.resolve().then(() => require('mssql'));
            }
            else {
                throw new Error('Unkowns type');
            }
        }
        catch (err) {
            throw err;
        }
    }
}
exports.PlatformTools = PlatformTools;
//# sourceMappingURL=platform.js.map