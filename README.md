# 友链管理仓库

这是小十博客的友链管理公开仓库，用于存储和管理博客友链数据。

## 🎯 功能特性

- 📝 通过 GitHub Issue 自助提交友链申请
- 🤖 自动化处理和审核流程
- 🔄 自动更新 `links.json` 文件
- 🚀 支持友链分类（朋友、大佬、团体）

## 📋 如何添加友链

### 方法一：提交 Issue（推荐）

1. 点击 [Issues](../../issues) 页面
2. 点击 "New Issue" 按钮
3. 选择 "友链申请" 模板
4. 填写你的博客信息：
   - 博客名称
   - 博客地址
   - 博客描述
   - 头像地址（或 Gravatar MD5）
   - 友链分类（friends/experts/groups）
5. 提交 Issue 等待审核

### 方法二：提交 Pull Request

1. Fork 本仓库
2. 编辑 `links.json` 文件，添加你的友链信息
3. 提交 Pull Request
4. 等待审核合并

## 📝 友链数据格式

```json
{
  "name": "博客名称",
  "url": "https://example.com/",
  "src": "https://example.com/avatar.png",
  "des": "博客描述"
}
```

或使用 Gravatar：

```json
{
  "name": "博客名称",
  "url": "https://example.com/",
  "md5": "gravatar_md5_hash",
  "des": "博客描述"
}
```

## 🗂️ 分类说明

- **friends**: 朋友 - 互相关注的博主朋友
- **experts**: 大佬 - 技术大牛、行业专家
- **groups**: 联盟组织 - 博客联盟等

## 📊 当前友链数据

友链数据存储在 [`links.json`](./links.json) 文件中。

## 🔗 相关链接

- 博客主站：https://www.xiaoten.com/
- 友圈页面：https://www.xiaoten.com/pages/links/

## 📜 许可证

MIT License
