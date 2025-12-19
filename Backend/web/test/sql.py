from PAT import get, post, put, delete, run_test, show_result

baseUrl = "http://127.0.0.1:8080"

app_token = run_test(
    "App 登录",
    post(f"{baseUrl}/1/1/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "zy"
        }),
    "token"
)

run_test(
    "zy 执行一条Query 请求",
    post(f"{baseUrl}/1/1/api/queries/run-queries",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"},
        body={
             "queries": "SELECT * FROM users;"   
        })
)

show_result()
