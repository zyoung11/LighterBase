from PAT import get, option, patch, post, put, delete, run_test, print_info

baseUrl = "http://localhost:8080"

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

run_test(
    "zy 发送通知给 yzm",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "admin",
                "email": "yzm@notgay.com"
          })
)

run_test(
    "zy 重复发送通知给 yzm",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "admin",
                "email": "yzm@notgay.com"
          },
      should_fail=True)
)

run_test(
    "zy 查看自己发送的通知",
    get(f"{baseUrl}/api/team/send/all",
         headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "zy 查看自己发送的已经同意了的通知",
    get(f"{baseUrl}/api/team/send/agree",
         headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "zy 查看自己发送的没有同意了的通知",
    get(f"{baseUrl}/api/team/send/disagree",
         headers={"Authorization": f"Bearer {zy_token}"})
)

notificationId = run_test(
    "yzm 查看接收的所有通知",
    get(f"{baseUrl}/api/team/receive/all",
         headers={"Authorization": f"Bearer {yzm_token}"}),
    "0.notification_id"
)

run_test(
    "yzm 查看接收的且同意的通知",
    get(f"{baseUrl}/api/team/receive/agree",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "yzm 查看接收的且不同意的通知",
    get(f"{baseUrl}/api/team/receive/disagree",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "zy 查看自己发送的待同意的通知",
    get(f"{baseUrl}/api/team/send/pending",
         headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "yzm 查看自己接收的待同意的通知",
    get(f"{baseUrl}/api/team/receive/pending",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "yzm 同意通知",
    put(f"{baseUrl}/api/team/confirm/{notificationId}/agree",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "zy 重复发送通知给 yzm",
    post(f"{baseUrl}/api/team",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
          body={
              	"projectId": zy_proj_id1,
                "permissions": "admin",
                "email": "yzm@notgay.com"
          },
      should_fail=True)
)

run_test(
    "zy 查看自己发送的待同意的通知",
    get(f"{baseUrl}/api/team/send/pending",
         headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "yzm 查看自己接收的待同意的通知",
    get(f"{baseUrl}/api/team/receive/pending",
         headers={"Authorization": f"Bearer {yzm_token}"})
)

run_test(
    "zy 查看自己发送的已经同意了的通知",
    get(f"{baseUrl}/api/team/send/agree",
         headers={"Authorization": f"Bearer {zy_token}"})
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
