# 文档和 smallCount 规范

## 基本要求

- 新增代码需要兼容web、android、ios三端
- 属性命名符合 antd 的 API 命名规则：https://github.com/ant-design/ant-design/wiki/API-Naming-rules

## smallCount 规范

- 样式编写需要使用nativewind
- 新增/修改页面需要提供亮暗两种主题，其中主题色需要参考theme/theme.ts，tailwindcss配置文件需要参考tailwind.config.js
- 对sqlite进行操作是需要遵循分层架构，即数据库操作层（db/repositories）、业务逻辑层（db/services）,还需要结合zustand进行状态管理(storage/stores)

### 示例

- 不好的例子：修复组件 Typography 的 dom 结构问题
- 好的例子：修复了 List.Item 中内容空格丢失的问题

### 其他要求

- 新增属性时，建议用易于理解的语言补充描述用户可以感知的变化
- 尽量给出原始的 PR 链接，社区提交的 PR 改动加上提交者的链接
- 底层模块升级中间版本要去 rc-component 里找到改动，给出变动说明
- 建议参考之前版本的日志写法
- 将同组件的改动放在一起，内容子级缩进

### Changelog Emoji 规范

-   Bug 修复
-   新增特性，新增属性
-   极其值得关注的新增特性
-        国际化改动
-     文档或网站改进
- ✅ 新增或更新测试用例
-   更新警告/提示信息
- ⌨️ ♿ 可访问性增强
-   废弃或移除
-   重构或工具链优化
- ⚡️ 性能提升

# 文档规范

- 新属性需声明可用的版本号
- 属性命名符合 API 命名规则
- 组件文档包含：使用场景、基础用法、API 说明
- 文档示例应简洁明了
- 属性的描述应清晰易懂
- 对复杂功能提供详细说明
- 加入 TypeScript 定义
- 提供常见问题解答