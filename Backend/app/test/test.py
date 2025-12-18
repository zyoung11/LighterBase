from PAT import get, post, put, run_test, print_info, show_result

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

run_test(
    "注册用户 yzm",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "yzm",
             "password": "yzm666",
             "email": "yzm@notgay.com"
         },
     should_fail=True)
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

zy_proj_id2 = run_test(
    "zy 创建项目2",
    post(f"{baseUrl}/api/projects",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
         body={
             "project_name": "2",
             "project_avatar": "",
             "project_description": "this is a blog project"
         }),
    "project_id"
)

run_test(
    "获取 zy 项目",
    get(f"{baseUrl}/api/projects",
        key=zy_token)
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

run_test(
    "App 注册",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auto/create/users",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "zy",
             "email": "zy@zy.com"
         },
     should_fail=True)
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
    "App 修改管理员密码",
    put(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auto/update/users",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"},
         body={
             "set": {
                 "password_hash": "123"
             },
             "WHERE": "id=1"
         })     
)

run_test(
    "App 修改密码后登录 错误示例",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "zy"
        },
    should_fail=True)
)

run_test(
    "App 修改密码后登录",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "zy",
             "password_hash": "123"
        })
)

print_info(
    "info",
    {
        "zy_uid": zy_uid,
        "zy_token": zy_token,
        "zy_pid_1": zy_proj_id1,
        "zy_pid_2": zy_proj_id2,
        "app_token": app_token
    }
)

show_result()
