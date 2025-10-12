"""
test.py
一键完成 users & articles 表的 CRUD、安全策略、token 刷新全流程测试
"""

import hashlib
import json
from typing import Any, Dict, List, Optional

import requests

# ---------- 基础配置 ----------
BASE_URL = "http://localhost:8080"

# ---------- 用户相关 ----------
def create_user(name: str, password_hash: str, email: str) -> None:
    url = f"{BASE_URL}/api/auto/create/users"
    payload = {"name": name, "password_hash": password_hash, "email": email}
    headers = {"Content-Type": "application/json"}
    print(f"--- Creating user: {name} ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)


def login_user(name: str, password_hash: str) -> Optional[str]:
    url = f"{BASE_URL}/api/auth/login"
    payload = {"name": name, "password_hash": password_hash}
    headers = {"Content-Type": "application/json"}
    print(f"--- Logging in user: {name} ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
        if resp.ok:
            token = resp.json().get("token")
            if token:
                print("Got token.")
                return token
        print("Login failed.")
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None


def refresh_token(old_token: str) -> Optional[str]:
    url = f"{BASE_URL}/api/auth/refresh"
    headers = {"Authorization": f"Bearer {old_token}"}
    print("--- Refreshing token ---")
    try:
        resp = requests.post(url, headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
        if resp.ok:
            new_token = resp.json().get("token")
            if new_token:
                print("Token refreshed.")
                return new_token
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None


# ---------- 建表 ----------
def sql_admin_create(sql: str, token: str) -> None:
    url = f"{BASE_URL}/api/create-table/create"
    payload = {"sql": sql}
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    print("--- Creating table ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)


# ---------- 安全策略 ----------
def sec_admin_create(table: str, create_where: str, delete_where: str,
                     update_where: str, view_where: str, token: str) -> None:
    url = f"{BASE_URL}/api/security/{table}"
    payload = {
        "create_where": create_where,
        "delete_where": delete_where,
        "update_where": update_where,
        "view_where": view_where
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    print("--- Creating security policy ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)


def sec_admin_delete(table: str, token: str) -> None:
    url = f"{BASE_URL}/api/security/{table}"
    headers = {"Authorization": f"Bearer {token}"}
    print("--- Deleting security policy ---")
    try:
        resp = requests.delete(url, headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
        else:
            print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)


# ---------- articles CRUD ----------
def create_article(payload: Dict[str, Any], token: str) -> Optional[str]:
    url = f"{BASE_URL}/api/auto/create/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    print("--- Creating article ---")
    try:
        resp = requests.post(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        print_resp(resp)
        if resp.status_code == 201:
            return resp.json().get("id")
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return None


def view_articles(select: List[str], where: str, token: str,
                  page: int = 1, perpage: int = 30) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/api/auto/view/articles"
    params = {"page": page, "perpage": perpage}
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"SELECT": select, "WHERE": where}
    print("--- Viewing articles ---")
    try:
        resp = requests.post(url, params=params, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            print_resp(resp)
            return data.get("items", [])
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return []


def update_articles(set_dict: Dict[str, Any], where: str, token: str) -> bool:
    url = f"{BASE_URL}/api/auto/update/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"set": set_dict, "WHERE": where}
    print("--- Updating articles ---")
    try:
        resp = requests.put(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
            return True
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False


def delete_articles(where: str, token: str) -> bool:
    url = f"{BASE_URL}/api/auto/delete/articles"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {"WHERE": where}
    print("--- Deleting articles ---")
    try:
        resp = requests.delete(url, data=json.dumps(payload), headers=headers)
        print("Status Code:", resp.status_code)
        if resp.status_code == 204:
            print("Response Body: null")
            return True
        print_resp(resp)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)
    return False


# ---------- 工具 ----------
def print_resp(resp: requests.Response) -> None:
    try:
        print(json.dumps(resp.json(), ensure_ascii=False, indent=2))
    except ValueError:
        print(resp.text)


# ---------- 主流程 ----------
if __name__ == "__main__":
    # 1. 建用户
    alice_pwh = hashlib.sha256(b"password123").hexdigest()
    create_user("alice", alice_pwh, "alice@example.com")

    # 2. 登录拿 token
    alice_token = login_user("alice", alice_pwh)
    if not alice_token:
        print("拿不到 token，后面步骤跳过")
        exit(1)

    # 3. 建表
    sql_admin_create("""
        CREATE TABLE IF NOT EXISTS articles (
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
        );
    """, alice_token)

    # 4. 安全策略（示例）
    sec_admin_create(
        "articles",
        "user_id = ${user_id}",
        "user_id = ${user_id}",
        "user_id = ${user_id}",
        "status = 'published' OR user_id = ${user_id}",
        alice_token
    )

    # 5. 新增文章
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

    # 6. 查询
    rows = view_articles(["id", "title", "slug"], "status = 'published'", alice_token, page=1, perpage=10)
    print("查到记录数:", len(rows))

    # 7. 更新
    ok = update_articles({"title": "Updated Title", "read_count": 99}, "slug = 'my-first-post'", alice_token)
    print("更新成功" if ok else "更新失败")

    # 8. 删除
    ok = delete_articles("slug = 'my-first-post'", alice_token)
    print("删除成功" if ok else "删除失败")

    # 9. 刷新 token（演示）
    alice_token = refresh_token(alice_token) or alice_token
