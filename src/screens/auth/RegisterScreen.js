import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function RegisterScreen({ navigation }) {
    const { colors } = useTheme();
    const { signUp } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        if (!email.trim() || !password.trim()) {
            showToast('warning', 'Input Required', 'Email dan password harus diisi');
            return;
        }

        if (password !== confirmPassword) {
            showToast('warning', 'Password Tidak Cocok', 'Password dan konfirmasi harus sama');
            return;
        }

        if (password.length < 6) {
            showToast('warning', 'Password Terlalu Pendek', 'Password minimal 6 karakter');
            return;
        }

        setLoading(true);
        try {
            const { error } = await signUp(email.trim(), password);

            if (error) {
                showToast('error', 'Registrasi Gagal', error.message);
            } else {
                showToast('success', 'Akun Dibuat! 🎉', 'Selamat datang di Akbar AI Chat');
                // Auto-login will happen through AuthContext
            }
        } catch (error) {
            showToast('error', 'Error', 'Terjadi kesalahan saat registrasi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primaryBg }]}>
                        <Ionicons name="person-add" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Buat Akun</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Daftar untuk mulai chat real-time dengan AI
                    </Text>
                </Animated.View>

                {/* Form */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="nama@email.com"
                                placeholderTextColor={colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Minimal 6 karakter"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textTertiary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Ulangi password"
                                placeholderTextColor={colors.textTertiary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: colors.primary }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.registerButtonText}>Daftar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Login Link */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Sudah punya akun?
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={[styles.loginLink, { color: colors.primary }]}>
                            Login
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 8,
        marginTop: 8,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    footerText: {
        fontSize: 14,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '700',
    },
});
