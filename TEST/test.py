import unittest
import requests
import time

# 基础配置
BASE_URL = "http://localhost:8080"
TEST_URL = "http://localhost:8080/health"
ADMIN_USERNAME = "admin"
# 请根据您的实际情况修改管理员密码
ADMIN_PASSWORD = "adminpassword"

class TestLighterBaseAPI(unittest.TestCase):
    session = requests.Session()
    admin_token = None
    user_token = None
    test_user = {}
    test_project_id = None

    @classmethod
    def setUpClass(cls):
        """在所有测试开始前，检查服务、登录管理员、创建并登录测试用户"""
        # 确保后端服务可用
        try:
            response = cls.session.get(TEST_URL)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise Exception(f"无法连接到后端服务: {e}")
        # cls._login_admin()

        cls._create_and_login_test_user()

    # @classmethod
    # def _login_admin(cls):
    #     """管理员登录，获取Token"""
    #     url = f"{BASE_URL}/api/users/login"
    #     data = {"user_name": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    #     response = cls.session.post(url, json=data)
    #     response.raise_for_status()
    #     cls.admin_token = response.json().get("token")
    #     assert cls.admin_token is not None, "未能获取管理员Token"

    @classmethod
    def _create_and_login_test_user(cls):
        """注册一个新的测试用户，并登录以获取Token"""
        # 使用时间戳确保用户名和邮箱的唯一性
        unique_id = int(time.time())
        user_name = f"testuser_{unique_id}"
        email = f"testuser_{unique_id}@example.com"
        password = "testpassword123"

        # 注册
        register_url = f"{BASE_URL}/api/users/register"
        register_data = {"user_name": user_name, "password": password, "email": email}
        response = cls.session.post(register_url, json=register_data)
        if response.status_code != 201:
            raise Exception(f"创建测试用户失败: {response.text}")
        
        cls.test_user = response.json().get("user", {})
        cls.test_user['password'] = password # 保存密码用于后续登录
        assert cls.test_user.get("user_id") is not None, "注册成功但未返回用户信息"

        # 登录
        login_url = f"{BASE_URL}/api/users/login"
        login_data = {"user_name": user_name, "password": password}
        response = cls.session.post(login_url, json=login_data)
        response.raise_for_status()
        cls.user_token = response.json().get("token")
        assert cls.user_token is not None, "测试用户登录失败"

    # --- 用户API测试 ---
    def test_01_user_registration_conflict(self):
        """测试注册已存在的用户，预期冲突"""
        url = f"{BASE_URL}/api/users/register"
        data = {
            "user_name": self.test_user['user_name'],
            "password": self.test_user['password'],
            "email": self.test_user['email']
        }
        response = self.session.post(url, json=data)
        self.assertIn(response.status_code, [400, 409])

    def test_02_get_all_users_as_admin(self):
        """测试管理员获取所有用户列表"""
        url = f"{BASE_URL}/api/users"
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.session.get(url, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_03_get_single_user(self):
        """测试获取单个用户的信息"""
        user_id = self.test_user.get("user_id")
        url = f"{BASE_URL}/api/users/{user_id}"
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = self.session.get(url, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user_id'], user_id)

    def test_04_update_user(self):
        """测试更新用户信息"""
        user_id = self.test_user.get("user_id")
        url = f"{BASE_URL}/api/users/{user_id}"
        headers = {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}
        new_name = f"updated_{self.test_user['user_name']}"
        data = {"user_name": new_name, "user_avatar": "http://example.com/new_avatar.png"}
        response = self.session.put(url, json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user_name'], new_name)
        # 更新内存中的用户名以供后续测试使用
        self.__class__.test_user['user_name'] = new_name

    # --- 项目API测试 ---
    def test_05_create_project(self):
        """测试创建新项目"""
        url = f"{BASE_URL}/api/projects"
        headers = {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}
        data = {
            "project_name": "My Test Project",
            "project_description": "A project for testing purposes."
        }
        response = self.session.post(url, json=data, headers=headers)
        self.assertEqual(response.status_code, 201)
        self.assertIn("project_id", response.json())
        self.__class__.test_project_id = response.json()['project_id']

    def test_06_get_all_projects_for_user(self):
        """测试获取当前用户的所有项目"""
        url = f"{BASE_URL}/api/projects"
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = self.session.get(url, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        # 确认列表中至少包含我们刚创建的项目
        self.assertTrue(any(p['project_id'] == self.test_project_id for p in response.json()))

    def test_07_get_single_project(self):
        """测试获取单个项目的详细信息"""
        self.assertIsNotNone(self.test_project_id, "前置测试未成功创建项目")
        url = f"{BASE_URL}/api/projects/{self.test_project_id}"
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = self.session.get(url, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['project_id'], self.test_project_id)

    def test_08_update_project(self):
        """测试更新项目信息"""
        self.assertIsNotNone(self.test_project_id, "前置测试未成功创建项目")
        url = f"{BASE_URL}/api/projects/{self.test_project_id}"
        headers = {"Authorization": f"Bearer {self.user_token}", "Content-Type": "application/json"}
        data = {"project_name": "My Updated Test Project"}
        response = self.session.put(url, json=data, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['project_name'], "My Updated Test Project")

    def test_09_delete_project(self):
        """测试删除项目"""
        self.assertIsNotNone(self.test_project_id, "前置测试未成功创建项目")
        url = f"{BASE_URL}/api/projects/{self.test_project_id}"
        headers = {"Authorization": f"Bearer {self.user_token}"}
        response = self.session.delete(url, headers=headers)
        self.assertEqual(response.status_code, 204)

    # --- 清理和遗留测试 ---
    def test_10_delete_user(self):
        """测试删除用户"""
        user_id = self.test_user.get("user_id")
        url = f"{BASE_URL}/api/users/{user_id}"
        # 需要管理员权限或用户自身权限来删除
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.session.delete(url, headers=headers)
        self.assertEqual(response.status_code, 204)

    def test_11_insufficient_permissions(self):
        """测试权限不足（普通用户尝试管理员操作）"""
        url = f"{BASE_URL}/api/create-table/create"
        headers = {"Authorization": f"Bearer {self.user_token}"}
        data = {"SQL": "CREATE TABLE IF NOT EXISTS test_table2 (id INTEGER PRIMARY KEY)"}
        response = self.session.post(url, json=data, headers=headers)
        self.assertEqual(response.status_code, 403)

    def test_12_invalid_authentication(self):
        """测试无效认证（错误的Token）"""
        url = f"{BASE_URL}/api/projects"
        headers = {"Authorization": "Bearer invalid_token"}
        response = self.session.get(url, headers=headers)
        self.assertIn(response.status_code, [401, 403])

import io

if __name__ == "__main__":
    # 创建测试套件
    suite = unittest.TestLoader().loadTestsFromTestCase(TestLighterBaseAPI)
    
    # 创建一个TextTestRunner来运行测试，但不立即打印结果
    runner = unittest.TextTestRunner(stream=io.StringIO(), verbosity=2)
    result = runner.run(suite)
    
    # 检查结果并提供统一输出
    if result.wasSuccessful():
        print("测试无误")
    else:
        print("测试出现问题，详情如下：")
        if result.errors:
            print("\n--- 错误 (Errors) ---")
            for test, traceback_info in result.errors:
                print(f"测试用例: {test.id()}\n{traceback_info}")
        
        if result.failures:
            print("\n--- 失败 (Failures) ---")
            for test, traceback_info in result.failures:
                print(f"测试用例: {test.id()}\n{traceback_info}")
