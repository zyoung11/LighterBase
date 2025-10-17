import requests, json

HOST = "http://localhost:8080"

def register(user_name: str, password: str, email: str) -> str | None:
    url = f"{HOST}/api/users/register"
    r = requests.post(url, json={"user_name": user_name, "password": password, "email": email})
    print(f"[注册 {user_name}] 状态码: {r.status_code}")
    if r.status_code == 201:
        return r.json().get("token")
    print(f"[注册 {user_name}] 失败: {r.text}")
    return None

def login(user_name: str, password: str) -> str | None:
    url = f"{HOST}/api/users/login"
    r = requests.post(url, json={"user_name": user_name, "password": password})
    print(f"[登录 {user_name}] 状态码: {r.status_code}")
    if r.status_code == 200:
        return r.json().get("token")
    print(f"[登录 {user_name}] 失败: {r.text}")
    return None

def users_get(admin_token: str) -> list | None:
    url = f"{HOST}/api/users"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}" 
    }
    r = requests.get(url, headers=headers)
        print(f"[list_all_users] 状态码: {r.status_code}")
        if r.status_code == 200:
            users = r.json()
            print("用户列表:")
            for u in users:
                print(" -", u["user_name"], f"(id={u['user_id']}, email={u['email']})")
            return users
        print("错误响应:", r.text)
        return None

def user_get(uid: int, token: str) -> dict | None:
            url = f"{HOST}/api/users/{uid}"
            headers = {"Authorization": f"Bearer {token}"}
            r = requests.get(url, headers=headers)
            print(f"[get_user_by_id {uid}] 状态码: {r.status_code}")
            if r.status_code == 200:
                user = r.json()
                print("用户信息:", json.dumps(user, ensure_ascii=False, indent=2))
                return user
            print("错误响应:", r.text)
            return None

def user_update(uid: int, token: str, user_name: str | None = None, password: str | None = None, user_avatar: str | None = None) -> dict | None:
    url = f"{HOST}/api/users/{uid}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {k: v for k, v in {
        "user_name": user_name,
        "password": password,
        "user_avatar": user_avatar
    }.items() if v is not None}

    r = requests.put(url, json=payload, headers=headers)
    print(f"[update_user {uid}] 状态码: {r.status_code}")
    if r.status_code == 200:
        user = r.json()
        print("更新后用户信息:", json.dumps(user, ensure_ascii=False, indent=2))
        return user
    print("错误响应:", r.text)
    return None

def user_delete(uid: int, token: str) -> bool:
    url = f"{HOST}/api/users/{uid}"
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.delete(url, headers=headers)
    print(f"[delete_user {uid}] 状态码: {r.status_code}")
    if r.status_code == 204:
        print(f"用户 {uid} 已删除")
        return True
    print("错误响应:", r.text)
    return False



