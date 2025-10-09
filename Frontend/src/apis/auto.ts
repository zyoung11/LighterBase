import { URL } from "./api.ts";

const auto = {
    async createTable(payload: any,table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/auto/create/${table}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("创建表失败：",err);
        }
    },

    async deleteTable(table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/auto/delete/${table}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie}`
                }
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("删除表失败：",err);
        }
    },

    async updateTable(payload: any,table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/auto/update/${table}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("更新表失败：",err);
        }
    },

    async searchTable(payload: any,table:string,x:number,y:number): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/auto/view/${table}?page=${x}&perpage=${y}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("搜索表失败：",err);
        }
    }
}

export default auto;