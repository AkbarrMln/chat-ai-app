import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { PROFILE_MENU_ITEMS, USER_PROFILE } from '../data/mockData';

export default function ProfileScreen() {
    const { isDarkMode, toggleTheme, colors } = useTheme();

    const getInitials = (name) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    };

    const MenuItem = ({ item, index }) => {
        const isLogout = item.label === 'Logout';

        return (
            <Animated.View
                entering={FadeInDown.delay(400 + index * 50).duration(400)}
                layout={Layout.springify()}
            >
                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                    onPress={() => alert(`${item.label} pressed!`)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.menuIcon, { backgroundColor: isLogout ? colors.errorBg + '40' : colors.primaryBg }]}>
                        <Ionicons name={item.icon} size={20} color={isLogout ? colors.error : colors.primary} />
                    </View>
                    <Text style={[styles.menuLabel, { color: isLogout ? colors.error : colors.text }]}>
                        {item.label}
                    </Text>
                    {item.hasArrow && (
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Sokka Profile Header */}
            <Animated.View
                entering={FadeInDown.duration(600)}
                style={styles.headerContainer}
            >
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{getInitials(USER_PROFILE.name)}</Text>
                </View>
                <Text style={[styles.userName, { color: colors.text }]}>{USER_PROFILE.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{USER_PROFILE.email}</Text>

                {/* Sokka Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceSecondary }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>128</Text>
                        <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Chats</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceSecondary }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>2.5K</Text>
                        <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Msgs</Text>
                    </View>
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

            {/* Sections */}
            <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.menuContainer}>
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Account Settings</Text>
                {PROFILE_MENU_ITEMS.slice(0, 2).map((item, index) => <MenuItem key={item.id} item={item} index={index} />)}

                <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: 24 }]}>Support & Help</Text>
                {PROFILE_MENU_ITEMS.slice(2, 5).map((item, index) => <MenuItem key={item.id} item={item} index={index + 2} />)}

                <View style={{ marginTop: 16 }}>
                    {PROFILE_MENU_ITEMS.slice(5).map((item, index) => <MenuItem key={item.id} item={item} index={index + 5} />)}
                </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.version, { color: colors.textTertiary }]}>Sokka AI Premium v1.0.0</Text>
                <Text style={[styles.copyright, { color: colors.textTertiary }]}>Crafted with 💙 by Akbar Maulana</Text>
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
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        width: 100,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
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
