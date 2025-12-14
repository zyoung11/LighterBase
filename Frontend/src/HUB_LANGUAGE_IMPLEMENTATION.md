# Hub界面中英文切换功能实现总结

## 实现的功能

### 1. HTML文件修改 (hub.html)
- 为所有需要翻译的文本元素添加了 `data-i18n` 属性
- 添加了翻译函数 `translatePage()` 和语言变化事件监听器
- 支持的翻译文本包括：
  - 标语内容 (hub.slogan.*)
  - 按钮文本 (hub.buttons.*)
  - 页脚信息 (hub.footer.*)

### 2. TypeScript文件修改 (hubConponents.ts)
- 添加了全局翻译函数 `translatePage()`
- 在DOM加载完成后自动调用翻译功能
- 在语言切换事件中重新翻译整个页面
- 确保动态创建的元素也能正确翻译

### 3. 支持的翻译键值
根据lang文件夹中的语言文件，支持以下翻译：

#### 标语部分 (hub.slogan)
- `hub.slogan.build`: "Build in a Lighter Way" / "以更轻的方式构建"
- `hub.slogan.minutes`: "Just in minutes" / "只需几分钟"
- `hub.slogan.platform`: "Lighterbase is the Postgres development platform." / "Lighterbase 是 Postgres 开发平台。"
- `hub.slogan.editing`: "Backend editing in a new way than the past altogether." / "以后端编辑的新方式彻底改变过去。"

#### 按钮部分 (hub.buttons)
- `hub.buttons.getStart`: "Get Start" / "开始使用"

#### 页脚部分 (hub.footer)
- `hub.footer.trusted`: "Trusted by ourselves" / "我们自己信任"
- `hub.footer.github`: "LighterBase" / "LighterBase"
- `hub.footer.icp`: "京公网安备11011402055062号" / "京公网安备11011402055062号"

## 使用方法

### 1. 语言切换
- 用户可以通过右上角的语言切换按钮（"中"/"EN"）切换语言
- 语言设置会自动保存到localStorage
- 页面内容会实时更新为对应语言

### 2. 添加新的翻译文本
1. 在 `lang/en.json` 和 `lang/zh.json` 中添加对应的翻译键值
2. 在HTML中为需要翻译的元素添加 `data-i18n` 属性
3. 翻译会自动生效

### 3. 示例代码
```html
<!-- 添加翻译属性 -->
<h1 data-i18n="hub.slogan.build">Build in a Lighter Way</h1>
<button data-i18n="hub.buttons.getStart">Get Start</button>
```

## 技术实现

### 1. 翻译机制
- 使用 `data-i18n` 属性标记需要翻译的元素
- 通过 `i18n.t(key)` 函数获取对应语言的文本
- 监听 `languageChanged` 事件实现实时翻译

### 2. 语言切换
- 基于 `modules/i18n.ts` 实现完整的国际化功能
- 支持中英文切换
- 语言设置持久化存储

### 3. 事件驱动
- 使用 `CustomEvent` 实现组件间通信
- 语言切换时自动触发页面重新翻译

## 测试文件

创建了以下测试文件用于验证功能：
- `test-hub-language.html`: 基础功能测试
- `hub-language-demo.html`: 完整界面演示

## 注意事项

1. 确保所有翻译键值在语言文件中都有对应的定义
2. 新增翻译文本时需要同时更新中英文语言文件
3. 语言切换按钮会自动显示当前语言状态
4. 页面加载时会自动应用当前语言设置

## 验证方法

1. 打开 `hub-language-demo.html` 查看完整效果
2. 点击右上角的语言切换按钮测试切换功能
3. 检查所有文本是否正确切换到对应语言
4. 验证语言设置是否正确保存和恢复