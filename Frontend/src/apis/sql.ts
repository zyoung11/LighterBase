import { URL,authToken } from "./api.ts";
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
            return await response.json();
        } catch (error) {
            console.error("Error getting lastest SQL:", error);
            throw error;
        }
    },
}

export default sql;