import { API_CONFIG, ChatMessage, DoubaoResponse, DoubaoSpeechResponse } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError } from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export class VoiceService {
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

    // 将音频文件转换为base64编码
    private async convertAudioToBase64(audioUri: string): Promise<string> {
        try {
            const base64 = await FileSystem.readAsStringAsync(audioUri, {
                encoding: 'base64',
            });
            return base64;
        } catch (error) {
            console.error('音频文件转换为base64失败:', error);
            throw new Error('音频文件格式转换失败');
        }
    }

    // 带重试机制的语音识别API调用
    private async callSpeechRecognitionWithRetry(requestData: any, maxRetries: number = 3): Promise<DoubaoSpeechResponse> {
        let lastError: Error = new Error('未知错误');

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`语音识别API调用尝试 ${attempt}/${maxRetries}`);

                // 生成UUID作为请求ID
                const requestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                const response = await axios.post<DoubaoSpeechResponse>(
                    API_CONFIG.DOUBAO_SPEECH.BASE_URL,
                    requestData,
                    {
                        headers: {
                            // 'Content-Type': 'application/json',
                            // 'Accept': 'application/json',
                            'X-Api-App-Key': API_CONFIG.DOUBAO_SPEECH.APP_ID,
                            'X-Api-Access-Key': API_CONFIG.DOUBAO_SPEECH.ACCESS_TOKEN,
                            // 'X-Api-Resource-Id': 'volc.bigasr.auc',
                            'X-Api-Resource-Id': 'volc.bigasr.auc_turbo',
                            'X-Api-Request-Id': requestId,
                            'X-Api-Sequence': '-1',
                        },
                        timeout: API_CONFIG.TIMEOUT,
                    }
                );
                return response.data;
            } catch (error) {
                lastError = error as Error;
                console.error(`语音识别API调用尝试 ${attempt} 失败:`, error);

                // 详细记录错误信息
                if (isAxiosError(error)) {
                    console.error('错误状态码:', error.response?.status);
                    console.error('错误响应数据:', error.response?.data);
                    console.error('错误请求配置:', error.config);

                    if (error.response?.status === 401 || error.response?.status === 429) {
                        break;
                    }
                }

                // 如果不是最后一次尝试，等待后重试
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
                    console.log(`等待 ${delay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    // 豆包语音识别API调用
    async convertSpeechToText(audioUri: string): Promise<string> {
        try {
            console.log('开始语音识别，文件路径:', audioUri);

            // 将音频文件转换为base64
            const audioBase64 = await this.convertAudioToBase64(audioUri);
            console.log('音频base64长度:', audioBase64.length);

            // 检查base64数据大小（建议不超过10MB）
            if (audioBase64.length > 10 * 1024 * 1024) {
                throw new Error('音频文件过大，请录制较短的音频');
            }

            // 构建请求数据 - v3 API格式
            const requestData = {
                audio: {
                    format: 'wav',
                    // sample_rate: 16000,
                    // channel: 1,
                    // language: 'zh-CN',
                    // bits: 16,
                    data: audioBase64,
                },
            };

            console.log('发送语音识别请求...');
            // console.log('请求数据:', JSON.stringify(requestData, null, 2));

            // 调用带重试机制的语音识别API
            const response = await this.callSpeechRecognitionWithRetry(requestData);

            console.log('语音识别响应:', response);

            // 检查响应状态 - v3 API格式
            if (response.result?.text) {
                return response.result.text;
            } else {
                console.error('语音识别失败:', response);
                throw new Error(response.result?.text || '语音识别失败');
            }

        } catch (error) {
            console.error('语音识别失败:', error);

            // 如果是网络错误或API错误，返回友好的错误信息
            if (isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('语音识别超时，请检查网络连接');
                } else if (error.response?.status === 401) {
                    throw new Error('语音识别服务认证失败，请检查配置');
                } else if (error.response?.status === 429) {
                    throw new Error('语音识别请求过于频繁，请稍后再试');
                } else {
                    throw new Error('语音识别服务暂时不可用，请稍后再试');
                }
            }

            throw error;
        }
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

export default new VoiceService();
