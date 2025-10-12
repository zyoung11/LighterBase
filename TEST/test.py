import requests
import json
import hashlib
import textwrap
from typing import Dict, Any, List, Optional

def create_user(name: str, password_hash: str, email: str) -> None:
    """创建新用户"""
    url = "http://localhost:8080/api/auto/create/users"
    payload = {"name": name, "password_hash": password_hash, "email": email}
    headers = {"Content-Type": "application/json"}
    print(f"--- Creating user: {name} ---")
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", response.status_code)
        try:
            print("Response Body:\n", json.dumps(response.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", response.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def login_user(name: str, password_hash: str):
    url = "http://localhost:8080/api/auth/login"
    payload = {"name": name, "password_hash": password_hash}
    headers = {"Content-Type": "application/json"}
    print(f"--- Logging in user: {name} ---")
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", response.status_code)
        try:
            resp_json = response.json()
            print("Response Body:\n", json.dumps(resp_json, ensure_ascii=False, indent=2))
            if response.ok and resp_json.get("token"):
                token = resp_json["token"]
                print("Successfully logged in and got token.")
                return token
            else:
                print("Login failed or token not found in response.")
                return None
        except ValueError:
            print("Response Body (not json):\n", response.text)
            return None
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
        return None
        
def sql_admin_create(sql: str, token: str) -> None:
    url = "http://localhost:8080/api/create-table/create"
    payload = json.dumps({"sql": sql})
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token          # 变量，不是字面量
    }
    print(f"--- Executing SQL (create): {sql} ---")
    try:
        resp = requests.post(url, data=payload, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            print("Response Body:\n",
                  json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)


def sql_admin_check(ID: str, sql: str, token: str) -> None:
    url = "http://localhost:8080/api/sqls/latest"
    params = {"ID": ID, "sql": sql}
    headers = {"Authorization": "Bearer " + token}   # 变量
    print(f"--- Checking SQL for user ID {ID}: {sql} ---")
    try:
        resp = requests.get(url, params=params, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            print("Response Body:\n",
                  json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def sec_admin_get(token: str) -> None:
            url = "http://localhost:8080/api/security"
            headers = {"Authorization": f"Bearer {token}"}
            print("--- GET /api/security ---")
            try:
                resp = requests.get(url, headers=headers)
                print("Status Code:", resp.status_code)
                try:
                    print("Response Body:\n",
                          json.dumps(resp.json(), ensure_ascii=False, indent=2))
                except ValueError:
                    print("Response Body (not json):\n", resp.text)
            except requests.exceptions.RequestException as e:
                print("请求出错:", e)

def sec_admin_update(table: str,create_where: str,delete_where: str,update_where: str,view_where: str,token: str) -> None:
    url = f"http://localhost:8080/api/security/{table}"
    payload = {
        "create_where": create_where,
        "delete_where": delete_where,
        "update_where": update_where,
        "view_where": view_where
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    print(f"--- Updating security policy for table: {table} ---")
    try:
        resp = requests.put(url, json=payload, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
        else:
            try:
                print("Response Body:\n",
                      json.dumps(resp.json(), ensure_ascii=False, indent=2))
            except ValueError:
                print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def refresh_token(old_token: str) -> str:
    """
    用旧 token 调用 /api/auth/refresh
    成功返回新 token；失败返回 None
    """
    url = "http://localhost:8080/api/auth/refresh"
    headers = {"Authorization": f"Bearer {old_token}"}
    print("--- POST /api/auth/refresh ---")
    try:
        resp = requests.post(url, headers=headers)
        print("Status Code:", resp.status_code)
        try:
            body = resp.json()
            print("Response Body:\n",
                  json.dumps(body, ensure_ascii=False, indent=2))
            if resp.status_code == 200 and body.get("token"):
                print("Successfully refreshed token.")
                return body["token"]     # 新 JWT
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None


def create_article(payload: Dict[str, Any], token: str) -> Optional[str]:
    """
    向 articles 表插入一条记录
    成功返回新记录 id；失败返回 None
    """
    url = "http://localhost:8080/api/auto/create/articles"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    print("--- POST /api/auto/create/articles ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        try:
            body = resp.json()
            print("Response Body:\n",
                  json.dumps(body, ensure_ascii=False, indent=2))
            if resp.status_code == 201 and "id" in body:
                print("Article created successfully.")
                return body["id"]
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None

def delete_articles(where_clause: str, token: str) -> bool:
    url = "http://localhost:8080/api/auto/delete/articles"
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {"WHERE": where_clause}

    print(f"--- DELETE /api/auto/delete/articles ---")
    print(f"WHERE: {where_clause}")

    try:
        resp = requests.delete(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)

        # 204 No Content
        if resp.status_code == 204:
            print("Response Body: null")
            return True

        # 其它状态码统一打印 JSON 错误信息
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)

    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

    return False

def update_articles(set_dict: dict, where_clause: str, token: str) -> bool:
    url = "http://localhost:8080/api/auto/update/articles"
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {"set": set_dict, "WHERE": where_clause}

    print(f"--- PUT /api/auto/update/articles ---")
    print(f"SET: {set_dict}")
    print(f"WHERE: {where_clause}")

    try:
        resp = requests.put(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)

        # 204 No Content
        if resp.status_code == 204:
            print("Response Body: null")
            return True

        # 其它状态码打印 JSON 错误信息
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)

    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

    return False

def view_articles(select_fields: List[str],where_clause: str,token: str,page: int = 1,perpage: int = 30,) -> List[Dict[str, Any]]:
    url = "http://localhost:8080/api/auto/view/articles"
    params = {"page": page, "perpage": perpage}
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    payload = {"SELECT": select_fields, "WHERE": where_clause}

    print("--- Viewing articles ---")
    print(f"SELECT: {select_fields}")
    print(f"WHERE: {where_clause}")
    print(f"page={page}, perpage={perpage}")

    try:
        resp = requests.post(url, params=params, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)

        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items") or []
            total = data.get("totalItems", 0)
            print(f"totalItems={total}, 本页返回 {len(items)} 条")
            return items

        # 非 200 统一打印错误
        try:
            body = resp.json()
            print("Response Body:\n", json.dumps(body, ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

    return []

if __name__ == "__main__":
    # 1. 创建用户
    # 为 alice 提供一个已知的密码哈希 (sha256 of "password123")
    alice_password_hash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
    create_user("alice", alice_password_hash, "alice@example.com")

    # 为 zellij 的密码动态计算哈希值
    zellij_password = "今天天气真好，适合出去走走。"
    zellij_password_hash = hashlib.sha256(zellij_password.encode('utf-8')).hexdigest()
    # 同时修正 zellij 的邮箱地址
    create_user("zellij", zellij_password_hash, "zellij@example.com")

    # 2. 登录 alice 并获取 token
    alice_token = login_user("alice", alice_password_hash)

    # 登录 zellij 并获取 token
    zellij_token = login_user("zellij", zellij_password_hash)

    # 3. 确保 alice 获取到了 token 再执行需要授权的操作
    if alice_token:
        print("\n--- Using Alice's token for admin operations ---")
        
        # 使用 alice 的 token 来执行 SQL
        sql_admin_create('''CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            summary TEXT,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            is_featured INTEGER NOT NULL DEFAULT 0,
            read_count INTEGER NOT NULL DEFAULT 0,
            like_count INTEGER NOT NULL DEFAULT 0,
            tags TEXT,
            cover_url TEXT,
            publish_at TEXT,
            create_at TEXT NOT NULL DEFAULT (datetime('now')),
            update_at TEXT NOT NULL DEFAULT (datetime('now'))
        );''', token=alice_token)

        # 使用 alice 的 token 来检查 SQL (假设 ID 为 1 的用户是 alice)
        # 注意：此功能需要后端修复 `no such table: _sqls_` 的问题才能正常工作
        sql_admin_check(ID="1", sql="CREATE TABLE IF NOT EXISTS t1 (id INT);", token=alice_token)
    else:
        print("\n--- Could not retrieve Alice's token, skipping admin operations ---")
        print("Hint: Check if the backend server is running and if the user 'alice' was created successfully.")

    sec_admin_update(
            table="articles",
            create_where="1=1",               # 示例新规则
            delete_where="user_id = @uid",
            update_where="user_id = @uid",
            view_where="status = 'published'",
            token=alice_token
        )

    alice_token = refresh_token(alice_token)    #token更新

    article_data = {
        "user_id": 1,
        "title": "My First Post",
        "slug": "my-first-post",
        "summary": "简短摘要",
        "content": "小木冰和牛哥爱打交",
        "status": "published",
        "is_featured": 1,
        "tags": "life,tech"
    }

    new_id = create_article(article_data, alice_token)
    print("新文章 id:", new_id)

    ok = delete_articles("slug = 'my-first-post'", alice_token)
    print("删除成功" if ok else "删除失败")

    ok = update_articles(
            {"title": "Updated Title", "read_count": 99},
            "slug = 'my-first-post'",
            alice_token
        )
    print("更新成功" if ok else "更新失败")

    rows = view_articles(
        select_fields=["id", "title", "slug", "read_count"],
        where_clause="status = 'published'",
        token=alice_token,
        page=1,
        perpage=10,
    )
    print("查询结果:", rows)

    
    # =====  zellij 全流程测试  =====
    print("\n" + "="*60)
    print(">>> 现在开始用「普通用户 zellij」重走所有流程 <<<")
    print("="*60)
    
    tokenz = login_user("zellij", zellij_password_hash)
    if not tokenz:
        print("❌ 无法拿到 zellij 的 token，后续测试全部跳过！")
        exit(1)
    
    print("\n---[ 期望 403/401 ]---  zellij 调用 /api/create-table/create")
    sql_admin_create(
        "CREATE TABLE IF NOT EXISTS t_zellij(id INTEGER PRIMARY KEY);",
        token=tokenz
    )
    
    print("\n---[ 期望 403/401 ]---  zellij 调用 /api/security/articles")
    sec_admin_get(tokenz)
    sec_admin_update(
        table="articles",
        create_where="1=0",
        delete_where="1=0",
        update_where="1=0",
        view_where="1=0",
        token=tokenz
    )
    
    article_z = {
        "user_id": 2,
        "title": "Zellij 的日记",
        "slug": "zellij-diary",
        "summary": "普通用户也能写",
        "content": "今天天气真好，适合写代码。",
        "status": "published",
        "tags": "life"
    }
    z_id = create_article(article_z, tokenz)
    print("zellij 创建的文章 id:", z_id)
    
    rows_z = view_articles(
        select_fields=["id", "title", "status", "user_id"],
        where_clause="",
        token=tokenz,
        page=1,
        perpage=5
    )
    print("zellij 查到的文章总数:", len(rows_z))
    
    if z_id:
        ok = update_articles(
            {"title": "Zellij 的日记（修订版）"},
            f"id = '{z_id}' AND user_id = 2",
            tokenz
        )
        print("zellij 更新自己的文章:", "✔️ 成功" if ok else "❌ 失败")
    
    if z_id:
        ok = delete_articles(f"id = '{z_id}' AND user_id = 2", tokenz)
        print("zellij 删除自己的文章:", "✔️ 成功" if ok else "❌ 失败")
    
    print("\n---[ 期望 403/401 或 0 行受影响 ]---  zellij 越权改 alice 的文章")
    ok = update_articles(
        {"title": "篡夺标题"},
        "slug = 'my-first-post' AND user_id = 1",
        tokenz
    )
    print("zellij 越权更新 alice 的文章:", "❌ 成功（异常！）" if ok else "✔️ 被拦截")
    
    new_tokenz = refresh_token(tokenz)
    if new_tokenz:
        tokenz = new_tokenz
    
    print("\n>>> zellij 全流程测试结束，请对比 alice 的日志观察权限差异 <<<")
