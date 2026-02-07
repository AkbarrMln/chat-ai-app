import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { getDigestHistory } from '../services/api';
import { getDeviceId } from '../services/notificationService';

export default function DigestHistoryScreen({ navigation }) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState([]);
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        initAndLoad();
    }, []);

    const initAndLoad = async () => {
        const id = await getDeviceId();
        setDeviceId(id);
        await loadHistory(id);
    };

    const loadHistory = async (id) => {
        try {
            const result = await getDigestHistory(id || deviceId);
            if (result.success) {
                setHistory(result.history);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadHistory(deviceId);
    }, [deviceId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (days === 0) {
            return 'Hari ini, ' + timeStr;
        } else if (days === 1) {
            return 'Kemarin, ' + timeStr;
        } else if (days < 7) {
            return `${days} hari lalu, ${timeStr}`;
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const getTopicIcon = (topic) => {
        const icons = {
            'Teknologi': 'hardware-chip',
            'Bisnis': 'briefcase',
            'Olahraga': 'football',
            'Hiburan': 'film',
            'Politik': 'megaphone',
            'Kesehatan': 'medkit',
            'Gaming': 'game-controller',
        };
        return icons[topic] || 'newspaper';
    };

    const getPreview = (content) => {
        // Get first meaningful line that's not a header
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#') && !line.startsWith('📰'));
        const preview = lines[0] || 'Ringkasan berita harian';
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
    };

    const renderItem = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                onPress={() => navigation.navigate('DigestDetail', { digestId: item.id, deviceId })}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryBg }]}>
                    <Ionicons name={getTopicIcon(item.topic)} size={24} color={colors.primary} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={[styles.topic, { color: colors.primary }]}>{item.topic}</Text>
                        <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>
                        {getPreview(item.content)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
        </Animated.View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Digest</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aktifkan Daily Digest untuk mulai menerima ringkasan berita otomatis
            </Text>
            <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('DigestSettings')}
            >
                <Ionicons name="settings" size={20} color="#FFFFFF" />
                <Text style={styles.settingsButtonText}>Atur Digest</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    topic: {
        fontSize: 14,
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
    },
    preview: {
        fontSize: 14,
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    settingsButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
