import { URL,authToken } from "./api.ts";
type theLogs = {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
    logs: { id: number; log_text: string; created_at: string; level: number }[];
    }
const sql = {
    async createSql(payload: any): Promise<any> {
        try {
            const response = await fetch(`${URL}/api/create-table/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error creating SQL:", error);
            throw error;
        }
    },

    async lastestSql(): Promise<any> {
        try {
            const response = await fetch(`${URL}/api/sqls/latest`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data.Sql);
            return data.Sql;
        } catch (error) {
            console.error("Error getting lastest SQL:", error);
            throw error;
        }
    },

    async getTableAll(){
        try {
            const response = await fetch(`${URL}/api/query/tables`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const data:{tables:string[]} = await response.json();
            const tables = data.tables;
            return tables;
        } catch (error) {
            console.error("获取所以表名失败" ,error);
            throw error;
        }
    },

    async getLogs(page: number, perPage: number): Promise<theLogs> {
    try {
        const res = await fetch(
        `${URL}/api/query/logs?page=${page}&perpage=${perPage}`,
        {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${authToken}`,
            },
        }
        );
        if (!res.ok) throw new Error(`logs ${res.status}`);
        const data = await res.json();
        console.log(data);
        return data;

    } catch (e) {
        console.error('getLogs error', e);
        throw e;
    }
    }
}

export default sql;
