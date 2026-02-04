import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInLeft, Layout, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { sendMessageToAI } from '../services/api';

export default function ChatDetailScreen({ route }) {
    const { conversationId, title } = route.params;
    const { colors } = useTheme();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isError, setIsError] = useState(false);
    const flatListRef = useRef(null);

    // Add welcome message on first load
    useEffect(() => {
        const welcomeMessage = {
            id: 'welcome',
            text: `Halo! 👋 Saya Akbar AI, asisten virtual Anda. Ada yang bisa saya bantu hari ini?`,
            isUser: false,
            timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsError(false);

        const userMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        // Add user message to chat
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText('');
        setIsTyping(true);

        // Call AI API
        const result = await sendMessageToAI(inputText.trim(), updatedMessages);

        setIsTyping(false);

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                text: result.response,
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsError(true);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `⚠️ ${result.error}`,
                isUser: false,
                timestamp: new Date(),
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleRetry = () => {
        // Remove last error message and retry
        const lastUserMessageIndex = messages.map(m => m.isUser).lastIndexOf(true);
        if (lastUserMessageIndex >= 0) {
            const lastUserMessage = messages[lastUserMessageIndex];
            // Remove error message
            setMessages(prev => prev.filter(m => !m.isError));
            setInputText(lastUserMessage.text);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isFirst = index === 0 || messages[index - 1].isUser !== item.isUser;
        const isLast = index === messages.length - 1 || messages[index + 1]?.isUser !== item.isUser;

        return (
            <Animated.View
                entering={item.isUser ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
                layout={Layout.springify()}
                style={[
                    styles.messageRow,
                    item.isUser ? styles.userRow : styles.aiRow,
                    isFirst && { marginTop: 16 },
                ]}
            >
                {!item.isUser && isFirst && (
                    <View style={[styles.aiAvatar, { backgroundColor: item.isError ? '#EF4444' : (route.params?.avatarColor || colors.primary) }]}>
                        <Text style={styles.aiInitials}>{item.isError ? '!' : (route.params?.avatar || 'AI')}</Text>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    item.isUser
                        ? { backgroundColor: colors.messageUser, borderBottomRightRadius: isLast ? 8 : 32 }
                        : {
                            backgroundColor: item.isError ? '#FEE2E2' : colors.messageAI,
                            borderBottomLeftRadius: isLast ? 8 : 32,
                            marginLeft: isFirst ? 0 : 48
                        },
                ]}>
                    <Text style={[styles.bubbleText, { color: item.isUser ? colors.messageUserText : (item.isError ? '#991B1B' : colors.messageAIText) }]}>
                        {item.text}
                    </Text>
                    <View style={styles.bubbleFooter}>
                        <Text style={[styles.bubbleTime, { color: item.isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                            {formatTime(item.timestamp)}
                        </Text>
                        {item.isUser && (
                            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                        )}
                    </View>
                </View>

                {item.isError && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleRetry}
                    >
                        <Ionicons name="refresh" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </Animated.View>
        );
    };

    const renderTyping = () => {
        if (!isTyping) return null;

        return (
            <Animated.View
                entering={FadeInLeft.duration(400)}
                style={[styles.messageRow, styles.aiRow, { marginTop: 16 }]}
            >
                <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.aiInitials}>AI</Text>
                </View>
                <View style={[styles.typingBubble, { backgroundColor: colors.messageAI }]}>
                    <View style={styles.typingDots}>
                        {[0, 1, 2].map((i) => (
                            <Animated.View
                                key={i}
                                style={[styles.dot, { backgroundColor: colors.primary }]}
                            />
                        ))}
                    </View>
                    <Text style={[styles.typingText, { color: colors.textTertiary }]}>
                        Akbar AI sedang mengetik...
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={renderTyping}
            />

            <View style={[styles.inputArea, { backgroundColor: colors.background }]}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Tanya Akbar AI apa saja..."
                        placeholderTextColor={colors.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!isTyping}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            { backgroundColor: inputText.trim() && !isTyping ? colors.primary : colors.textTertiary + '20' }
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isTyping}
                    >
                        {isTyping ? (
                            <Ionicons name="hourglass-outline" size={24} color={colors.textTertiary} />
                        ) : (
                            <Ionicons name="arrow-up" size={24} color={inputText.trim() ? '#FFF' : colors.textTertiary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 24, paddingBottom: 16 },
    messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    aiAvatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    aiInitials: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    bubble: {
        maxWidth: '82%',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 32,
    },
    bubbleText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
    bubbleFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-end' },
    bubbleTime: { fontSize: 11, fontWeight: '600' },
    typingBubble: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 32,
        borderBottomLeftRadius: 8,
    },
    typingDots: { flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    typingText: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic'
    },
    retryButton: {
        marginLeft: 8,
        padding: 8,
    },
    inputArea: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 32,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        paddingHorizontal: 16,
        maxHeight: 120,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
