import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const PROFILE_MENU_ITEMS = [
    { id: 1, label: 'Edit Profile', icon: 'person-outline', hasArrow: true },
    { id: 2, label: 'Notifications', icon: 'notifications-outline', hasArrow: true },
    { id: 3, label: 'Help Center', icon: 'help-circle-outline', hasArrow: true },
    { id: 4, label: 'About', icon: 'information-circle-outline', hasArrow: true },
];

export default function ProfileScreen() {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const { user, profile, signOut } = useAuth();
    const { showToast } = useToast();
    const [loggingOut, setLoggingOut] = useState(false);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const { error } = await signOut();
            if (error) {
                showToast('error', 'Logout Gagal', error.message);
            } else {
                showToast('success', 'Sampai Jumpa! 👋', 'Logout berhasil');
            }
        } catch (error) {
            showToast('error', 'Error', 'Terjadi kesalahan saat logout');
        } finally {
            setLoggingOut(false);
        }
    };

    const MenuItem = ({ item, index }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(400 + index * 50).duration(400)}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                    onPress={() => showToast('info', item.label, 'Fitur coming soon!')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.menuIcon, { backgroundColor: colors.primaryBg }]}>
                        <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>
                        {item.label}
                    </Text>
                    {item.hasArrow && (
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Get display name and email from auth or profile
    const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
    const displayEmail = user?.email || 'No email';

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header */}
            <Animated.View
                entering={FadeInDown.duration(600)}
                style={styles.headerContainer}
            >
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail}</Text>

                {/* Online Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.statusText, { color: colors.success }]}>Online</Text>
                </View>
            </Animated.View>

            {/* Theme Card */}
            <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={[styles.themeCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                <View style={styles.themeInfo}>
                    <View style={[styles.themeIcon, { backgroundColor: colors.primaryBg }]}>
                        <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={[styles.themeLabel, { color: colors.text }]}>
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={isDarkMode ? colors.primary : '#FFFFFF'}
                />
            </Animated.View>

            {/* Menu Items */}
            <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.menuContainer}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Settings</Text>
                {PROFILE_MENU_ITEMS.map((item, index) => <MenuItem key={item.id} item={item} index={index} />)}

                {/* Logout Button */}
                <Animated.View
                    entering={FadeInDown.delay(600).duration(400)}
                    style={{ marginTop: 16 }}
                >
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}
                        onPress={handleLogout}
                        disabled={loggingOut}
                        activeOpacity={0.7}
                    >
                        {loggingOut ? (
                            <ActivityIndicator color={colors.error} />
                        ) : (
                            <>
                                <View style={[styles.menuIcon, { backgroundColor: colors.error + '20' }]}>
                                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                </View>
                                <Text style={[styles.menuLabel, { color: colors.error }]}>
                                    Logout
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.version, { color: colors.textTertiary }]}>Akbar AI Chat v2.0.0</Text>
                <Text style={[styles.copyright, { color: colors.textTertiary }]}>Powered by Supabase 💚</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 24,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: 'rgba(0, 98, 255, 0.4)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    themeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 24,
        marginBottom: 24,
        padding: 18,
        borderRadius: 28,
        borderWidth: 1,
    },
    themeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    menuContainer: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingBottom: 48,
    },
    version: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    copyright: {
        fontSize: 12,
        fontWeight: '500',
    },
});