if __name__ == "__main__":
    users = [
        ("zy",  "123456", "zy@example.com"),
        ("yzm", "abcdef", "yzm@example.com")
    ]

    tokens = {}
    for u, p, e in users:
        tk = register(u, p, e) or login(u, p)
        tokens[u] = tk

    for u, tk in tokens.items():
        print(f"{u} 的 token: {tk}")

    admin_token = login("zy","123456")
    if not admin_token:
        print("管理员登录失败")
        exit(1)

    all_users = users_get(admin_token)
    yzm_info = next((u for u in all_users if u["user_name"] == "yzm"), None)
    if yzm_info:
        user_get(yzm_info["user_id"], admin_token)
    else:
        print("yzm NOT FOUND!💔")

    user_update(yzm["user_id"], admin_token,
        user_avatar="/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wgARCAD6APoDAREAAhEBAxEB/8QAHAABAAICAwEAAAAAAAAAAAAAAAYHBQgBAwQC/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAUGAQMEAgf/2gAMAwEAAhADEAAAAdnQAAAAYjs5oZNx0XluHB9/LjenT07PHZ59e/n25nh6ZLF9swhpGSRfZyyAAAAAAAAIhMx1Y2qEi0twcAAAAAzPF02VV5qwK7Ldnn0AAAAAAMX16KbutciEzHAAAAAAAZrh6blpNjlEV3gAAAACHzMdSd6rPk3awAAAAAAAPrGbVqM9aFVnAAAABBJ+Kpa81r4zgAAAAAAAAAWNWpm4KXYuQAACHzMdRd/q3xnAAAA5Mjzbvbp2Y/o1eDfqAAAAFoVScteoz4AAxfVo13+k0/ybtYAAAn0BK2xU5zOcPVycMRqS5Kjt8BDpiPAAAHJedBtMzhJIACh/oFViEzHAAAC4KfP2nVpwAAcMUvdK7WtlhwAABkOfdsb8zuPq1bAIhMx1D/QKqAAAJrCSV/UG0gAAD4zjXD6PUI9I8gAAAs+qzlsVCfAoL6HU4rLcAAAA2H+d2yWRXeAAABXlhiaPvFaAAAHp1e9lfmF19Or3iOzm1w+m03gAAA+8Z2r+U3jt8+gAAAMN2c+sv02mAAAAXPSLJYFdl61s8LUVyrwAAA7fPraz5RePpkAAADFdWjWL6fS+AAAATOEkr0oFpo2/VeFTkYAAABsp81uOf4OoAAACEzUbQV/qwAAAHs07Nmvll31y+mU3DdvMAAABZtYmbmptiAAAAoK/VaEzcaAAAANj/mdy13+kVDo2eAAAAPvGdgPn1qmERIAAAV5YYmkLxWuAAAAATGGkofMxvAAAAAO/x6uKm2Cxq5MdmMgdHvzVtphKotkF8ZwAAAAB2+fQ6vXkAAAAAZLm3SuK7vbo2Y7o1ROX4PFu1gAAAAAZ7g6/Lt14vq0AAAAezTssWuS8yh5DKcm76xkDjLw79UWlOKuLJEYXt5gAAABfvzy2Vfa4OJTEeAAAJpCyN4Uey+/RtAAAA684qa2wNVWuD4AAAO7x62f+VXirLbBVba4IAACYw8hf3z+1dmMgAAAACpLTCVfaIXz9GkAASiK7r/8AnVtjUrxa+/RaiAAO7x62Y+ZXLK828AAAAD5Og+DXz6LUo5J8XGcAAWzUJ+zqrOcMa5fTKdhu3mAAnsBKXtRbOAAAAB1nwfJ2ldWSHpW61wAD7xnZD5jc8py7xXdkh6cutcAAuWmWGzqzNAAAAAdAO45I9Icmtv0mngATqAlLtotnA6/XnXb6TT8L3cwAu+j2WxK9LAAAAAcHIBiOvn1j+nUwAdvn1sV81uGY4ukAReV4KC+h1T5zgCZwsje9Es/p1+wAAAAAPjOKmtkFVFsggBa9Rn7Qqk4AAKvtUHVFvgAB6NfuSRvXlOXf6dfv6xnnAAAfHrHR7847o0x2S5PBv1ACXw0je1AtP1jIAAFPXSuVzZYcAAAAAAAAACSxnbfPz21+nX7AAAHBVVugKvtcHwAAAAAAAACXw0jd9Ds/p1+wAAAAIZNxtN3auY/o0gAAAAAAdvn1aVTnbOqs39YyAAAAAB5duusbVCV1ZYby7fAAAAAH3jM3gZO1alPZji6QAAAAAAAPNs8Qiei4XORsYleHx7tYAHd49SKN7JhCyM7r8rlOXeAAAAAAAAAAxhnOI7OaoLnX4lMR2Z4uq4KXYZRFd315M5AAAAAH/8QAKRAAAAYCAQIHAAMBAAAAAAAAAQIDBAUGADAgERIQExQVFjFAISIyJf/aAAgBAQABBQLU7lo5jjm6ty4vbpdXFJiVVwy6x/AqihcTk5FLEbTMo42uxsaWKJeZ9/jkrNHsMf2STfZ962UvIR4x1wbLYQ5FS7n8k0jUpWyvZH8EdLvYw8TYGcoGybsKEWDp04eLfhARKMFae7XYbCEeBjGOb8ldsYth+9Fhmwi0DGMc2lGNkHGewzOLMHrfXV57oPKSfpRrR06WeONERU3T4GUJGR4eHTH9din4TFaeReqtTPuLbjZJX3F7orNbKUvIQAwWauA00sXise6auUnjfxs0l6CP0VaJCRfaDkKoWdjBipDRTpLtP42R/wCuk9FYZejiNN0ZAtHaGy52q7Zcjpvks79DHaCl7jJEBNPTMpAtFaac885jl1c9qGhM3YoUeoaZU4JxmmpufIlsty/my+mCdg8itNudg3h9LRb0zrJhTzpXTTJQEV9NrkwfyGpg7TOxXN3raSHMmavzqcqhzs9gKyS1oSZ00NaKyrdWHuCC4EORQvisui3JM3EOhjGObX1Nihe1TY0kXzEUbnLph85f4vcZlUHLx08NtTZHMnJp+VI6WrRy9UY0hY+IVOFRwIOILnssTnssTnssTnssTitZhFseUdEckIeQjB1R8YmLC0o+TM6IKtrSos2LVglpOQihZ2pdgaEkxWVKUCFuzb+3OuQgyzkhCJk2WmDJgh1DlWm3qZjLE09ZE8kkjrqxjBONZ6xHpnXrhygcs6wGMkR/nlSmnRPPvJdkMfIcaazBxKaxNn+vDty7MwUZcSlMc0YzBgx8LhHee240VLo01mDADrnTwsCXnQ3Gpx3qn3ichFSS8ceMe8KQP/L3y/QIrgmmdZSJjyRjLhYIkJRmICUfGtThYldu5QdJ7TGKQtnsaC6PCpQ/bztMF3cUXC7cyNpm0cLdZYMC8yGfOX2fOnufOnufOnufOnufOnufOXufOX+Gu0qOK2ybUxw/eu+NehDSi4ABQ52Oui2H8sLCrSyzdui1R0feT1XEPyQleXlDN26LVHXM1ptI48Yuo9XemmoseHqXbhSgUNrlq3dpSVOOXF2zhqfWUpjmjqm+dZHxLGMJ+Fds3dEeU5itjmpyyGLNHTbkmkqsLatzDnGlKTDGcYxYB+d2wYnJKIIJnH/TJNMx42PYCQpSkDb/AP/EADMRAAECBAMECQUAAwEAAAAAAAECAwAEBRESITATIDEyFBUiI0BBUVKREDNCYYFDU3Gx/9oACAEDAQE/AdJ2aZY51Q5WUj7aYXVZhXDKFTb6uKzBWpXE/QKI4QmZeTwUYRU5lHneG6z/ALE/ENVCXd4G3/fCTFSZYyGZh+ovvedhqMzbzHIYl6sheTuUJUFC4135huXTiWYmqi5MdkZDwEvNOSx7BiVn25nLgdWdn0y3ZTmqHHVvKxLOfggbZiJKp37t/wCdOfn9h3bfN/5BJUbnwtPqGz7p3hoz870ZOFPMYJKjc6SZd1fKkx0KY9hhbLjfMk6dMnrdy5/N+YfTLtlaoddU8srVx0ZWmLe7TmQhmTZY5RuPSDD/ABETVPclu0MxpU6b6QjCrmG9UZrpDlhwGjTqfYbV3+b/ABioyGy71vhosPKYWHEw24HUBafPcqUxsGbDidGmy23cxK4DRIChYxOy/RnSny0aRMWJZP8ANyov7Z8+g0ac1spcfvPSq7WNraemi2stLCx5Q2sOICx5/Sad2DKl6IFzaEjCLaU2nEwsfrSpDuJotny+lZcslLeik2N9OZOFlR/R0qW5gmLev0qq8Uxb00pN3asJVpVRzBLkeuk0vZuBXp9JxWJ9Z/elSZnCrYq89KpzG3dwjgNNhwKaST6CFm6idIEpNxEjOiZTY82hUZ7YjZI5tREyUpA1ELU2cSeMStVSvsvZGAQrMbilpQLqMTdV/Fj5gknM6lzChY21Wn3GeQ2hNWfTxsY65d9ohdVmFcMocdW6brN9ZLJIvEynC8ofs6TbS3jhQLwzR1H7phFMl0eV46GwPwEdEY9gjojHsEdEY9gjojHsEKp0sr8YdoyT9tUPyjsvzjTYlxsk39BFTRgmT+9GSp6pntKyTDTKGU4UDSIChYxO0u3bY+NFKcagkQBYWist8rmhISfSV3VyiAAkWGrUZEfeR/YUL79Ob2kwn9fSoNbZgjfSkrVhES7Il2wga3HKJ1oy72EcIOe9RmslO/WbZ2DxRvUlrG9iPl4CsNYmw56bwFzYRLM7BoI+tWl8aNqPLeoye7UrwE8nFLrG9Spfau7Q8BuKSFCxialzLOlG7R/sn/vgJr7C/wDh3UpKzhESrAlmgjdn5XpLeXEQRbI7lPnOiqsrgYQ4lwYkm+sSBmYqNQStOya/u7SpS3fr/m/U5K/ft/3dQtTZuk2hNSmU/lAq749I65d9ojrlz2iOuXPaI65c9ojrlz2iOuXPaI65c9ojrlz2iOuXfaINYfPkIVVJlXnDjzjvOb7shJGZViVyiALZDQqNP2fetcPDScmqaV+obbS0nAnhpT1M/wAjPx4STkFTJxKyTDbaWk4UcNScpyJjtJyVDzC2FYVjwCUlZsmJSlW7b/xAFshrONodGFYiYpBGbJ/kLbW0bLFtQAnIRL0t13NzIQxKtSw7A8EttDgssXh6kNLzbNocpcwjhnC2XG+YW3koUrlEN06Yc/G0NUYf5VfENSzTHIPEOsNKFykfETKEpOQgwykE5xLy7WG+EfEAAcNb/8QAPREAAAQDAggMBQQDAQAAAAAAAQIDBAAFERIwBhMgISIxMkEUFkBRUmFxgZGhsdEQFTNC8CNTweEkQ3I0/9oACAECAQE/AbpvL3Lr6RIQwZUHOsenZnhLB5mntVHv9oJLWieymHhBUiF2Q+AkKbWEHYtlNpMPAIVkTFT7adgwtgwH+k/jDiTvG2cS1Dqzxq5Gykjl3pG0S9cNJK1a56Wh67x1Lmzz6pe/fDzB1VLSbjaDm3wYhiDZMFBv2jJZ6ewkEMJKgz0jaRvzVyB5L0HxaKhn598TCULMNLWXn972Vyc74bZ8xPXshBBNsTFpBQORCAGCgxNZDZqs18Pa7k8nF2OOW2PX+oKUChZLyWcSbHVXbhpbw5/7jVcSiVi+PbPsB59UFKBQslulHjdLbOAd8fNGf7gQm6QW+mcB77ueymtXSIdofz75bJod6sCRIQQI2TBJPUFzMJ8k10EdI3lDmZOXf1DZshrNnTTZNUOYYl85RfaA6Jub2up1LeBK4wmwby6sqSsOBoWjbRvylzOpwJhFs3HNvHL1Z4ks4x/+Ovtbh57l02I7SFE++F0TN1BSPrDIkjLhbm0bZLn9rmeP+CIWCbRrkphKNoIlb3hzcD799zhGyqUHRewciStOCtQrrNnuZ044Q8NzBmusHHGLcijuN/FyskVdMUjahhZIyCgpm1h8Je34U5IlcmGyFYMYTmEw3UuPi3aZusLrCNti1wWD7vUPhgyhaUOsO7N43JwtFEIEKZrpiW26TL1h63U/QxrMTdHP8MHksWztc4j7XUzQ4O7OTr9bqQIY54BujnunCWOSMnzh8JaTFtEy9QXWEbLGEByTdr7LqRMuCt7Zto34F27biVc5Q5x9YSLZIBboxQMFkYm0sMwUtF2B/KXEllQuTY9UNEPO8VYgc4mvFEyLFEhwqEP8H1EtNtnDm3/3BiiUaGyE0zqmskCoxLsHhrjHfh7wAAUKBeUCCDaKA3q7RB19UtYUwdaG2ahHFlDpjCeDzMm1Ue+EW6TcKJFpfHdAUwhDE+MbJm6g9LpZwk2LbVGgQ5wlIXM3LXrGFZ69U1Gp2QMyeD/sHxj5i7/cHxj5i7/cHxj5i7/cHxj5i7/cHxhOcvk/vhvhMcMy5K9kNJg3eh+kbPzb7t29Nwg9OcfWJErjGJeqoXM0nBGP6ZM5/Tthw5VdHtqjUbophINouuJXPrQgi78fe5UOCZBOO6DGtDUYwYWzHR77icTLgCdkm2P5WDGE42ja72STU2ZqqPZ7QQ1By50tiWR+vN8JO44M8KI6hzeOWocqRRObUEPHRniwrG33wDQahErcA9bAoOvfABQKZWEzipiIB2/DVEudcMbFV37+3KwicYpriw+7kGDbiwuZEfu/jKEQKFRh84F24Mrz/HB15ilRbm1G1duVhOeqxCdX56cglR8W9THr9c2VhA8xDfFF1m9MghhIYDF1hEveFfIAqGvf25OEv/qL/wA/yPIGGd0n/wBB65JzlTKJzagiYOxeriqPd2ZMomHAVtLZHX7wAgYKhkTmWC/TAye0EKoqIGsqBQb4AEw0CJLJ1Ezg5XClNQZOEExr/iJ9/tlyKa2f8VYez2yVEU1gooFYUkjFT7KdkGwbaDqEfzujiy36Y+UcWUOmMcWUOmPlHFlDpj5RxZQ6Y+UcWUOmPlHFlDpj5RxZQ6YxxZb9MfKAwaahrEfzugkhYk+2vfCLVFv9IoBkziZgxTsE2x8uuBETDUbiTTgFgBuuOluHn/vk0zmacvJzmHUELLHXOKig5xupVPa0RdD3+/vySZzdNiFgmc/p2wssdc4qKDURvJbOlWWgppE9OyGzpF2S2iNeQHOVMto40CJlhBX9Np4+0CImGo3yK6jc1tIaDDLCMB0XQd4QksmuW0mNQvBEChUYeT9u30UtIfKHkwXejVUe7dyJJZRAbSY0GG2Ea6eZYLXkMIT9mrtDZ7YScJLfTMA5R1CJhU40hadMkfvr2Z4cYTGHMgTxhy9cOx/WNXk4Qg7XKahTj4jDJU5i6QwGqHJzFDMMPXbi1S2PiMCImzjff//EAEcQAAECAgMJDAgEBAcAAAAAAAECAwAEESEwBRITICIxQVFxECMyNEBCUmFykcHRJDVTYoGhseEUM4KTFZKy8ENjc4OiwvH/2gAIAQEABj8CsvSZpCT0c57oolJRa+tZoje1Nsj3UecZd0H/AILo+kZby1bVbmStQ2GN7n5gf7hiuZDg1LSIom5IbWz4GKEzIbV0XMmKRyMtoVh3RzUZhtMFOFwLfRbq+dp6NMqCega0wG59GBV0xWn7QHG1hSTmINvhZpyjUnSqC22cAx0Ums7TyC+lncnSg8ExeflP+zOnZa4FqhyZPN0J2wX5lwrWdJ5EFJNBGYiEyl01V5ku+dmZSUIMwc56H3grWoqUayTyVMjPrpZzIWeZ9opsMEyQZlwZPujXBWtRKlVkmypZkn1jWEGPVz/8sb/KPN9pBFmm5k4urM0o/wBOOuad0cEdI6oXMvqpWs02IfmyWGTm6SoH4eVTfdNVasQ38uELPPbqMF5O/MdMDNtssA+r0hkV+8NeNg21bwxkp6zpNim6N0G6VGtts6Os49BFUG6Eijeeegczr2WLc0znQc2saoRMsmlDgpGIUNqodfyE9Q0mxwrqaWZfKPWdAsShYpSoUEQtgflqym9liu5jiqlZbe3SMRd6d7Z3tPjYs1ZT2+q+P2oskzYGVLq/4n+xYtzDZym1XwhuYb4LiQobj8zpSnJ26LEJGk0QltOZIoFlNoPsVH5WS5RRrYVVsP8AZ3GJQHhqKz8P/bFK9RpgGymlnQyv6WSWyan0lHjuFvQ0hKfHxspZ6mu8vVbRVZLbpyn1BA+psmZj2awrcm1/5qh3VWS7muqyXcpvtWWCaVS1L5I6zps5dalVqaQT3Q4vpKJsgtCqFJNIIi8cITMoGUnX1iwMjKL9IWMojmDztG0U8FIFol5hwoWmsEQGLp0NOe05p8oC21BSTmIxC6+4lCBnKjRBl7k7C8fCCtZJJrJNqpOo0WtMpNON9QNXdFDgZc2p8o4ox84oQpprso84v5qYW6feNslVGcUxNN6nl/WywMqypxXVAVPzIb9xus98VyxcOtajFVzpf+SPV0v+2I9XS/7Yj1dL/tiPVsv+2IrkUp7BIimRmlJPRcrEelMEJ0LFaTZyxUK8Cinuh46HAlY7rHDvUtS2vSrZAYlGUtpGrTZFDiQpJzgiFTdyk1Z1M+VihpOdagkQEDMBREvNga2z9R42F+6D+Ha4fvHVAbQkJSkUAC1VdSURR7VP/awYqqb3w/D70bjyQMpG+J+GOhloUrWQkDrhuUb5orOs6Ta1mCFCkGoiFsJ/LOW32cd+eUOFvafHcoMPS1GSDSjs42HUKpdF98TUPG0oEVRTFJhqcSK2VXp2HGCEikmoQzKjmJr26d1M+2MpmpXZxpl7pOBPcPvaUjcp3JtOpsq7q8b8Usb3L1/q0Yim3E0pUKCIXLHg50HWnFd/1z9ByCcp9gv6YqWm03ylmgCESyeFnWdasXIG/tVtnX1QUqFBFRxFNv04B7hUc064Dsu8lxJ0pNtfLUABpMKudILv778xwZqNQxf4pMJrNTIP1xzdOURX/ipH9WLfy7y2zrSaIo/GX/bSDGU3Lq/SfOK5SX+fnHE2PnHEme8xxJnvMcSZ7zHEme8xxJnvMcTY7zHFJf5xksy4/SfOKphKOygR6TNOOdpWLhXh6M2cr3jqgJSKAKhYKn5FG8mtaBzPtybSllPDX4CEy7CL1CBQBY1wqcuYirOpoeHJA87S3LDnaVbISxLthCE5gLQvsUMzGvQrbGBmmig6NR2cgDbSCtSswAgTF1KzoZ84CUigDMBbFmZaS4g6DBcuY5fD2a8/fGDmGVNq1KFpeoSSToEBc16O318Lui9lmsrSs8I8iwcwyhxOpQgqlHVsHVwkxS2hD49xXnHpEs632kkY1602pZ1JFMcVLY1uG9i+npoq91ur5xRKyyUdenv5QVLkmFHWWxBwbKE7E7gvkJO0RfGRl6deDEUISAOq2//EACkQAQABAgMHBQEBAQAAAAAAAAERACEwMUEgUWFxgZGhELHB0fBA4fH/2gAIAQEAAT8hwp0E6Hwr1Ovd0PYl9qkzmyfdTuv0Q9oU3LXGal30jPPQpfIdCHtNRUG1LyQ+aBCm+P8AjnUQ88R3y80IJBHU/jXyKSXOxSwTOk45mlVKyuGegHFOjTcv2zX58qOl8ywnPHj9nlXbgUy4lso/i2X8EnE2b/o/JRKdi6+TX3xWMaWl1fpWat3Q4G4/ifm6UQjUsczPJ4fehEkwirvvw0fkMhKv8qwE+CP5FCACI5JgZMwnm/FP8RQlXfhBCxqx3qAmoXJhqJhpeDdsuL47bd/vLLfRpeRU4cDhg3/SCLXA069qtk2hN1fio9EJCZ0iftiyetD2PxXL055YIoyMJWZQBLPT+/8Au07SkYcv0xwwctw9sdC37t224MqyOtW2k8Y3PyPbAerOOjWXMqAePC4czYa6hgz+g98HKWQuX7HpxoywAvsIyR0oAnMnf06ZYOsES6fQv0djO74HN3nxglKiUnhhFofZei+cFD2J0KWOeqB6R4w05tvJpVZWVwGzsQoLIGXAMIisxcyR5MK8RM7v39Gb8R4CDz4YMxafY0BjZJwkEz3nhLHDDnk9vPpBz5a4ReYI729sIgw5JT7BHXCcR+HZoRJHOr4zaclD2wokS3tCXOp7YWao3MtX8dMM33WhNK7n3VwkvEIXEyaJbuKjgUwyA7O+WIIbezlOd8N8ly8JWhIgef8ADlQgRlEibGQRVAUiWVsERy/LSAXkJVxCK1I3r+WLvAFuHPJQjiNx8irGtz+9KuKZn3VuKLKxyNMYV2nk4VazKHKcYQ1f0OXFdOtAS5oeRb3oMiWreCCio6ouw444vZpDER3+wtFulQeQueagLhjyR94d4xTmjVlI6oQfI4JdQOno/etAgQut65rhG1mJYTiUagicx1+vbdSIwkJgeepBYq0aIcit4wXgCEY0rsH5qNUAIAxXQGo9eT371GRe1nbgDJ32noXTj6lz4nb40WyTBUFv6s44mWCVoL1Iz3UEUMooEkuG9fTJ0pSWM9rVgC8C/wAO3ogEJGyVbI5mVz66bSGcwfoy8MTRL1aBalxaMgZ5RQls3LhWcQ5+9Q77TAlgGq1BVIT3u67+qy7l+r16Pu7QQN53hJiI2Cm4NTnQBYXc/QlSe6/5bT3/AGc6v4Z9tgyjzskc6kZc/wBbL66bJQDckxNBzoAserQUHy9lowhs1cqhOQRdbN+OmyqCueY6/eKfouBLjsA6opXIZQ96yM1SMZ9eMpAUZQW/7A4uy4y4gaa/E67bX8STZm5899njc9rxQUIPyMTXmwL2oHMcqt93vvtCCCCCfufmnT63+698MoOgr+0zTM8LRO2WzIaXTwfmj6DgMg20mzUxCwmbefkfzQcl8v8A6NE6jBgoBBI5lKyi4Nx+vakRhIT+MIHLw6H3ochxiC40XSdt8+9PdXTk71r/AAKdqJZXlRo5mAydfwUHM0AgDG0EYPk3Nb0UmgctXWmZruGIAY0AStN3feDLPZ1qIMRF71fg/iYuG8VKAdXyX81NhOtztCno/Bl9rjl8rxUIjf8AxM/FRO8hQ7vqpKrWMvqv/OgkJUf65i+1CAXCKJookN4DR1DfT+1QyLQQY3//2gAMAwEAAgADAAAAEJJJJJGoMQEp5JJJJJJJJLL/AP8A/wD/AHWSSSSSSST/AP8A/wD/AP8A+3JJJJJJ/wD/AP8A/wD/AP8A/wDYSSSST3//AP8A/wD/AP8A/wD8aSSSa/8A/wD+6Z//AP8A/wD5JJN//wD/APjkuP8A/wD/AJUkgn//AP8AkSSRn/8A/wDw5Jf/AP8A/wAJJJIt/wD/AP6kg/8A/wD9ySSSQf8A/wD/AMRn/wD/AOLJJJJF/wD/AP8A3F//AP8A48kkkkr/AP8A/wDmn/8A/wD+SSSST/8A/wD/AM8f/wD/AP2JJJIB/wD/AP8A+d//AP8A/tEkkgf/AP8A/wDwP/8A/wD/ANekkg//AP8A/wDrH/8A/wD/AP6Lx/8A/wD/AP8A+R//AP8A/wCi/wDyqf8A/wD/AP8AX/8A/wD2iSSSTU3/AP8A2x//AP8AOkkkkkgy/wD/AO6f/wD/APJJJJJAUN//AMzz/wD/ABJJJJIAIP8A/jSX/wD7kkkkklgg/wD+5JX/AP6SSSSSQSH/APBkke//AEJJJJJBIv8A8SSSb/8AlRjbbVHv/wDLJJID/wD/AP8A/wD/AP8A/wD8aSSSTE//AP8A/wD/AP8A/wDzSSSSSRD/AP8A/wD/AP8A+BZJJJJJI0//AP8A/wD+GZJJJJJJJJnD9/3bpJJJJJJJJJJw9515JJJJJP/EACkRAQAAAggGAwEBAAAAAAAAAAEAESEwMUFRYXHRIIGRobHBQOHwEPH/2gAIAQMBAT8QqrMBwtehTFFI5tG8W7NBvOPbhPEot6dWJxS6SLD3Ni0OcH094azmr07xRM1hQ+u8CNJ8OcNlFnNiYmgKO9sLO2rZpZYNJ0iXnPjdud4BPMbyvo0sC90idaOWur6s+BNlBeNjBPSvpv8ANaPyC412hhPL4SOZJijpTdu361ZlSav/AC3xDhZr8VULlcMnLxpAzpKgtMMjHaHCTWqLmrkx/gRY01GrmBqL3rbpx3aVhi4frpwgc1Unnu3bn0gCjni0vV/qTghZbiUP3zieaiXanuypFKSKe/YY78VI92Zt7UgRTWkYZueGHGgJMDMecwzMvGllRaMHcvIssBPgVFuT21Jyy/c2491LgJjCi2qTT6sqbkbT7HvrwUEbg5W96k6LTSc7O0qoRFr7NHmVTbwqcWaIH+Y4BRq0ELOlqJFigRFgVQMYuxOqv4Ps/c/5JS9m8v8AamR4GBmTKrJbwNVLnYU9njv/ACfYQe/dUV8Sk6lDVHfLD29iXOqYO8PeCSTjUwdGXqqJ0opGuHM8VQzW553vqrUalTsRnarVGGkkTOyFpjmfqKglWlbkb1hFuAhpqwKyFjBRqlzrh4gybM4GRgxaIGT+2R7YRUmtYQTvA1q038OlkHS5w2SPwO8CyRoN5xNzWbXDwWkZX+SqnlLL9RzgEZORS9bPMW1zl/yCzdAj/MI/zCP8whfYIJpJpM8RSDDg09/9hO6xu671b5an0ETDke0vJUo84vdN4DSx+txqnATGAKVF+zbphCSoahrQKHWDIXRTlmPk91Da0Z5bwYOQVtMPR73iSE45eupdPuX8ktaUnL6nxmhmrI5xcx25t7XICayHWcNHayFNPiksvoPL66fxJkmFuqczRs4hu4z5tB7+AA1qlyfuXEhWjAB3FOt/f+y86ben0+eKViEOh9/A0cn0p9cVAO7d0t4ERzGhhgWWjicMrrPB8BSmfg4QozWggw23uL+s4Rol8ezn5lCNtDgNc+ycd/qJXQyrgZkiErTnau0Pbvw2I/L9ubx08KbnvfrjwzYlkyiiaWoMWoLk7wBb3N4/Yx+hj9DH6GP0MfoY/Yw3Hc3iwA5O8WATQItd1PDKZiZ5bwBLAqEaWcwzMvGnxsPm19GcARkLKlBJMITGi/Zt0hJUPwzmoY6bwEKQurJj6x13igyezo/AClNbiKJ+Ge3eAIEgrnYEi3MYvTvE8xZ1iMibEk910u5xLFNe3vPaXwpagzIpAPqb94p0hyfTKEJPqE4kZIuROLPkYtH32gtMzLc7EESMzv62/GYSdDCFZzG0LAjQi1BYAw0UrRtAshIgrf/EACkRAQABAQYFBQEBAQAAAAAAAAERACExQVFhcTCBkaHBIECx0fDxEOH/2gAIAQIBAT8Q4Vtomdx1YKgwaBLqwfNXEXWHhXzTD3ZasMTYCoKIgnlV5X8XxNC2N5odmTtTJeWPJ9VOQzHwXnMpFQ+zhAkxvOxe9igzdbXQuPnWgCw4YDDOSzqPNlTmuFnJg9tqZqC8SE49rnm4G7+XAqNPVbjZhvft7DbhCwc/DZSTybDZg9tcOKGmLHHR5NxrQwIZfLm6+ycDI4NQA2Xvn9OmVXWPCBBAuMV+WvIoOEBYBcHtTMJeDuPyd70VDwImwturJ5cDeg4QFgFwcJSFtR90Kx36YhDQPnhgbWLSx0fmefrxFr3Ixf17BRGQEf8AXVx4KCUHQ747HWmmXQWHQ8z/AKMMlLAgah9nJqG3Vc7sdr9+Cg2NWQ5GrHZiaSYeqOO6XQw5MdduDCQFgY5hpm43XX+oVAvKaL/gh11x3v4F04OjgmzR+wkP3s3noiAxWrg627HBacvw0MXwbzhwQawjI5JQL3bNx938GKNp0MHk2cz0WDYznccjvPBe04Plf3nhKw2D1tfE9uDduqdavzxHl/k+XLLsWvYoIIOAKPC2r4BV68JQv+Sw9nhRMsFvQ+I/wMEAb2nsd+DqiJSJWHCQDH4nCim9HJc/M8v8gcTOj9OEzd0k2tHzHCVEsCvg7s8uET+MdSKhLGt1rqS93hKats/A8l76cJ42LV0MHnnww8sC6KoOwA6HCRjIkJmNLAlLHLV4zOAZt1YOI8GOd2fESxer1aLuGZZLxpx+PNsnfe+kxImDY+gU9MAlqA5R8vBzcKMHAXBxGSoRxDimQetLet/el5W2ydx+at/p+qbkbtjsFQ2HQjrnz40kblK1l+JPfhRF63jFdClHpQdC3uUvYnIB3Ze9Ky9dX9dX9dX9dQf3qUkbuD8lJghnYejI9SpZNiVg5eSThnN2WXVUVm19Bk7JwR2FsMNX0vziykD0zw0C4NuEFRBclic6VBbcfrv1zoZJOBcKBXkTSLfLLUq3IfD44Ayk3Ohm8ZuzS1JVqt68XANc8eb46ZVLDZp654Ntlzv7T/k5sR8OjD61LgFXQrG9WGQXHT74yEkJTgzd0J92POoj1JRXWudh56/4KpKCSuRsWP3t6lJbXHItfBs+wZFYJN/sL0PU6eAJdilHcrNiw7R/pocTYw5ncPUuRp6sewOHiD8b+oZrD2xdbuvoXKEkckrSMDIX/Zo+kI2j2AUZ+R6WRgFXQq58uGQu+3VfShyw9GXJ8TpRhpG09Ggh6jhpmf8AaQPDBI4xo5XAqYkvF85uUYF822R6Tcthf1w8nWDB9ZQsmN+Xjpl6YhRqD80pNpqTtMdquI8zzRwfy2p/k/Vfy6fy6fy6fy6fy6fpPqjE/Lar6fMpbC9y8RQUbKA9b/TKmRs0ZvGbpThpW/13WlWaJYnY/k73+1kL+RLp83FSNL5/YZZcEUZKIWtcP4/GudCJJ7N3A+GGr6XuhWJyT+w0w4kIWhjuZaNmSVCiO5uXnsFRAvVgpS2Rjj5MN23IL6cLK48Y+0MTzgmjUPEeRzL+nSo19JniOngMWwox5Pc548utXHOAsHLyy6+ynPzhiocIz+iztUKMtFnUnvFDztqPx6oFRmofNToy5eS7vUxC1U9j7alCjK46Fntms1FgzIDzR5V3VpMqYzGzR2Y8rD5q3WXXjf/EACgQAQABAgUEAgMBAQEAAAAAAAERACExQVFhcTCBkaEgwRBA8LHR4f/aAAgBAQABPxDpHBVn/wAo7hTBCsctkgc0YQmAUXL9Qp8oMXlwHqnyFipvlpRlS80KQGCp6aOJuBLyQ9UyMgGvILRQ9tKo4kq/HSB3dBXvCo6EJEkTX9O8ISK6C6OCXUKZBNBWWj7INqcuRKrKuvTnkKVOJhHJDvVlRrhGqf8ABuVCYljXgWeuyhhtxMs/lgM0qaPEhwK7OiNjjXPXLQgk+ZOzwO9GsjItsxbUdrDSL9U3JjcAlnPIbuxekVncWGQYBkFv0jqSYBXES470DGYsa4Gi+OutAEESRMHpQ2ShCRi5KMDLFyF1g1izKq3Vf1UeiKSvAfPS/wCMDJgKJE1OhPiDCTAQ8gcXYadEkxNlS4q9EFYCVq6XQTfCPdMxi2a+KXY6vOCR05/6mLuSOTny2RHyVAAjwSMXOK5AuVItcXIZBkCANDoba0I/hs9Yli63bsatQe4ka3k8CgGH4TCSxEkaI7jBBuqB4TU8ipYx92GyeGHRBORIjCOpU0FIrQ7iWN0PxLF6vnwLERuSkbA5vRLaQlGIQxeIcEOMQAEGB8ggKgSBxEzKmFkzWRwdTiZnR6Jy4eRCLbSQ94lTGDGcsVokiZI/C6oTUQLXCgdQ5dFSOJeVrPqWUaQaAABEdA2OHyNCjMRp7QselmE5qFcTn0VzywwC1yIH+nwUM9Y2zNh5xtDom8Eo11Il4A5npBywLvIF7/PRnrVJsqmHZJHZa4hKoBh3MHc/Bgso/wC6B7NInIlVlXoezgBYrYQJAAPB0pHkBjPes6T2XdW94HY+R+HhALOWB2UeiHDD/YfqgLIgmY9I1gBTm2DzTj0YUi6bRJeZifgskiTIBb6nbpZrOy+Y8suE6UCNMN8Y4lXDpNSF6Mw0dwSgREEjOJTqQL259A6RQp4VoDt4m+toZJOgoY0lIRxK2ztIDaefSxq4oBJMg+2nZlU6qv30oGnHFpByRBo/ZiYhWgzHMydooZJ+Zz2phCvfIMDIZ0pVZWVz6bjgYTkJ9UlTiWXpgIXJD/zJMExpbRgRf119fbBR4MF3sESyfADOTy5KxT2Eq8DOe87RsNmn0vWJMqrdVz6bQgSgIL0SEKRoiOrB8LI1tUl9ygyJn33B6psw9X0UAJJFk92fVRvy6N5lhsB1mxoJzCGnVgEOR6J0rpGmeHsBugoWxBQFs2DwDeirEyQ9z0UBijUvKTX9f9V/X/Vf1/1Q9gdj6piEzqdgPVXX/R22iORKZjHCWUGwukHbplTJEM0vukE5goE6Pik3TBzEG0ZLsZCzFxgTgBiu6Vag06LvXmHsRLJs0XWR1QYqt3n9KInIhEhHoEMpEaIe2hhQiOAQeimLOjrMYPfj0HhnhkzFb4rI3SgV2OBkABgB1GM6FWBiSBmB6Z91X0skGDqVh8lnQLoGX5fg0b2YS4Ybsff5uxDbEIPKUNKJjIXunMuCDLqShmGMPdImMyEwKcA/mnM+BJez2b0eUgDZqhyHlZ1gqlMafJYBXQ3Y2VPd+DoAUYI5VOwoifZYGW6+V4bwJP8AsFyOpJKsYLhJVidKzZzKNjL7uJGUczTKMwYCj+2qMqL8ReXyEy9UqIA3VoULOv8A0BPb85QNq6bd3PGh8rHm8AweX1I4BcgynipuC4kmYoNRGSM4/FiUA4D7+VHbpBbCPbmavgQDY5GgPItD7M1wM+SFbr4pOMGzMLqGgJBGgYAPyYTEH44m6/laAcrVg7SZB4iw2HxPGJSzZedIEaBYTT08wYTCI4I/BETRFzA5iGAXiEmIRofIp4Ywdm/Uk1/Ai9RYNVbFKZcZwmZtSEFosTLHwBxboQVoXUnYlmPzBzgsFkGYeHL4iiHMrlRNAEDkm8r/AEqNIfNR8FCBww/aj6lU/mfuv5n7r+Z+6/mfuv5n7pjt3qCcN3frVh4f/dXJCwFOEL3UT/MhTxKHY+JwOG+RXE8SMDdKOnkOAEAGQHzAICJCOdIrYyZTEzNmf4w/VOgPyAY3MU7BdyEVetHzVzVlVuqvRMoBEJEcRpnM46+dPM9fARORCJCOn6d8kDhDiTjo4TdtUSzXW3VxVxVuvUmQYwBtrB231KHHcoJBkbDjDOH9Ag1H2nAu0GrRGxyis+LVblB0kQCsAFg62JlyTDqY7gjTxl+D2GHwhy1jltS3cmybluoejClGgF1pV7BcAv8ARHDV1NRd5lOA2/SyQLMm5ODuXpqVZMY4QfLinMKIRHeZOxNPWoxIjwiH5DHxg8JBaXiwtAcupRnL9jGVTgNFovjyvIuJj9YxpkBGZEtUiAG7XLKgSpsB+ijQAEtop3oSQR8lFcBIl5XUZbkBQ7HW/9k=")

    zrl_token = register("zrl", "zrl123", "zrl@example.com")
        if not zrl_token:
            print("新建 zrl 失败，跳过删除")
            exit(1)
        all_users = users_get(admin_token)
        zrl_info = next((u for u in all_users if u["user_name"] == "zrl"), None)
        if not zrl_info:
            print("列表里没找到 zrl")
            exit(1)
        user_delete(zrl_info["user_id"], admin_token)

        
