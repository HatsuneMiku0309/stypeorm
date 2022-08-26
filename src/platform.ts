import { TDatabaseType } from "./database";

export class PlatformTools {
    static async load (type: TDatabaseType): Promise<any> {
        try {
            if (type === 'mysql') {
                return await import('mysql2/promise');
            } else if (type === 'oracle') {
                return await import('oracledb');
            } else {
                throw new Error('Unkowns type');
            }
        } catch (err) {
            throw err;
        }
    }
}