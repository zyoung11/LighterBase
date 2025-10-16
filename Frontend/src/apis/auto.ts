// 定义基础响应类型
interface BaseResponse {
  status?: number;
  message?: string;
  data?: Record<string, any>;
}

interface CreateSuccessResponse extends BaseResponse {
  id: string;
}

interface ViewSuccessResponse<T = Record<string, any>> extends BaseResponse {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}

// 定义请求体类型
interface InsertPayload {
  [key: string]: any;
}

interface DeletePayload {
  WHERE: any;
}

interface UpdatePayload {
  set: Record<string, any>;
  WHERE: any;
}

interface SearchPayload {
  SELECT?: string[];
  WHERE?: any;
}

class lighterBase {
  private baseURL: string;

  constructor(baseURL: string) {
    if (!baseURL || typeof baseURL !== 'string') {
      throw new Error("Lighterbase 初始化失败：必须传入一个有效的基准 URL 字符串。");
    }
    this.baseURL = baseURL;
  }

  private getAuthToken(): string {
    const cookies = document.cookie;
    let match: string | null = null;
    const authTokenMatch = cookies.match(/authToken=([^;]*)/);
    if (authTokenMatch && authTokenMatch[1]) {
    match = authTokenMatch[1];
    }
    return match || '';
  }

  private async request<T>(method: string, endpoint: string, payload?: any, skipAuth: boolean = false): Promise<T> {
    try {
      let token = this.getAuthToken();
      console.log(token);
      const url = `${this.baseURL}/api/auto/${endpoint}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };

      if (!skipAuth) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method: method,
        headers: headers
      };

      if (payload && method !== "GET" && method !== "DELETE") {
        config.body = JSON.stringify(payload);
      }
      console.log("检查具体的请求:",config);
      const res = await fetch(url, config);

      if (res.ok) {
        if (res.status === 204) {
          return null as unknown as T;
        }
        return res.json();
      } else {
        const errorData: BaseResponse = await res.json();
        throw new Error(errorData.message || `API 请求错误: 状态码 ${res.status}`);
      }
    } catch (err) {
      console.error(`Lighterbase 请求失败:`, err);
      throw err;
    }
  }

  public async insertTable(payload: InsertPayload, table: string): Promise<CreateSuccessResponse> {
    const skipAuth = table === 'users';
    return this.request<CreateSuccessResponse>("POST", `create/${table}`, payload, skipAuth);
  }

  public deleteTable(payload: DeletePayload, table: string): Promise<void> {
    return this.request<void>("DELETE", `delete/${table}`, payload);
  }

  public updateTable(payload: UpdatePayload, table: string): Promise<void> {
    return this.request<void>("PUT", `update/${table}`, payload);
  }

  public searchTable<T = Record<string, any>>(
    payload: SearchPayload,
    table: string,
    page: number,
    perpage: number
  ): Promise<ViewSuccessResponse<T>> {
    const endpoint = `view/${table}?page=${page}&perpage=${perpage}`;
    return this.request<ViewSuccessResponse<T>>("POST", endpoint, payload);
  }
}

export default lighterBase;