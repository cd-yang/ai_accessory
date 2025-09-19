import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import VoiceService, { Message } from '@/services/VoiceService';

const { width } = Dimensions.get('window');

interface VoiceChatProps {
  onClose?: () => void;
}

export default function VoiceChat({ onClose }: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadConversationHistory();
    return () => {
      VoiceService.destroy();
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const loadConversationHistory = async () => {
    try {
      const history = await VoiceService.getConversationHistory();
      setMessages(history);
      scrollToBottom();
    } catch (error) {
      console.error('加载对话历史失败:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVoicePress = async () => {
    try {
      if (isListening) {
        // 停止录音
        await VoiceService.stopSpeechRecognition();
        setIsListening(false);
      } else {
        // 开始录音
        setIsListening(true);
        await VoiceService.startSpeechRecognition(handleSpeechResult);
      }
    } catch (error) {
      console.error('语音操作失败:', error);
      Alert.alert('错误', '语音功能暂时不可用，请检查麦克风权限');
      setIsListening(false);
    }
  };

  const handleSpeechResult = async (text: string) => {
    try {
      setIsListening(false);
      setIsLoading(true);

      // 保存用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await VoiceService.saveMessage(userMessage);
      scrollToBottom();
      
      // 调用豆包API获取回复
      const aiResponse = await VoiceService.callDoubaoAPI(text, messages);
      
      // 保存AI回复
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      await VoiceService.saveMessage(aiMessage);
      scrollToBottom();
      
      // 播放AI回复语音
      await VoiceService.textToSpeech(aiResponse);
      
    } catch (error) {
      console.error('处理语音结果时出错:', error);
      Alert.alert('错误', '处理语音时出现问题，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      '确认清除',
      '确定要清除所有对话记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await VoiceService.clearConversationHistory();
            setMessages([]);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage,
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser 
          ? [styles.userBubble, { backgroundColor: tintColor }]
          : [styles.aiBubble, { backgroundColor: '#f0f0f0' }],
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.isUser ? '#fff' : '#333' }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: item.isUser ? 'rgba(255,255,255,0.7)' : '#999' }
        ]}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { borderBottomColor: '#e0e0e0' }]}>
        <ThemedText style={styles.title}>语音助手</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClearHistory}
          >
            <Ionicons name="trash-outline" size={24} color={textColor} />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* 语音输入区域 */}
      <View style={[styles.inputArea, { borderTopColor: '#e0e0e0' }]}>
        <View style={styles.voiceButtonContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { backgroundColor: isListening ? '#ff4444' : tintColor },
              ]}
              onPress={handleVoicePress}
              disabled={isLoading}
            >
              <Ionicons
                name={isListening ? "stop" : "mic"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <ThemedText style={styles.instruction}>
          {isListening ? '正在聆听中，请说话...' : '点击麦克风开始语音对话'}
        </ThemedText>
        
        {isLoading && (
          <ThemedText style={styles.loadingText}>
            正在处理中...
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  voiceButtonContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});