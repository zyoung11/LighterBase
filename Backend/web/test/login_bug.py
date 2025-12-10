from PAT import get, option, patch, post, put, delete, run_test, print_info

baseUrl = "http://localhost:8080"

run_test(
    "zy 登录",
    post(f"{baseUrl}/api/users/login",
         body={
         })
)

run_test(
    "注册用户 zy",
    post(f"{baseUrl}/api/users/register",
         body={
         })
)

run_test(
    "zy 登录",
    post(f"{baseUrl}/api/users/login",
         body={
         })
)

