import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    TextInput,
    StatusBar,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { fetchUserRooms, createRoom, deleteRoom } from '../services/realtimeService';

export default function ConversationListScreen({ navigation }) {
    const { colors } = useTheme();
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    const [rooms, setRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [creating, setCreating] = useState(false);

    // Load rooms on mount
    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const { data, error } = await fetchUserRooms();
            if (error) throw error;
            setRooms(data || []);
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRefreshing(true);
        await loadRooms();
        setRefreshing(false);
    }, []);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) {
            showToast('warning', 'Nama room diperlukan', 'Masukkan nama untuk room baru');
            return;
        }

        setCreating(true);
        try {
            const { data, error } = await createRoom(newRoomName.trim());
            if (error) throw error;

            showToast('success', 'Room Dibuat! 🎉', `Room "${newRoomName}" berhasil dibuat`);
            setNewRoomName('');
            setShowCreateModal(false);
            await loadRooms();

            // Navigate to new room
            if (data) {
                navigation.navigate('ChatDetail', {
                    roomId: data,
                    title: newRoomName.trim(),
                });
            }
        } catch (error) {
            showToast('error', 'Gagal membuat room', error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteRoom = (room) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        showToast('confirm', 'Hapus Room?', `Room "${room.name}" akan dihapus permanen beserta semua pesan`, {
            onConfirm: async () => {
                try {
                    const { error } = await deleteRoom(room.id);
                    if (error) throw error;

                    setRooms(prev => prev.filter(r => r.id !== room.id));
                    showToast('success', 'Berhasil! 🗑️', `Room "${room.name}" telah dihapus`);
                } catch (error) {
                    showToast('error', 'Gagal Hapus', error.message);
                }
            }
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
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

    const filteredRooms = rooms.filter(room =>
        room?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        roomId: item.id,
                        title: item.name,
                    });
                }}
                onLongPress={() => handleDeleteRoom(item)}
                delayLongPress={500}
                activeOpacity={0.7}
            >
                <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
                    <Ionicons name={item.type === 'direct' ? 'person' : 'people'} size={24} color={colors.primary} />
                </View>

                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.time, { color: colors.textTertiary }]}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text
                            style={[styles.preview, { color: colors.textSecondary }]}
                            numberOfLines={1}
                        >
                            {item.type === 'group' ? '👥 Group Chat' : '💬 Direct Message'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleDeleteRoom(item)}
                            style={styles.deleteBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

    const HeaderComponent = () => (
        <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greetingText}>Hello {displayName} 👋</Text>
                    <Text style={styles.welcomeText}>Real-Time Chat</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={20} color="#95969D" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search rooms..."
                        placeholderTextColor="#95969D"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{rooms.length}</Text>
                    <Text style={styles.statLabel}>Rooms</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={[styles.onlineDot, { backgroundColor: '#4ADE80' }]} />
                    <Text style={styles.statLabel}>Online</Text>
                </View>
            </View>
        </View>
    );

    const EmptyComponent = () => (
        <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Room</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Buat room baru untuk mulai chat real-time!
            </Text>
        </Animated.View>
    );

    // Create Room Modal
    const CreateRoomModal = () => (
        <Modal
            visible={showCreateModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCreateModal(false)}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={[styles.modalContent, { backgroundColor: colors.surface }]}
                >
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Buat Room Baru</Text>

                    <TextInput
                        style={[styles.modalInput, {
                            backgroundColor: colors.surfaceSecondary,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        placeholder="Nama Room"
                        placeholderTextColor={colors.textTertiary}
                        value={newRoomName}
                        onChangeText={setNewRoomName}
                        autoFocus
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={() => setShowCreateModal(false)}
                        >
                            <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                            onPress={handleCreateRoom}
                            disabled={creating}
                        >
                            {creating ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Buat</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading rooms...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={filteredRooms}
                renderItem={renderItem}
                ListHeaderComponent={HeaderComponent}
                ListEmptyComponent={EmptyComponent}
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

            {/* FAB - Create Room */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowCreateModal(true);
                }}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>

            <CreateRoomModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
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
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchWrapper: {
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statValue: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
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
        flex: 1,
    },
    time: {
        fontSize: 12,
        fontWeight: '500',
    },
    preview: {
        fontSize: 13,
        flex: 1,
    },
    deleteBtn: {
        padding: 4,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
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
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
