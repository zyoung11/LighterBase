import { URL,authToken } from "./api.ts";

const admin ={
    async getRecords(): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                console.log("获取记录成功：",data);
                return data;
            }else{
                console.log("获取记录失败：",res.status);
            }
        }catch(err){
            console.log("获取记录失败：",err);
        }
    },

    // async createAuth(payload:any,table:string): Promise<any> {
    //     try{
    //         const res = await fetch(`${URL}/api/security/${table}`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Authorization": `Bearer ${document.cookie}`
    //             },
    //             body: JSON.stringify(payload)
    //         });
    //         if (res.ok) {
    //             return res.json();
    //         }
    //     }catch(err){
    //         console.log("创建权限失败：",err);
    //     }
    // },

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

    async updateAuth(table:string,payload:any): Promise<any> {
        try{
            const res = await fetch(`${URL}/api/security/${table}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
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

export default admin;