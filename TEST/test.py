import requests
import json

def create_user(name: str, password_hash: str, email: str) -> None:
    url = "http://localhost:8080/api/auto/create/users"
    payload = {
        "name": name,
        "password_hash": password_hash,
        "email": email
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)

        print("Status Code:", response.status_code)
        print("Response Body:", response.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

create_user("alice",
                "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                "alice@example.com")

create_user("zellij",
                "今天天气真好，适合出去走走。",
                "163@@.com")




def login_user(name: str, password_hash: str) -> None:
    url = "http://localhost:8080/api/auth/login"
    payload = {
        "name": name,
        "password_hash": password_hash
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)

        print("Status Code:", response.status_code)
        print("Response Body:", response.text)
    except requests.exceptions.RequestException as e:
        print("请求出错:", e)

login_user("alice",
                "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8")

login_user("zellij",
                "今天天气真好，适合出去走走。")
