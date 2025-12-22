import { URL,authToken,hubAuthToken } from "./api.ts";
type theLogs = {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
    logs: { id: number; log_text: string; created_at: string; level: number }[];
}
const sql = {

//================================sql===============================

    
    async createSql(payload: any): Promise<any> {
        try {
            const res = await fetch(`${URL}/api/create-table/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                return false
            }else{
            return true
            // const data = await res.json();
            // return data;
            }
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
            // console.log(data.Sql);
            return data.Sql;
        } catch (e) {
            // throw e;
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


//================================log===============================



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
        console.log("测试",URL);
        return data;

    } catch (e) {
        console.error('getLogs error', e);
        throw e;
    }
    },


      async searchLogs(page: number = 1,perPage: number = 30,query: string = ''):  Promise<theLogs> {
    try {
      const res = await fetch(
        `${URL}/api/search/logs?page=${page}&perpage=${perPage}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ query }),
        }
      );

      if (!res.ok) {
        throw new Error(`查询失败: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('searchLogs error', error);
      throw error;
    }
  },


//================================query===============================



async getAllQueries(page = 1, perPage = 30): Promise<any> {
    try {
        const res = await fetch(`${URL}/api/queries?page=${page}&perpage=${perPage}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data =await res.json();
        return data;
    } catch (e) {
    }
},

async createQuery(queries:any): Promise<any> {
    try {
        const response = await fetch(`${URL}/api/queries`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(queries)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
    }
},

async updateQuery(queryId: number, queries: any): Promise<any> {
    try {
        const response = await fetch(`${URL}/api/queries/${queryId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(queries)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) {
            return true;
        }
        return await response.json();
    } catch (e) {
    }
},

async deleteQuery(queryId: number): Promise<any> {
    try {
        const response = await fetch(`${URL}/api/queries/${queryId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (response.status === 204) {
            return true;
        }
        return await response.json();
    } catch (e) {
    }
},


async runQuery(queries:any): Promise<any> {
    try {
        const response = await fetch(`${URL}/api/queries/run-queries`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(queries)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data)
        return data
    } catch (e) {
    }
},






//================================hub的sql操作===============================




    async hubLastestSql(hubUrl:string,projectId:number): Promise<any> {
        try {
            const response = await fetch(`${hubUrl}/api/projects/sql/${projectId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${hubAuthToken}`
                }
            });
            console.log(hubUrl)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.Sql;
        } catch (e) {
            // console.error("err SQL:", e);
            // throw e;
        }
    },



   
}

export default sql;
