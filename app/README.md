# AI Accessory - 语音助手应用 🎙️

这是一个基于 Expo 开发的 AI 语音助手应用，集成了完整的语音对话功能。

## 主要功能 ✨

- 🎤 **语音录制**：使用手机麦克风录制用户语音
- 🗣️ **语音识别**：将语音转换为文本（支持中文）
- 🤖 **AI 对话**：集成豆包大模型，提供智能对话服务
- 🔊 **文本转语音**：将 AI 回复转换为语音播放
- 📱 **对话历史**：本地存储对话记录，支持多轮对话
- 🎨 **现代 UI**：美观的用户界面，支持深色/浅色主题

## 快速开始 🚀

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API

复制环境配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置豆包 API 密钥：
```env
EXPO_PUBLIC_DOUBAO_API_KEY=your_actual_api_key_here
```

### 3. 启动应用

```bash
npx expo start
```

选择运行平台：
- 📱 Android 模拟器
- 📱 iOS 模拟器  
- 🌐 Web 浏览器
- 📲 Expo Go (扫码运行)

## 使用指南 📖

### 基本操作
1. 打开应用，点击底部 "Voice" 标签
2. 点击麦克风按钮开始录音
3. 对着手机说话
4. 系统自动识别语音并获取 AI 回复
5. AI 回复会以语音形式播放

### 功能按钮
- 🎤 **麦克风**：开始/停止语音录制
- 🗑️ **清除**：清除所有对话历史
- ❌ **关闭**：退出语音对话界面

## 技术架构 🏗️

### 核心技术栈
- **Expo** - 跨平台开发框架
- **React Native** - 移动应用开发
- **TypeScript** - 类型安全的 JavaScript
- **Expo AV** - 音频录制和播放
- **Expo Speech** - 文本转语音
- **React Native Voice** - 语音识别
- **AsyncStorage** - 本地数据存储
- **Axios** - HTTP 请求

### 项目结构
```
app/
├── components/           # UI 组件
│   ├── VoiceChat.tsx    # 语音对话主组件
│   └── ...
├── services/            # 业务逻辑
│   └── VoiceService.ts  # 语音服务核心类
├── config/              # 配置文件
│   └── api.ts          # API 配置
├── app/(tabs)/          # 页面路由
│   ├── index.tsx       # 首页
│   ├── explore.tsx     # 探索页
│   └── voice.tsx       # 语音助手页
└── docs/               # 文档
    └── VOICE_CHAT_GUIDE.md
```

## 权限说明 🔐

应用需要以下权限：
- **麦克风权限** - 录制用户语音
- **网络权限** - 调用 AI API
- **存储权限** - 保存对话历史

## API 集成 🔌

### 豆包大模型 API
- **端点**: `https://ark.cn-beijing.volces.com/api/v3`
- **模型**: `doubao-pro-4k`
- **功能**: 智能对话生成

### 配置示例
```typescript
export const API_CONFIG = {
  DOUBAO: {
    BASE_URL: 'https://ark.cn-beijing.volces.com/api/v3',
    MODEL: 'doubao-pro-4k',
    API_KEY: process.env.EXPO_PUBLIC_DOUBAO_API_KEY,
  },
};
```

## 开发说明 👩‍💻

### 开发环境要求
- Node.js 18+
- Expo CLI
- Android Studio (Android 开发)
- Xcode (iOS 开发)

### 调试模式
```bash
# 开发模式
npx expo start

# 清理缓存
npx expo start --clear

# 生产构建
npx expo build:android
npx expo build:ios
```

## 故障排除 🔧

### 常见问题
1. **无法录音** → 检查麦克风权限
2. **AI 无回复** → 验证 API 密钥和网络连接
3. **语音识别失败** → 确保环境安静，说话清晰
4. **应用崩溃** → 查看控制台错误日志

### 调试命令
```bash
# 查看日志
npx expo logs

# 重置项目
npm run reset-project

# 修复依赖
npm audit fix
```

## 扩展功能 🚀

计划中的功能：
- [ ] 多语言支持
- [ ] 自定义 AI 人格
- [ ] 语音情感识别
- [ ] 对话导出功能
- [ ] 语音指令快捷操作
- [ ] 云端同步

## 贡献指南 🤝

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证 📄

MIT License - 详见 LICENSE 文件

## 联系方式 📧

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至开发者

---

<<<<<<< Current (Your changes)
- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
=======
**享受与 AI 的语音对话吧！** 🎉
>>>>>>> Incoming (Background Agent changes)
