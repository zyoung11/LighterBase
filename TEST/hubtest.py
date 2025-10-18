import json
import requests
from typing import List, Dict, Optional, Union, Any

HOST = "http://localhost:8080"

# ---------- hub-level APIs (NO change) ----------
def register(user_name: str, password: str, email: str) -> Optional[str]:
    url = f"{HOST}/api/users/register"
    r = requests.post(url, json={"user_name": user_name, "password": password, "email": email})
    print(f"[注册 {user_name}] 状态码: {r.status_code}")
    if r.status_code == 201:
        return r.json().get("token")
    print(f"[注册 {user_name}] 失败: {r.text}")
    return None

def login(user_name: str, password: str) -> Optional[str]:
    url = f"{HOST}/api/users/login"
    r = requests.post(url, json={"user_name": user_name, "password": password})
    print(f"[登录 {user_name}] 状态码: {r.status_code}")
    if r.status_code == 200:
        return r.json().get("token")
    print(f"[登录 {user_name}] 失败: {r.text}")
    return None

def project_create(token: str, name: str, avatar: str = "", description: str = "") -> Optional[Dict]:
    url = f"{HOST}/api/projects"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"project_name": name, "project_avatar": avatar, "project_description": description}
    r = requests.post(url, json=payload, headers=headers)
    print(f"[create_project {name}] 状态码: {r.status_code}")
    if r.status_code == 201:
        proj = r.json()
        print("新建项目成功:", json.dumps(proj, ensure_ascii=False, indent=2))
        return proj
    print("新建项目失败:", r.text)
    return None

# ---------- BaaS reverse-proxy APIs ----------
def sql_admin_create(sql: Union[str, List[str]], token: str, user_id: str, project_id: str) -> None:
    url = f"{HOST}/{user_id}/{project_id}/api/create-table/create"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    sql_list = [sql] if isinstance(sql, str) else sql
    for idx, s in enumerate(sql_list, 1):
        payload = json.dumps({"sql": s.strip()})
        print(f"--- Executing SQL ({idx}/{len(sql_list)}): {s[:50]}... ---")
        try:
            resp = requests.post(url, data=payload, headers=headers)
            print("Status Code:", resp.status_code)
            try:
                print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
            except ValueError:
                print("Response Body (not json):\n", resp.text)
        except requests.exceptions.RequestException as e:
            print("请求出错:", e)

