import { URL } from "./api.ts";

const sql = {
    async createSql(payload: any): Promise<any> {
        try {
            const response = await fetch(`${URL}/api/create-table/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
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
                    "Authorization": `Bearer ${document.cookie}`
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