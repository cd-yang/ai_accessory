import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG, ChatMessage, DoubaoResponse } from '@/config/api';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export class VoiceService {
  private recording: Audio.Recording | null = null;
  private isListening = false;
  private speechResultCallback: ((text: string) => void) | null = null;

  constructor() {
    this.setupVoiceRecognition();
  }

  private setupVoiceRecognition() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
  }

  private onSpeechStart = () => {
    console.log('语音识别开始');
  };

  private onSpeechEnd = () => {
    console.log('语音识别结束');
    this.isListening = false;
  };

  private onSpeechResults = (e: any) => {
    console.log('语音识别结果:', e.value);
    if (e.value && e.value[0] && this.speechResultCallback) {
      this.speechResultCallback(e.value[0]);
    }
  };

  private onSpeechError = (e: any) => {
    console.error('语音识别错误:', e.error);
    this.isListening = false;
  };

  // 开始录音
  async startRecording(): Promise<void> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('需要麦克风权限');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
    } catch (error) {
      console.error('开始录音失败:', error);
      throw error;
    }
  }

  // 停止录音并获取文件URI
  async stopRecording(): Promise<string | null> {
    if (!this.recording) {
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (error) {
      console.error('停止录音失败:', error);
      return null;
    }
  }

  // 开始语音识别
  async startSpeechRecognition(onResult?: (text: string) => void): Promise<void> {
    try {
      if (this.isListening) {
        await Voice.stop();
      }

      this.speechResultCallback = onResult || null;
      this.isListening = true;
      await Voice.start('zh-CN'); // 设置中文识别
    } catch (error) {
      console.error('开始语音识别失败:', error);
      this.isListening = false;
      throw error;
    }
  }

  // 停止语音识别
  async stopSpeechRecognition(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
  }

  // 文本转语音
  async textToSpeech(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('文本转语音失败:', error);
    }
  }

  // 调用豆包API
  async callDoubaoAPI(text: string, conversationHistory: Message[] = []): Promise<string> {
    try {
      // 构建消息历史
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: '你是一个友善、有帮助的AI助手。请用中文回复，回答要简洁明了。'
        }
      ];

      // 添加最近的对话历史（最多保留最近10轮对话）
      const recentHistory = conversationHistory.slice(-20);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        });
      });

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: text
      });

      const response = await axios.post<DoubaoResponse>(
        `${API_CONFIG.DOUBAO.BASE_URL}/chat/completions`,
        {
          model: API_CONFIG.DOUBAO.MODEL,
          messages,
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.DOUBAO.API_KEY}`,
            ...API_CONFIG.DEFAULT_HEADERS
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      return response.data.choices[0]?.message?.content || '抱歉，我没有收到有效的回复。';
    } catch (error) {
      console.error('调用豆包API失败:', error);
      // 返回默认回复
      return '抱歉，我暂时无法连接到服务器，请稍后再试。';
    }
  }

  // 保存消息到本地存储
  async saveMessage(message: Message): Promise<void> {
    try {
      const existingMessages = await this.getConversationHistory();
      const updatedMessages = [...existingMessages, message];
      await AsyncStorage.setItem('conversation_history', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  }

  // 获取对话历史
  async getConversationHistory(): Promise<Message[]> {
    try {
      const history = await AsyncStorage.getItem('conversation_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('获取对话历史失败:', error);
      return [];
    }
  }

  // 清除对话历史
  async clearConversationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('conversation_history');
    } catch (error) {
      console.error('清除对话历史失败:', error);
    }
  }

  // 获取当前是否正在监听
  getIsListening(): boolean {
    return this.isListening;
  }

  // 清理资源
  destroy(): void {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export default new VoiceService();
