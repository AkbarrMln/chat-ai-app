import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    TextInput,
    StatusBar,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { CONVERSATIONS, CATEGORIES } from '../data/mockData';

export default function ConversationListScreen({ navigation }) {
    const { colors } = useTheme();
    const [conversations, setConversations] = useState(CONVERSATIONS);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const onRefresh = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        setTimeout(() => {
            setConversations([...CONVERSATIONS]);
            setRefreshing(false);
        }, 1500);
    }, []);

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days === 1) return 'Yesterday';
        return `${days}d`;
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const renderItem = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 80).duration(500)}
            layout={Layout.springify()}
        >
            <TouchableOpacity
                style={[styles.card, {
                    backgroundColor: colors.surface,
                    shadowColor: colors.shadowColor,
                    borderColor: colors.border,
                }]}
                onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('ChatDetail', {
                        conversationId: item.id,
                        title: item.title,
                        avatar: item.avatar,
                        avatarColor: item.avatarColor || colors.primary
                    });
                }}
                activeOpacity={0.7}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{item.avatar}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[styles.time, { color: colors.textTertiary }]}>
                            {formatTime(item.timestamp)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text
                            style={[styles.preview, { color: colors.textSecondary }]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                        {item.unread && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.unreadCount}>1</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const HeaderComponent = () => (
        <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greetingText}>Hello Akbar Maulana 👋</Text>
                    <Text style={styles.welcomeText}>AI Chat Assistant</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                    <View style={styles.notifDot} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={20} color="#95969D" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        placeholderTextColor="#95969D"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="options-outline" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Category Chips ScrollView */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCategory(cat);
                        }}
                        style={[
                            styles.categoryChip,
                            {
                                backgroundColor: selectedCategory === cat ? '#FFF' : 'rgba(255, 255, 255, 0.2)',
                                borderColor: selectedCategory === cat ? '#FFF' : 'rgba(255, 255, 255, 0.3)',
                                borderWidth: 1
                            }
                        ]}
                    >
                        <Text style={[
                            styles.categoryText,
                            { color: selectedCategory === cat ? colors.primary : '#FFF' }
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={filteredConversations}
                renderItem={renderItem}
                ListHeaderComponent={HeaderComponent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('ChatDetail', {
                        conversationId: `new-${Date.now()}`,
                        title: 'Akbar AI',
                        avatar: '🤖',
                        avatarColor: colors.primary
                    });
                }}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 24,
    },
    greetingText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    welcomeText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '700',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9228',
        borderWidth: 1.5,
        borderColor: '#356899',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#150B3D',
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryScroll: {
        marginTop: 4,
    },
    categoryContent: {
        paddingHorizontal: 24,
        gap: 10,
        flexDirection: 'row', // Explicitly ensure row for web/native consistency
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '700',
    },
    list: {
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginHorizontal: 24,
        marginTop: 16,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        marginLeft: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    time: {
        fontSize: 12,
        fontWeight: '500',
    },
    preview: {
        fontSize: 13,
        flex: 1,
        marginRight: 8,
    },
    unreadBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        minWidth: 20,
        alignItems: 'center',
    },
    unreadCount: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#356899',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
});
