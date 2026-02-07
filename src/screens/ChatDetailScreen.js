import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeInLeft, Layout, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
    subscribeToMessages,
    subscribeToTyping,
    sendTypingIndicator,
    subscribeToPresence,
    unsubscribeFromRoom,
    fetchMessages,
    sendMessage,
} from '../services/realtimeService';

export default function ChatDetailScreen({ route, navigation }) {
    const { roomId, title } = route.params;
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const flatListRef = useRef(null);
    const typingTimeout = useRef(null);
    const appState = useRef(AppState.currentState);

    const username = profile?.username || user?.email?.split('@')[0] || 'User';

    // Load messages and subscribe to realtime
    useEffect(() => {
        loadMessages();

        // Subscribe to new messages
        subscribeToMessages(roomId, (newMessage) => {
            if (newMessage.user_id !== user?.id) {
                setMessages(prev => [...prev, newMessage]);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        });

        // Subscribe to typing indicators
        subscribeToTyping(roomId, (payload) => {
            if (payload.userId !== user?.id) {
                if (payload.isTyping) {
                    setTypingUsers(prev => {
                        if (!prev.find(u => u.userId === payload.userId)) {
                            return [...prev, payload];
                        }
                        return prev;
                    });
                } else {
                    setTypingUsers(prev => prev.filter(u => u.userId !== payload.userId));
                }
            }
        });

        // Subscribe to presence
        subscribeToPresence(roomId, user?.id, username, (users) => {
            setOnlineUsers(users);
        });

        // Handle app state changes
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            // Cleanup channels
            unsubscribeFromRoom(roomId);
            subscription.remove();
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
        };
    }, [roomId]);

    const handleAppStateChange = useCallback(async (nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground - refresh messages
            await loadMessages();
        }
        appState.current = nextAppState;
    }, []);

    const loadMessages = async () => {
        try {
            const { data, error } = await fetchMessages(roomId);
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
            showToast('error', 'Error', 'Gagal memuat pesan');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleInputChange = (text) => {
        setInputText(text);

        // Send typing indicator
        if (text.trim()) {
            sendTypingIndicator(roomId, user?.id, username, true);

            // Clear previous timeout
            if (typingTimeout.current) clearTimeout(typingTimeout.current);

            // Stop typing after 2 seconds of no input
            typingTimeout.current = setTimeout(() => {
                sendTypingIndicator(roomId, user?.id, username, false);
            }, 2000);
        } else {
            sendTypingIndicator(roomId, user?.id, username, false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSending(true);

        // Stop typing indicator
        sendTypingIndicator(roomId, user?.id, username, false);

        try {
            const { data, error } = await sendMessage(roomId, user?.id, inputText.trim());

            if (error) throw error;

            // Add message locally (realtime will also receive it but we filter duplicates)
            setMessages(prev => [...prev, data]);
            setInputText('');

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            showToast('error', 'Gagal Kirim', error.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item, index }) => {
        const isUser = item.user_id === user?.id;
        const isFirst = index === 0 || messages[index - 1]?.user_id !== item.user_id;
        const isLast = index === messages.length - 1 || messages[index + 1]?.user_id !== item.user_id;

        const senderName = item.profiles?.full_name || item.profiles?.username || 'User';

        return (
            <Animated.View
                entering={isUser ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
                layout={Layout.springify()}
                style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.aiRow,
                    isFirst && { marginTop: 16 },
                ]}
            >
                {!isUser && isFirst && (
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>
                            {senderName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: colors.messageUser, borderBottomRightRadius: isLast ? 8 : 32 }
                        : {
                            backgroundColor: colors.messageAI,
                            borderBottomLeftRadius: isLast ? 8 : 32,
                            marginLeft: isFirst ? 0 : 48
                        },
                ]}>
                    {!isUser && isFirst && (
                        <Text style={[styles.senderName, { color: colors.primary }]}>
                            {senderName}
                        </Text>
                    )}
                    <Text style={[styles.bubbleText, { color: isUser ? colors.messageUserText : colors.messageAIText }]}>
                        {item.content}
                    </Text>
                    <View style={styles.bubbleFooter}>
                        <Text style={[styles.bubbleTime, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                            {formatTime(item.created_at)}
                        </Text>
                        {isUser && (
                            <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    const renderTypingIndicator = () => {
        if (typingUsers.length === 0) return null;

        const typingNames = typingUsers.map(u => u.username).join(', ');

        return (
            <Animated.View
                entering={FadeInLeft.duration(400)}
                style={[styles.messageRow, styles.aiRow, { marginTop: 16 }]}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#FFF" />
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
                        {typingNames} sedang mengetik...
                    </Text>
                </View>
            </Animated.View>
        );
    };

    // Update header with online count
    useEffect(() => {
        navigation.setOptions({
            title: title,
            headerRight: () => (
                <View style={styles.headerRight}>
                    <View style={[styles.onlineBadge, { backgroundColor: '#4ADE8020' }]}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineCount}>{onlineUsers.length}</Text>
                    </View>
                </View>
            ),
        });
    }, [onlineUsers, title]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Memuat pesan...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Online Users Bar */}
            {onlineUsers.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={[styles.onlineBar, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.onlineBarText, { color: colors.textSecondary }]}>
                        🟢 {onlineUsers.length} online: {onlineUsers.map(u => u.username).join(', ')}
                    </Text>
                </Animated.View>
            )}

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={renderTypingIndicator}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Mulai percakapan!
                        </Text>
                    </View>
                }
            />

            <View style={[styles.inputArea, { backgroundColor: colors.background }]}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Ketik pesan..."
                        placeholderTextColor={colors.textTertiary}
                        value={inputText}
                        onChangeText={handleInputChange}
                        multiline
                        maxLength={1000}
                        editable={!sending}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            { backgroundColor: inputText.trim() && !sending ? colors.primary : colors.textTertiary + '20' }
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator color={colors.textTertiary} size="small" />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    headerRight: {
        marginRight: 8,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ADE80',
    },
    onlineCount: {
        color: '#4ADE80',
        fontSize: 12,
        fontWeight: '600',
    },
    onlineBar: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    onlineBarText: {
        fontSize: 12,
    },
    list: { padding: 24, paddingBottom: 16 },
    messageRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    bubble: {
        maxWidth: '82%',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 32,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
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
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
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
