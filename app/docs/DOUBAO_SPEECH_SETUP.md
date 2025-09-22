# 豆包语音识别集成说明

## 概述

已成功集成豆包（字节跳动）的语音识别API v3版本，替换了原有的模拟语音识别功能。现在可以实现真实的语音转文字功能。

## 功能特性

- ✅ 真实的语音识别API集成（v3版本）
- ✅ 音频文件自动转换为base64格式
- ✅ 支持WAV格式，16kHz采样率
- ✅ 自动重试机制（最多3次，指数退避）
- ✅ 完善的错误处理和用户友好提示
- ✅ 支持中文普通话识别
- ✅ 使用最新的火山引擎语音识别API

## 配置步骤

### 1. 获取API凭证

1. 访问 [火山引擎官网](https://www.volcengine.com/)
2. 注册账号并完成实名认证
3. 开通语音识别服务
4. 获取以下凭证：
   - `APP_ID`: 应用ID
   - `TOKEN`: 访问令牌

### 2. 环境变量配置

在项目根目录的 `.env` 文件中添加以下配置：

```bash
# 豆包语音识别配置
EXPO_PUBLIC_DOUBAO_SPEECH_APP_ID=your_app_id_here
EXPO_PUBLIC_DOUBAO_SPEECH_TOKEN=your_token_here
```

### 3. 重启应用

配置完成后，重新启动应用以加载新的环境变量。

## API接口说明

### 已更新的方法（v3 API）

#### `convertSpeechToText(audioUri: string): Promise<string>`

**功能**: 将音频文件转换为文字（使用v3 API）

**参数**:
- `audioUri`: 音频文件的本地URI路径

**返回值**: 
- `Promise<string>`: 识别出的文字内容

**API端点**: `https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit`

**请求格式**:
```typescript
{
  appid: "your_app_id",
  token: "your_token",
  version: "v3",
  request: {
    reqid: "unique_request_id",
    audio: {
      format: "wav",
      sample_rate: 16000,
      channel: 1,
      language: "zh-CN",
      bits: 16,
      data: "base64_audio_data"
    },
    asr: {
      show_utf8: true
    }
  }
}
```

**响应格式**:
```typescript
{
  code: 0,
  message: "success",
  reqid: "unique_request_id",
  result: {
    text: "识别出的文字内容",
    confidence: 0.95,
    utterances: [...]
  }
}
```

**示例**:
```typescript
try {
    const text = await voiceService.convertSpeechToText(audioUri);
    console.log('识别结果:', text);
} catch (error) {
    console.error('语音识别失败:', error.message);
}
```

### 新增的私有方法

#### `convertAudioToBase64(audioUri: string): Promise<string>`
- 将音频文件转换为base64编码

#### `callSpeechRecognitionWithRetry(requestData: any, maxRetries: number): Promise<DoubaoSpeechResponse>`
- 带重试机制的API调用，支持v3 API格式

## 错误处理

系统会自动处理以下错误情况：

- **网络超时**: "语音识别超时，请检查网络连接"
- **认证失败**: "语音识别服务认证失败，请检查配置"
- **请求过频**: "语音识别请求过于频繁，请稍后再试"
- **服务不可用**: "语音识别服务暂时不可用，请稍后再试"
- **文件格式错误**: "音频文件格式转换失败"

## 重试机制

- 自动重试最多3次
- 使用指数退避策略（1s, 2s, 4s，最大5s）
- 对于认证错误(401)和频率限制(429)不进行重试

## 支持的音频格式

- **格式**: WAV
- **采样率**: 16000 Hz
- **声道数**: 1 (单声道)
- **语言**: 中文普通话 (zh-CN)

## 使用示例

```typescript
import voiceService from '@/services/VoiceService';

// 录音并识别
try {
    await voiceService.startRecording();
    
    // 录音3秒后停止
    setTimeout(async () => {
        const audioUri = await voiceService.stopRecording();
        if (audioUri) {
            const recognizedText = await voiceService.convertSpeechToText(audioUri);
            console.log('识别结果:', recognizedText);
        }
    }, 3000);
} catch (error) {
    console.error('录音或识别失败:', error);
}
```

## 注意事项

1. **API配额**: 注意豆包语音识别服务的调用配额和计费标准
2. **网络要求**: 需要稳定的网络连接
3. **权限**: 确保应用有麦克风录音权限
4. **音频质量**: 清晰的录音质量会提高识别准确率
5. **安全**: 妥善保管API凭证，避免泄露

## 故障排除

### 常见问题

1. **"认证失败"错误**
   - 检查APP_ID和TOKEN是否正确配置
   - 确认环境变量名称拼写正确
   - 重启应用以加载新配置

2. **"请求过于频繁"错误**
   - 降低请求频率
   - 等待片刻后重试

3. **识别结果为空**
   - 检查录音质量和音量
   - 确认是否在安静环境中录音
   - 检查录音时长是否合适

4. **网络超时**
   - 检查网络连接
   - 确认防火墙设置
   - 尝试切换网络环境

## 更新日志

### v3 API升级 (最新)
- ✅ 升级到豆包语音识别API v3版本
- ✅ 更新API端点: `https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit`
- ✅ 更新请求数据格式以适配v3 API规范
- ✅ 更新响应处理逻辑支持新的数据结构
- ✅ 参考火山引擎官方文档进行适配

### 初始版本
- ✅ 集成豆包语音识别API
- ✅ 添加音频base64转换功能
- ✅ 实现自动重试机制
- ✅ 完善错误处理
- ✅ 添加详细日志输出

如有问题，请查看控制台日志获取详细错误信息。