def sql_admin_check(ID: str, sql: str, token: str, user_id: str, project_id: str) -> None:
    url = f"{HOST}/{user_id}/{project_id}/api/sqls/latest"
    params = {"ID": ID, "sql": sql}
    headers = {"Authorization": f"Bearer {token}"}
    print(f"--- Checking SQL for user ID {ID}: {sql} ---")
    try:
        resp = requests.get(url, params=params, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def login_user(name: str, password_hash: str, user_id: str, project_id: str) -> Optional[str]:
    url = f"{HOST}/{user_id}/{project_id}/api/auth/login"
    payload = {"name": name, "password_hash": password_hash}
    headers = {"Content-Type": "application/json"}
    print(f"--- Logging in user: {name} ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
            if resp.ok and body.get("token"):
                print("Successfully logged in and got token.")
                return body["token"]
            else:
                print("Login failed or token not found.")
                return None
        except ValueError:
            print("Response Body (not json):\n", resp.text)
            return None
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
        return None

def refresh_token(old_token: str, user_id: str, project_id: str) -> Optional[str]:
    url = f"{HOST}/{user_id}/{project_id}/api/auth/refresh"
    headers = {"Authorization": f"Bearer {old_token}"}
    print("--- POST /api/auth/refresh ---")
    try:
        resp = requests.post(url, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
            if resp.status_code == 200 and body.get("token"):
                print("Successfully refreshed token.")
                return body["token"]
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None

def sec_admin_get(token: str, user_id: str, project_id: str) -> None:
    url = f"{HOST}/{user_id}/{project_id}/api/security"
    headers = {"Authorization": f"Bearer {token}"}
    print("--- GET /api/security ---")
    try:
        resp = requests.get(url, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def sec_admin_update(table: str, create_where: str, delete_where: str, update_where: str, view_where: str,
                     token: str, user_id: str, project_id: str) -> None:
    url = f"{HOST}/{user_id}/{project_id}/api/security/{table}"
    payload = {"create_where": create_where, "delete_where": delete_where,
               "update_where": update_where, "view_where": view_where}
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    print(f"--- Updating security policy for table: {table} ---")
    try:
        resp = requests.put(url, json=payload, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
        else:
            try:
                print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
            except ValueError:
                print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def create_article(payload: Dict[str, Any], token: str, user_id: str, project_id: str) -> Optional[str]:
    url = f"{HOST}/{user_id}/{project_id}/api/auto/create/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    print("--- POST /api/auto/create/articles ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
            if resp.status_code == 201 and "id" in body:
                print("Article created successfully.")
                return body["id"]
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None

def delete_articles(where_clause: str, token: str, user_id: str, project_id: str) -> bool:
    url = f"{HOST}/{user_id}/{project_id}/api/auto/delete/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"WHERE": where_clause}
    print(f"--- DELETE /api/auto/delete/articles ---\nWHERE: {where_clause}")
    try:
        resp = requests.delete(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
            return True
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False

def update_articles(set_dict: dict, where_clause: str, token: str, user_id: str, project_id: str) -> bool:
    url = f"{HOST}/{user_id}/{project_id}/api/auto/update/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"set": set_dict, "WHERE": where_clause}
    print(f"--- PUT /api/auto/update/articles ---\nSET: {set_dict}\nWHERE: {where_clause}")
    try:
        resp = requests.put(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
            return True
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False

def view_articles(select_fields: List[str], where_clause: str, token: str,
                  user_id: str, project_id: str,
                  page: int = 1, perpage: int = 30) -> List[Dict[str, Any]]:
    url = f"{HOST}/{user_id}/{project_id}/api/auto/view/articles"
    params = {"page": page, "perpage": perpage}
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"SELECT": select_fields, "WHERE": where_clause}
    print("--- Viewing articles ---")
    print(f"SELECT: {select_fields}\nWHERE: {where_clause}\npage={page}, perpage={perpage}")
    try:
        resp = requests.post(url, params=params, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items") or []
            total = data.get("totalItems", 0)
            print(f"totalItems={total}, 本页返回 {len(items)} 条")
            return items
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return []

def query_all_tables(token: str, user_id: str, project_id: str) -> List[str]:
    url = f"{HOST}/{user_id}/{project_id}/api/query/tables"
    headers = {"Authorization": f"Bearer {token}"}
    print("--- GET /api/query/tables ---")
    try:
        resp = requests.get(url, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            tables = data.get("tables") or []
            print("Tables:", tables)
            return tables
        try:
            print("Response Body:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return []

# ------------------- demo -------------------
if __name__ == "__main__":
    # 0. 准备两个用户
    uid, pwd, email = "zy", "123456", "zy@example.com"
    user_token = register(uid, pwd, email) or login(uid, pwd)
    if not user_token:
        print("❌ 拿不到用户 token，退出")
        exit(1)
    
    # ---------- 2. 创建项目 ----------
    proj = project_create(user_token, "demo_proj", description="just for test")
    print("原始返回:", json.dumps(proj, ensure_ascii=False, indent=2))
    if not proj:
        exit("❌ 项目创建失败")
    pid = proj.get("project_id") or proj.get("id")
    if not pid:
        exit("❌ 返回体里找不到项目 id 字段")
    
    # ---------- 3. 项目维度登录 → 拿项目 token ----------
    proj_token = login_user(uid, pwd, uid, pid)          # 注意传的是明文密码
    if not proj_token:
        print("❌ 拿不到项目 token，退出")
        # exit(1)

    # 2. 建表
    sql_admin_create(
        "CREATE TABLE articles (id SERIAL PRIMARY KEY, title TEXT, body TEXT)",
        user_token, uid, pid
    )

    # 3. 增
    article_id = create_article({"title": "hello", "body": "world"}, user_token, uid, pid)
    print("✅ 新文章 id =", article_id)

    # 4. 查
    rows = view_articles(["id", "title"], "id > 0", user_token, uid, pid, page=1, perpage=5)
    print("✅ 查到的行:", rows)

    # 5. 改
    ok = update_articles({"body": "world updated"}, "id = " + str(article_id), user_token, uid, pid)
    print("✅ 更新成功" if ok else "❌ 更新失败")

    # 6. 删
    ok = delete_articles("id = " + str(article_id), user_token, uid, pid)
    print("✅ 删除成功" if ok else "❌ 删除失败")

    # 7. 枚举表
    tbls = query_all_tables(user_token, uid, pid)
    print("✅ 当前项目表列表:", tbls)

    # 8. 安全策略
    sec_admin_get(user_token, uid, pid)
    sec_admin_update("articles", "true", "false", "true", "true", user_token, uid, pid)

    # 9. 项目维度登录 & 刷新
    proj_token = login_user(uid, pwd, uid, pid)
    if proj_token:
        new_token = refresh_token(proj_token, uid, pid)
        print("✅ 刷新后 token:", new_token)
