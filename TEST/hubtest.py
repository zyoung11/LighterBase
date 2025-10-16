import requests
import json
import hashlib
import textwrap
from typing import Dict, Any, List, Optional, Union

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
