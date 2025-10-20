import json
import requests
import time
from typing import List, Dict, Optional, Union, Any

HOST = "http://localhost:8080"

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

def admin_list_all_users(token: str) -> List[Dict[str, Any]]:
    url = f"{HOST}/api/users"
    headers = {"Authorization": f"Bearer {token}"}
    print("--- GET /api/users (admin only) ---")
    try:
        resp = requests.get(url, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            print("Total users:", len(data))
            return data
        try:
            print("Error Response:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Error Response (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return []

def admin_get_user_by_id(token: str, user_id: Union[int, str]) -> Optional[Dict[str, Any]]:
    url = f"{HOST}/api/users/{user_id}"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"--- GET /api/users/{user_id} (admin only) ---")
    try:
        resp = requests.get(url, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            user = resp.json()
            print("User details:\n", json.dumps(user, ensure_ascii=False, indent=2))
            return user
        # 400/401/403/404/500
        try:
            print("Error Response:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Error Response (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None

def admin_update_user(token: str, user_id: Union[int, str], user_name: Optional[str] = None, password: Optional[str] = None, user_avatar: Optional[str] = None) -> Optional[Dict[str, Any]]:
    url = f"{HOST}/api/users/{user_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {}
    if user_name is not None:
        payload["user_name"] = user_name
    if password is not None:
        payload["password"] = password
    if user_avatar is not None:
        payload["user_avatar"] = user_avatar

    print(f"--- PUT /api/users/{user_id} (admin only) ---")
    print("Payload:", json.dumps(payload, ensure_ascii=False))
    try:
        resp = requests.put(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            user = resp.json()
            print("Updated user:\n", json.dumps(user, ensure_ascii=False, indent=2))
            return user
        # 400/401/403/500
        try:
            print("Error Response:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Error Response (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None

def admin_delete_user(token: str, user_id: Union[int, str]) -> bool:
    url = f"{HOST}/api/users/{user_id}"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"--- DELETE /api/users/{user_id} (admin only) ---")
    try:
        resp = requests.delete(url, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
            return True
        # 400/401/403/500
        try:
            print("Error Response:\n", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Error Response (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False





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

def create_user_p(name: str, password: str, email: str, user_id: str, project_id: str, user_token: str) -> bool:
    url = f"{HOST}/{user_id}/{project_id}/api/auto/create/users"
    payload = {"name": name, "password_hash": password, "email": email}
    headers = {"Content-Type": "application/json",
                "Authorization": f"Bearer {user_token}"
    }
    print(f"--- Creating user: {name} ---")
    try:
        resp = requests.post(url, json=payload, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 201:
            print("✅ 项目内注册成功")
            return True
        print("Error:", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False
    
    
def login_user_p(name: str, password: str, user_id: str, project_id: str, user_token: str) -> Optional[str]:
    url = f"{HOST}/{user_id}/{project_id}/api/auth/login"
    payload = {"name": name, "password_hash": password}
    headers = {"Content-Type": "application/json",
                "Authorization": f"Bearer {user_token}"
    }
    print(f"--- Logging in user: {name} ---")
    try:
        resp = requests.post(url, json=payload, headers=headers)
        print("Status Code:", resp.status_code)
        body = resp.json()
        print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
        if resp.status_code == 200 and body.get("token"):
            print("✅ 项目内登录成功")
            return body["token"]
        print("❌ 登录失败")
    except Exception as e:
        print("请求异常:", e)
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

    user_token = login(uid, pwd)
    if not user_token:
        print("❌ 登录失败，用户名或密码错误")
    print("✅ 登录成功，token 已拿到：", user_token)

    # ---------- 1. 创建项目 ----------
    proj = project_create(user_token, "demo_proj", description="just for test")
    time.sleep(0.5)
    print("原始返回:", json.dumps(proj, ensure_ascii=False, indent=2))
    if not proj:
        exit("❌ 项目创建失败")
    pid = proj.get("project_id") or proj.get("id")
    if not pid:
        exit("❌ 返回体里找不到项目 id 字段")

    # 2. 建表
    sql_admin_create(
        "CREATE TABLE articles (id SERIAL PRIMARY KEY, title TEXT, body TEXT)",
        user_token, uid, pid
    )

    # 8. 安全策略
    sec_admin_get(user_token, uid, pid)
    sec_admin_update("articles", "true", "true", "true", "true", user_token, uid, pid)
    
    # ---------- 3. 项目维度登录 → 拿项目 token ----------
    new_user = "alice"
    new_pwd  = "123456"
    ok = create_user_p(new_user, new_pwd, "alice@example.com", uid, pid, user_token)
    if not ok:
        exit("❌ 项目内注册 alice 失败")
    proj_token = login_user_p(new_user, new_pwd, uid, pid, user_token)
    if not proj_token:
        exit("❌ 项目内登录 alice 失败")

    # 3. 增
    article_id = create_article({"title": "hello", "body": "world"}, proj_token, uid, pid)
    print("✅ 新文章 id =", article_id)

    # 4. 查
    rows = view_articles(["id", "title"], "id > 0", proj_token, uid, pid, page=1, perpage=5)
    print("✅ 查到的行:", rows)

    # 5. 改
    ok = update_articles({"body": "world updated"}, "id = " + str(article_id), proj_token, uid, pid)
    print("✅ 更新成功" if ok else "❌ 更新失败")

    # 6. 删
    ok = delete_articles("id = " + str(article_id), proj_token, uid, pid)
    print("✅ 删除成功" if ok else "❌ 删除失败")

    # 7. 枚举表
    tbls = query_all_tables(user_token, uid, pid)
    print("✅ 当前项目表列表:", tbls)


    # 9. 项目维度登录 & 刷新
    new_token = refresh_token(proj_token, uid, pid)
    print("✅ 刷新后 token:", new_token)

    # ---------- 10. 管理员获取所有用户 ----------
    print("\n====== 管理员获取所有用户 ======")
    all_users = admin_list_all_users(user_token)        # 当前 token 所属用户需为管理员
    if all_users:
        print("✅ 当前系统用户列表：")
        for u in all_users:
            print(f"  - id={u['user_id']}  name={u['user_name']}  email={u['email']}")
    else:
        print("❌ 获取用户列表失败（可能权限不足或接口异常）")

    # ---------- 11. 管理员获取单个用户 ----------
    print("\n====== 管理员获取单个用户 ======")
    # 先拿到用户列表，再随机查一个
    all_users = admin_list_all_users(user_token)
    if all_users:
        sample = all_users[0]
        uid_to_query = sample["user_id"]
        user_detail = admin_get_user_by_id(user_token, uid_to_query)
        if user_detail:
            print("✅ 单用户查询成功")
        else:
            print("❌ 单用户查询失败")
    else:
        print("❌ 未能获取用户列表，跳过单用户查询")    

    # ---------- 12. 管理员更新单个用户 ----------
    print("\n====== 管理员更新单个用户 ======")
    all_users = admin_list_all_users(user_token)
    if all_users:
        target = all_users[-1]          # 任选一个
        uid_up = target["user_id"]
        updated = admin_update_user(
            token=user_token,
            user_id=uid_up,
            user_name=target["user_name"] + "_v2",
            user_avatar="https://example.com/avatar_v2.png"
        )
        if updated:
            print("✅ 更新成功，最新用户名：", updated["user_name"])
        else:
            print("❌ 更新失败")
    else:
        print("❌ 未能获取用户列表，跳过更新测试")

    # ---------- 13. 管理员删除用户：先建再删 ----------
    print("\n====== 管理员删除用户（先建再删）======")
    zrl_token = register("zrl", "123456", "zrl@example.com")
    if not zrl_token:
        print("❌ 注册 zrl 失败，跳过删除测试")
    else:
        all_users = admin_list_all_users(user_token)
        zrl_user = next((u for u in all_users if u["user_name"] == "zrl"), None)
        if not zrl_user:
            print("❌ 找不到刚注册的 zrl，跳过删除测试")
        else:
            zrl_id = zrl_user["user_id"]
            print(f"准备删除用户 zrl（id={zrl_id}）")
            # 3) 管理员删除
            ok = admin_delete_user(user_token, zrl_id)
            print("✅ 删除成功" if ok else "❌ 删除失败")
            # 4) 再次查询验证
            all_users_after = admin_list_all_users(user_token)
            if not any(u["user_name"] == "zrl" for u in all_users_after):
                print("✅ 已确认 zrl 不再存在于用户列表")
            else:
                print("⚠️  zrl 仍然存在")
