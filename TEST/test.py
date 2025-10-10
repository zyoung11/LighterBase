import requests
import json
import hashlib

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

def sec_admin_create(table: str,
                     create_where: str,
                     delete_where: str,
                     update_where: str,
                     view_where: str,
                     token: str) -> None:
    url = f"http://localhost:8080/api/security/articles"
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
    print("--- Creating security policy ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        try:
            print("Response Body:\n",
                  json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except ValueError:
            print("Response Body (not json):\n", resp.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

def sec_admin_delete(table: str, token: str) -> None:
    url = f"http://localhost:8080/api/security/articles"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"--- Deleting security policy for table: articles ---")
    try:
        resp = requests.delete(url, headers=headers)
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

def sec_admin_update(table: str,
                     create_where: str,
                     delete_where: str,
                     update_where: str,
                     view_where: str,
                     token: str) -> None:
    url = f"http://localhost:8080/api/security/articles"
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
    print(f"--- Updating security policy for table: articles ---")
    try:
        resp = requests.put(url, data=json.dumps(payload), headers=headers)
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


def create_article(payload: Dict[str, Any], token: str) -> str | None:
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

    # 登录 zellij (此 token 在后续未被使用, 仅作演示)
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

    sec_admin_create(
            table="articles",
            create_where="user_id = ${user_id}",   # 示例规则
            delete_where="user_id = ${user_id}",
            update_where="user_id = ${user_id}",
            view_where="status = 'published' OR user_id = ${user_id}",
            token=alice_token
        )

    if alice_token:
               sec_admin_delete("articles", alice_token)

    sec_admin_update(
            table="articles",
            create_where="1=1",               # 示例新规则
            delete_where="user_id = ${user_id}",
            update_where="user_id = ${user_id}",
            view_where="status = 'published'",
            token=alice_token
        )

    alice_token = refresh_token(alice_token)    #token更新


                        '''增删改查'''
    article_data = {
            "user_id": 1,                       # 作者 id
            "title": "My First Post",
            "slug": "my-first-post",            # 唯一
            "summary": "简短摘要",
            "content": "这里是正文内容……",
            "status": "published",
            "is_featured": 1,
            "tags": "life,tech"
        }
    

        new_id = create_article(article_data, alice_token)
        print("新文章 id:", new_id)

        
