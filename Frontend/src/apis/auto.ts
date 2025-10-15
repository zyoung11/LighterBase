class lighterBase {
    private baseURL: string;
    
    constructor(baseURL: string) {
        if (!baseURL || typeof baseURL !== 'string') {
            throw new Error("MyAutoAPI 初始化失败：必须传入一个有效的基准 URL 字符串。");
        }
        this.baseURL = baseURL;
    }
    
    private getAuthToken(): string {
        const match = document.cookie.split('; ')
            .find(row => row.startsWith('auth_token=')) 
            ?.split('=')[1];
            
        return match || '';
    }

    private async request(method: string, endpoint: string, payload?: any): Promise<any> {
        try {
            const token = this.getAuthToken(); 
            const url = `${this.baseURL}/api/auto/${endpoint}`;
            
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            };

            const config: RequestInit = {
                method: method,
                headers: headers
            };
            
            if (payload && method !== "GET" && method !== "DELETE") {
                config.body = JSON.stringify(payload);
            }

            const res = await fetch(url, config);
            
            if (res.ok) {
                return res.json();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || `API 请求错误: 状态码 ${res.status}`);
            }
        } catch (err) {
            console.error(`MyAutoAPI 请求失败:`, err);
            throw err;
        }
    }

    public createTable(payload: any, table: string): Promise<any> {
        return this.request("POST", `create/${table}`, payload);
    }
    
    public deleteTable(table: string): Promise<any> {
        return this.request("DELETE", `delete/${table}`);
    }

    public updateTable(payload: any, table: string): Promise<any> {
        return this.request("PUT", `update/${table}`, payload);
    }

    public searchTable(payload: any, table: string, page: number, perpage: number): Promise<any> {
        const endpoint = `view/${table}?page=${page}&perpage=${perpage}`;
        return this.request("POST", endpoint, payload);
    }
}

export default lighterBase;