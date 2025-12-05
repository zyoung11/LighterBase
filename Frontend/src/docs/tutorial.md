<h2 style="font-weight: bold; font-size: 1.5em;">📚 教程</h2>

LighterBase 主工作区分为"数据库管理、日志管理、文件管理与设置"四个模块。下面详细介绍每个模块的使用方法。

<h3 id="database-management" style="font-weight: bold; font-size: 1.3em;">🗄️ 数据库管理</h3>

<h4 style="font-weight: bold; font-size: 1.2em;">🛠️ 数据库创建模块</h4>

![数据库创建界面](/docs/imgs/Database_create.png)

**1.** 在 SQL 输入栏中，按照标准的 SQL 语法输入 CREATE TABLE 语句，例如：

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);
```

**2.** 按回车键提交，语句将发送到渲染窗口，通过 GOJS 技术实时渲染 E-R 图。您可以拖拽图中的元素来调整布局。

![GOJS E-R 图渲染](/docs/imgs/Database_gojs.png)

**3.** 如果您不熟悉 SQL 语法，我们集成了 GLM 大语言模型。在 AI 提问框中描述您的需求（如"创建一个用户表，包含姓名和邮箱"），AI 会生成相应的 SQL 语句。

**4.** 确认 SQL 正确后，点击"确认"按钮提交到服务端，建立数据库表结构。

**5.** 打开api文档查看具体的使用教程

![API 文档界面](/docs/imgs/Database_apimd.png)

**重要提醒：表结构提交后无法修改，请仔细检查后再确认！**

<h4 style="font-weight: bold; font-size: 1.2em;">🔒 权限管理模块</h4>

![权限管理界面](/docs/imgs/Database_permission.png)
1. 在权限管理界面，选择要设置权限的表和字段。

**2.** 点击相应的单元格，在弹出的输入框中输入权限设置。

**3.** 使用 "WHERE = ?" 的 SQL 条件语法，例如 "id = 1" 来指定权限范围。

**4.** 保存设置后，权限将立即生效。

<h3 id="log-management" style="font-weight: bold; font-size: 1.3em;">📋 日志管理</h3>

![日志管理页面](/docs/imgs/log_info.png)

1. 在日志管理页面顶部，输入关键词进行模糊搜索（如"error"或特定时间戳）。

**2.** 浏览搜索结果，点击任意日志条目查看详细内容，包括时间戳、级别。

**3.** 要导出日志，选择一个或多个日志条目，点击"确认"按钮，系统会生成包含选中日志的 CSV 文件。

![日志导出功能](/docs/imgs/log_download.png)

**4.** 日志文件可用于故障排查和系统监控。

<h3 id="file-management" style="font-weight: bold; font-size: 1.3em;">📁 文件管理</h3>

![文件管理界面](/docs/imgs/folder.png)

1. 进入文件管理模块，选择要查看的数据库表。

**2.** 系统以表格形式显示该表的所有数据记录，包括所有字段和值。

**3.** 点击任意单元格，系统会以窗口模式显示该单元格的内容。

**4.** 要复制数据，点击菜单的"复制"选项，可以复制选中的内容。

<h3 id="settings" style="font-weight: bold; font-size: 1.3em;">⚙️ 设置</h3>

<h4 style="font-weight: bold; font-size: 1.2em;">🤖 AI 模块</h4>

![AI 设置模块](/docs/imgs/setting_ai.png)

1. 在设置页面的 AI 模块，查看当前配置的 AI 模型信息。

**2.** 检查 AI 服务的连接状态和运行状况。

**3.** 如果 AI 服务异常，可以在这里重新配置或联系管理员。

<h4 style="font-weight: bold; font-size: 1.2em;">👤 Account 模块</h4>

![账户设置模块](/docs/imgs/setting_account.png)

1. 点击设置页面中的 Account 选项卡。

**2.** 要修改密码，输入当前密码和新密码，点击"修改密码"。

**3.** 系统会验证密码强度并确认修改。

**4.** 要登出账号，点击"登出"按钮，系统会清除会话并返回登录页面。

**5.** 出于安全考虑，定期修改密码是一个好习惯。
