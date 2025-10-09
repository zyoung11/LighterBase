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

# 示例调用
if __name__ == "__main__":
    create_user("alice",
                "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                "alice@example.com")
