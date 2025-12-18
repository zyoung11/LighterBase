from PAT import get, post, put, run_test, print_info, show_result

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
    "注册相同邮箱",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "zy111",
             "password": "sbdlh",
             "email": "sbdlh@love.com"
         },
     should_fail=True)
)

run_test(
    "注册相同名称",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "zy",
             "password": "sbdlh",
             "email": "sbdlh@11111111.com"
         },
     should_fail=True)
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
    "zy 提前发送通知给 yzm",
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
    "zy 查看自己发送的已经同意了的通知",
    get(f"{baseUrl}/api/team/send/agree",
         headers={"Authorization": f"Bearer {zy_token}"})
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
    "zy 创建表 web token",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/create-table/create",
         headers={"Authorization": f"Bearer {zy_token}",
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
    "zy 创建表 app token",
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
    "zy 查看上一次SQL操作",
    get(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/sqls/latest",
         headers={"Authorization": f"Bearer {app_token}",
                  "Content-Type": "application/json"},)
)

run_test(
    "yzm 创建表",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/create-table/create",
         headers={"Authorization": f"Bearer {yzm_app_token}",
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
    "yzk 创建表",
    post(f"{baseUrl}/{zy_uid}/{zy_proj_id1}/api/create-table/create",
         headers={"Authorization": f"Bearer {yzk_app_token}",
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
          },
      should_fail=True)
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
