import { API_CONFIG, ChatMessage, DoubaoResponse } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export class VoiceServiceExpo {
    private recording: Audio.Recording | null = null;
    private isRecording = false;

    constructor() {
        // 初始化音频模式
        this.setupAudio();
    }

    private async setupAudio() {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        } catch (error) {
            console.error('设置音频模式失败:', error);
        }
    }

    // 开始录音
    async startRecording(): Promise<void> {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                throw new Error('需要麦克风权限');
            }

            if (this.recording) {
                await this.recording.stopAndUnloadAsync();
            }

            const { recording } = await Audio.Recording.createAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                android: {
                    extension: '.wav',
                    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
                    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
                    audioQuality: Audio.IOSAudioQuality.HIGH,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
            });

            this.recording = recording;
            this.isRecording = true;
            console.log('开始录音...');
        } catch (error) {
            console.error('开始录音失败:', error);
            this.isRecording = false;
            throw error;
        }
    }

    // 停止录音并获取文件URI
    async stopRecording(): Promise<string | null> {
        if (!this.recording || !this.isRecording) {
            return null;
        }

        try {
            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI();
            this.recording = null;
            this.isRecording = false;
            console.log('录音完成:', uri);
            return uri;
        } catch (error) {
            console.error('停止录音失败:', error);
            this.isRecording = false;
            return null;
        }
    }

    // 模拟语音识别 - 这里可以集成云端语音识别服务
    async convertSpeechToText(audioUri: string): Promise<string> {
        // 这里应该调用语音识别API，比如百度、腾讯、阿里云等
        // 现在返回一个占位符
        console.log('语音文件路径:', audioUri);

        // 模拟语音识别结果
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('这是语音识别的模拟结果，请集成真实的语音识别服务');
            }, 1000);
        });
    }

    // 便捷方法：录音并识别
    async recordAndRecognize(onResult: (text: string) => void): Promise<void> {
        try {
            await this.startRecording();

            // 这里可以添加录音时长限制或者用户手动停止
            // 现在设置为3秒自动停止
            setTimeout(async () => {
                const audioUri = await this.stopRecording();
                if (audioUri) {
                    const text = await this.convertSpeechToText(audioUri);
                    onResult(text);
                }
            }, 3000);

        } catch (error) {
            console.error('录音识别失败:', error);
            throw error;
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

    // 获取当前是否正在录音
    getIsRecording(): boolean {
        return this.isRecording;
    }

    // 清理资源
    async destroy(): Promise<void> {
        if (this.recording) {
            try {
                await this.recording.stopAndUnloadAsync();
            } catch (error) {
                console.error('清理录音资源失败:', error);
            }
        }
    }
}

export default new VoiceServiceExpo();
