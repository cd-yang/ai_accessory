// API配置文件
export const API_CONFIG = {
  // 豆包API配置
  DOUBAO: {
    BASE_URL: 'https://ark.cn-beijing.volces.com/api/v3',
    MODEL: 'doubao-pro-4k',
    API_KEY: process.env.EXPO_PUBLIC_DOUBAO_API_KEY || 'YOUR_API_KEY_HERE',
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
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}