// API配置文件
export const API_CONFIG = {
  // 豆包API配置
  DOUBAO: {
    BASE_URL: 'https://ark.cn-beijing.volces.com/api/v3',
    MODEL: 'doubao-seed-1-6-flash-250828',
    API_KEY: process.env.EXPO_PUBLIC_DOUBAO_API_KEY || 'YOUR_API_KEY_HERE',
  },

  // 豆包语音识别配置
  DOUBAO_SPEECH: {
    // BASE_URL: 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit', // 录音文件识别 API
    BASE_URL: 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash', // 录音文件极速版识别 API
    APP_ID: process.env.EXPO_PUBLIC_DOUBAO_SPEECH_APP_ID || 'YOUR_APP_ID_HERE',
    ACCESS_TOKEN: process.env.EXPO_PUBLIC_DOUBAO_SPEECH_ACCESS_TOKEN || 'YOUR_TOKEN_HERE',
  },

  // 默认请求配置
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },

  // 超时设置
  TIMEOUT: 30000,
};

// 消息类型
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// API响应类型
export interface DoubaoResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 语音识别响应类型 - v3 API格式
export interface DoubaoSpeechResponse {
  audio_info: {
    duration: number;
  },
  result?: {
    addtions: {
      duration: number;
    };
    text: string;
    utterances?: {
      text: string;
      start_time: number;
      end_time: number;
      words: {
        confidence: number;
        text: string;
        start_time: number;
        end_time: number;
      }[];
    }[];
  };
}
