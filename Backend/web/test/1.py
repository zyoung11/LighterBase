from PAT import get, post, run_test, show_result

baseUrl = "http://127.0.0.1:8080"

run_test(
    "注册用户 zy",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "zy",
             "password": "sbdlh",
             "email": "sbdlh@love.com"
         })
)

zy_uid, zy_token = run_test(
    "zy 登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "user_name": "zy",
             "password": "sbdlh"
         }),
    "user.user_id", "token"
)

zy_proj_id1 = run_test(
    "zy 创建项目1",
    post(f"{baseUrl}/api/projects",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
         body={
             "project_name": "1",
             "project_avatar": "",
             "project_description": "this is a blog project"
         }),
    "project_id"
)

run_test(
    "App 注册",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auto/create/users",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "zy",
             "email": "zy@zy.com"
         })
)

app_token = run_test(
    "App 登录",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "zy"
        }),
    "token"
)

run_test(
    "zy 创建表 1",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/create-table/create",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"},
          body={
              	"SQL": '''
              	    CREATE TABLE IF NOT EXISTS test (
                        test_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        test TEXT,
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                    );
              	'''
          })
)

run_test(
    "查看历史SQL记录",
    get(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/sqls/history",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"})
)

show_result()
