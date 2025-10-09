import { URL } from "./api.ts";

const admin ={
    async getRecords(): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${document.cookie}`
                }
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("获取记录失败：",err);
        }
    },

    async createAuth(payload:any,table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security/${table}`, {
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
            console.log("创建权限失败：",err);
        }
    },

    async deleteAuth(table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security/${table}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${document.cookie}`
                }
            });
            if (res.ok) {
                return res.json();
            }
        }catch(err){
            console.log("删除权限失败：",err);
        }
    },

    async updateAuth(payload:any,table:string): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security/${table}`, {
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
            console.log("更新权限失败：",err);
        }
    },
}