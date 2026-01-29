import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInLeft, Layout, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { CHAT_MESSAGES } from '../data/mockData';

export default function ChatDetailScreen({ route }) {
    const { conversationId } = route.params;
    const { colors } = useTheme();
    const [messages, setMessages] = useState(CHAT_MESSAGES[conversationId] || []);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
        setIsTyping(true);

        setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsTyping(false);
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                text: getAIResponse(),
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1800);
    };

    const getAIResponse = () => {
        const responses = [
            "I'm here to help! Let me process that for you. 🚀",
            "Sokka AI has found something interesting... ✨",
            "Great question! Here's a quick breakdown.",
            "That sounds fascinating! Let's explore it further.",
            "I'm on it! Here's what you need to know. 🎯",
        ];
        return responses[Math.floor(Math.random() * responses.length)];
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
                    <View style={[styles.aiAvatar, { backgroundColor: route.params?.avatarColor || colors.primary }]}>
                        <Text style={styles.aiInitials}>{route.params?.avatar || 'AI'}</Text>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    item.isUser
                        ? { backgroundColor: colors.messageUser, borderBottomRightRadius: isLast ? 8 : 32 }
                        : { backgroundColor: colors.messageAI, borderBottomLeftRadius: isLast ? 8 : 32, marginLeft: isFirst ? 0 : 48 },
                ]}>
                    <Text style={[styles.bubbleText, { color: item.isUser ? colors.messageUserText : colors.messageAIText }]}>
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
                            <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
                        ))}
                    </View>
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
                        placeholder="Ask Sokka AI anything..."
                        placeholderTextColor={colors.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.textTertiary + '20' }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="arrow-up" size={24} color={inputText.trim() ? '#FFF' : colors.textTertiary} />
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
        borderRadius: 32, // Sokka Style Pill Radius
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
