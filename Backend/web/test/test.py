from PAT import get, option, patch, post, put, delete, run_test, print_info

baseUrl = "http://localhost:8080"

run_test(
    "注册用户 zy",
    post(f"{baseUrl}/api/users/register",
         body={
             "name": "zy",
             "password_hash": "sbdlh",
             "email": "sbdlh@love.com"
         })
)

run_test(
    "注册用户 yzm",
    post(f"{baseUrl}/api/users/register",
         body={
             "name": "yzm",
             "password_hash": "yzm666",
             "email": "yzm@notgay.com"
         })
)

zy_uid, zy_token = run_test(
    "zy 登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "name": "zy",
             "password_hash": "sbdlh"
         }),
    "user.user_id", "token"
)

yzm_uid, yzm_token = run_test(
    "yzm 登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "name": "yzm",
             "password_hash": "yzm666"
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


yzm_proj_id = run_test(
    "yzm 创建项目1",
    post(f"{baseUrl}/api/projects",
         headers={"Authorization": f"Bearer {yzm_token}",
                  "Content-Type": "application/json"},
         body={
             "project_name": "3",
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
    "获取 yzm 项目",
    get(f"{baseUrl}/api/projects",
        key=yzm_token)
)

print('\n',zy_token,'\n',yzm_token)
