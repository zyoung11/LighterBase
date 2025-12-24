from PAT import get, post, put, delete, run_test, show_result

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
             "email": "yzm@yzm.com"
         })
)

run_test(
    "注册用户 yzk",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "yzk",
             "password": "yzk",
             "email": "yzk@yzk.com"
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

yzm_uid, yzm_token = run_test(
    "yzm 登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "user_name": "yzm",
             "password": "yzm666"
         }),
    "user.user_id", "token"
)

yzk_uid, yzk_token = run_test(
    "yzk 登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "user_name": "yzk",
             "password": "yzk"
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
    "zy 提前发送通知给 yzm",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "admin",
                "email": "yzm@yzm.com"
          },
      should_fail=True)
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
    "zy 发送通知给 yzm",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "admin",
                "email": "yzm@yzm.com"
          })
)

notificationId = run_test(
    "yzm 查看接收的所有通知",
    get(f"{baseUrl}/api/team/receive/all",
         headers={"Authorization": f"Bearer {yzm_token}"}),
    "0.notification_id"
)

run_test(
    "yzm 同意通知",
    put(f"{baseUrl}/api/team/confirm/{notificationId}/agree",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "检查 yzm 是否已经注册过",
    get(f"{baseUrl}/api/team/init/{zy_proj_id1}",
         headers={"Authorization": f"Bearer {yzm_token}",
                  "Content-Type": "application/json"},))

run_test(
    "yzm 在 zy 项目里注册",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auto/create/users",
         headers={"Content-Type": "application/json"},
         body={
             "name": "yzm",
             "password_hash": "yzm",
             "email": "yzm@yzm.com"
         })
)

run_test(
    "检查 yzm 是否已经注册过",
    get(f"{baseUrl}/api/team/init/{zy_proj_id1}",
         headers={"Authorization": f"Bearer {yzm_token}",
                  "Content-Type": "application/json"},))

yzm_app_token = run_test(
    "yzm 在 zy 项目里登录",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "yzm",
             "password_hash": "yzm"
        }),
    "token"
)

run_test(
    "zy 发送通知给 yzk",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "readonly",
                "email": "yzk@yzk.com"
          })
)

yzk_notificationId = run_test(
    "yzk 查看自己接收的待同意的通知",
    get(f"{baseUrl}/api/team/receive/pending",
         headers={"Authorization": f"Bearer {yzk_token}"}),
    "0.notification_id"
)

run_test(
    "yzk 同意通知",
    put(f"{baseUrl}/api/team/confirm/{yzk_notificationId}/agree",
         headers={"Authorization": f"Bearer {yzk_token}"})
)

run_test(
    "yzk 在 zy 项目里注册",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auto/create/users",
         headers={"Content-Type": "application/json"},
         body={
             "name": "yzk",
             "password_hash": "yzk",
             "email": "yzk@yzk.com"
         })
)

yzk_app_token = run_test(
    "yzk 在 zy 项目里登录",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/auth/login",
         headers={"Content-Type": "application/json"},
         body={
             "name": "yzk",
             "password_hash": "yzk"
        }),
    "token"
)

run_test(
    "zy 执行一条Query 请求",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/queries/run-queries",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"},
        body={
             "queries": "SELECT * FROM users;"   
        })
)

show_result()
