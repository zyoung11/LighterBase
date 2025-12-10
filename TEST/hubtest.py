from PAT import get, option, patch, post, put, delete, run_test, print_info

baseUrl = "http://localhost:8080"

zy_uid, zy_token = run_test(
    "注册用户 zy",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "zy",
             "password": "sbdlh",
             "email": "sbdlh@love.com"
         }),
    "user.user_id", "token"
)




yzm_uid = run_test(
    "注册用户 yzm",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "yzm",
             "password": "yzm666",
             "email": "yzm@notgay.com"
         }),
    "user.user_id"
)

dlh_uid = run_test(
    "注册用户 dlh",
    post(f"{baseUrl}/api/users/register",
         body={
             "user_name": "dlh",
             "password": "dlhnotgay",
             "email": "dlh@gay?.com"
         }),
    "user.user_id"
)

run_test(
    "用户登录",
    post(f"{baseUrl}/api/users/login",
         body={
             "user_name": "zy",
             "password": "sbdlh"
         })
)

run_test(
    "获取所有用户",
    get(f"{baseUrl}/api/users",
        headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "获取单个用户 yzm",
    get(f"{baseUrl}/api/users/{yzm_uid}",
        headers={"Authorization": f"Bearer {zy_token}"})
)

run_test(
    "更新用户 yzm",
    put(f"{baseUrl}/api/users/{yzm_uid}",
        headers={"Authorization": f"Bearer {zy_token}",
                 "Content-Type": "application/json"},
        body={
            "user_name": "yzm",
            "password": "yzm666butnotgay",
            "user_avatar": ""
        })
)

run_test(
    "删除用户 dlh",
    delete(f"{baseUrl}/api/users/{dlh_uid}",
           headers={"Authorization": f"Bearer {zy_token}"})
)

run_test("检查是否已经注册", get(f"{baseUrl}/api/users/check/init"))

proj_id = run_test(
    "创建项目",
    post(f"{baseUrl}/api/projects",
         headers={"Authorization": f"Bearer {zy_token}",
                  "Content-Type": "application/json"},
         body={
             "project_name": "blog",
             "project_avatar": "123",
             "project_description": "this is a blog project"
         }),
    "project_id"
)

proj_detail = run_test(
    "查询刚创建的项目详情",
    get(f"{baseUrl}/api/projects/{proj_id}",
        headers={"Authorization": f"Bearer {zy_token}"}),
    "project_name", "project_description"
)

run_test(
    "项目内注册用户 zy_i",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/users",
         # headers={"Authorization": f"Bearer {zy_token}"},
         body={
             "name": "zy_i",
             "password_hash": "zy123",
             "email": "zy_i@example.com"
         })
)

proj_token = run_test(
    "项目内登录 zy_i",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/auth/login",
         body={
             "name": "zy_i",
             "password_hash": "zy123"
         }),
    "token"
)

run_test(
    "管理员建表 articles",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/create-table/create",
         headers={"Authorization": f"Bearer {proj_token}"},
         body={
             "SQL": "CREATE TABLE articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, yzmnb TEXT)"
         })
)

run_test(
    "管理员建表 imagines",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/create-table/create",
         headers={"Authorization": f"Bearer {proj_token}"},
         body={
             "SQL": "CREATE TABLE imagines (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT, image_url TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
         })
)

run_test(
    "管理员建表 comments",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/create-table/create",
         headers={"Authorization": f"Bearer {proj_token}"},
         body={
             "SQL": "CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER, user_name TEXT, content TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)"
         })
)

run_test(
    "设置 articles 表权限",
    put(f"{baseUrl}/{zy_uid}/{proj_id}/api/security/articles",
        headers={"Authorization": f"Bearer {proj_token}"},
        body={
            "create_where": "@uid = 1",
            "delete_where": "@uid = 1",
            "update_where": "@uid = 1",
            "view_where": "true"
        })
)

run_test(
    "设置 imagines 表权限",
    put(f"{baseUrl}/{zy_uid}/{proj_id}/api/security/imagines",
        headers={"Authorization": f"Bearer {proj_token}"},
        body={
            "create_where": "true",
            "delete_where": "true",
            "update_where": "true",
            "view_where": "true"
        })
)

article_id = run_test(
    "创建第一篇文章",
    post(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/articles",
        headers={"Authorization": f"Bearer {proj_token}"},
        body={
             "title": "PAT入门",
             "yzmnb": "一篇通过 PAT 自动创建的博客文章"
         }),
    "id"
)

run_test(
    "查询刚创建的文章",
    get(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/view/articles?page=1&perpage=1",
        headers={"Authorization": f"Bearer {proj_token}"},
        body={
            "SELECT" : ["id","title"],
            "WHERE" : f"id = {article_id}"
        }),
    "0.items.id", "0.items.title"
)

run_test(
    "全量更新文章（PUT）",
    put(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/articles/{article_id}",
        headers={"Authorization": f"Bearer {proj_token}"},
        body={
            "title": "PAT 框架全面指南",
            "yzmnb": "内容已完全更新"
        })
)

run_test(
    "部分更新文章（PATCH）",
    patch(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/articles/{article_id}",
          headers={"Authorization": f"Bearer {proj_token}"},
          body={"title": "PAT 框架极简入门"})
)

run_test(
    "尝试删除不存在的文章（应失败）",
    delete(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/articles/99999",
           headers={"Authorization": f"Bearer {proj_token}"},
           should_fail=True)
)

run_test(
    "查询文章端点支持的 HTTP 方法（OPTIONS）",
    option(f"{baseUrl}/{zy_uid}/{proj_id}/api/auto/create/articles/{article_id}",
           headers={"Authorization": f"Bearer {proj_token}"})
)

run_test(
    "带自定义请求头的 GET",
    get(f"{baseUrl}/api/users/{zy_uid}",
        headers={"X-Request-ID": "pat-demo-123"})
)

print_info(
    "PAT 全功能演示汇总",
    {
        "zy 用户 ID": zy_uid,
        "yzm 用户 ID": yzm_uid,
        "dlh 用户 ID": dlh_uid,
        "zy 登录 Token": zy_token,
        "新建项目 ID": proj_id,
        "项目名 / 描述": proj_detail,
        "项目 owner": zy_uid,
        "创建的文章 ID": article_id
    }
)
