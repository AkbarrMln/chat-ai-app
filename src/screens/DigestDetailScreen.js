import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Share,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { getDigestDetail } from '../services/api';

export default function DigestDetailScreen({ route }) {
    const { colors } = useTheme();
    const { digestId, deviceId } = route.params;

    const [loading, setLoading] = useState(true);
    const [digest, setDigest] = useState(null);

    useEffect(() => {
        loadDigest();
    }, [digestId]);

    const loadDigest = async () => {
        try {
            const result = await getDigestDetail(deviceId, digestId);
            if (result.success) {
                setDigest(result.digest);
            }
        } catch (error) {
            console.error('Error loading digest:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const handleShare = async () => {
        if (!digest) return;

        try {
            let shareContent = `📰 Daily Digest: ${digest.topic}\n\n${digest.content}`;

            // Add sources to share content
            if (digest.sources && digest.sources.length > 0) {
                shareContent += '\n\n📚 Sumber:\n';
                digest.sources.forEach((source, i) => {
                    shareContent += `${i + 1}. ${source.title}: ${source.url}\n`;
                });
            }

            shareContent += '\n— Dibuat dengan Akbar AI';

            await Share.share({
                message: shareContent,
                title: `Daily Digest - ${digest.topic}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const openSource = async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    // Simple markdown-like rendering
    const renderContent = (content) => {
        const lines = content.split('\n');

        return lines.map((line, index) => {
            const trimmed = line.trim();

            // Headers
            if (trimmed.startsWith('##')) {
                return (
                    <Text key={index} style={[styles.heading2, { color: colors.text }]}>
                        {trimmed.replace(/^##\s*/, '')}
                    </Text>
                );
            }
            if (trimmed.startsWith('#')) {
                return (
                    <Text key={index} style={[styles.heading1, { color: colors.text }]}>
                        {trimmed.replace(/^#\s*/, '')}
                    </Text>
                );
            }

            // Bold text with **
            if (trimmed.includes('**')) {
                const parts = trimmed.split(/\*\*(.*?)\*\*/g);
                return (
                    <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
                        {parts.map((part, i) =>
                            i % 2 === 1 ? (
                                <Text key={i} style={styles.bold}>{part}</Text>
                            ) : part
                        )}
                    </Text>
                );
            }

            // Bullet points
            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                return (
                    <View key={index} style={styles.bulletContainer}>
                        <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.bulletText, { color: colors.text }]}>
                            {trimmed.replace(/^[-•]\s*/, '')}
                        </Text>
                    </View>
                );
            }

            // Empty lines
            if (!trimmed) {
                return <View key={index} style={{ height: 8 }} />;
            }

            // Regular paragraph
            return (
                <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
                    {trimmed}
                </Text>
            );
        });
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!digest) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
                <Text style={[styles.errorText, { color: colors.text }]}>Digest tidak ditemukan</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                <View style={[styles.topicBadge, { backgroundColor: colors.primaryBg }]}>
                    <Ionicons name={getTopicIcon(digest.topic)} size={20} color={colors.primary} />
                    <Text style={[styles.topicText, { color: colors.primary }]}>{digest.topic}</Text>
                </View>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {formatDate(digest.createdAt)}
                </Text>
            </Animated.View>

            {/* Content */}
            <Animated.View
                entering={FadeInDown.delay(100).duration(600)}
                style={[styles.contentCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                {renderContent(digest.content)}
            </Animated.View>

            {/* Sources Section */}
            {digest.sources && digest.sources.length > 0 && (
                <Animated.View
                    entering={FadeInDown.delay(150).duration(600)}
                    style={[styles.sourcesCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                    <View style={styles.sourcesHeader}>
                        <Ionicons name="library" size={20} color={colors.primary} />
                        <Text style={[styles.sourcesTitle, { color: colors.text }]}>
                            Sumber Berita ({digest.sources.length})
                        </Text>
                    </View>
                    {digest.sources.map((source, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.sourceItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => openSource(source.url)}
                        >
                            <View style={styles.sourceInfo}>
                                <Ionicons name="link" size={16} color={colors.primary} />
                                <Text style={[styles.sourceTitle, { color: colors.text }]} numberOfLines={1}>
                                    {source.title || `Sumber ${index + 1}`}
                                </Text>
                            </View>
                            <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}

            {/* Share Button */}
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.shareButton, { backgroundColor: colors.primary }]}
                    onPress={handleShare}
                >
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Bagikan Digest</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, marginTop: 16 },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    topicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 8,
    },
    topicText: {
        fontSize: 16,
        fontWeight: '700',
    },
    dateText: {
        fontSize: 13,
    },
    contentCard: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    heading1: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
        marginTop: 8,
    },
    heading2: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 8,
        marginTop: 16,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 8,
    },
    bold: {
        fontWeight: '700',
    },
    bulletContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '700',
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    // Sources section
    sourcesCard: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    sourcesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sourcesTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    sourceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    sourceTitle: {
        fontSize: 14,
        flex: 1,
    },
    actionContainer: {
        padding: 16,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    shareButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
