import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import {
    getDigestSettings,
    saveDigestSettings,
    testDigest
} from '../services/api';
import {
    getDeviceId,
    registerForPushNotifications,
    getStoredPushToken
} from '../services/notificationService';

const TOPICS = ['Teknologi', 'Bisnis', 'Olahraga', 'Hiburan', 'Politik', 'Kesehatan', 'Gaming'];

// Cross-platform alert function (works on web too)
const showAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'web') {
        // For web, use window.alert or confirm
        if (buttons.length > 1) {
            const result = window.confirm(`${title}\n\n${message}`);
            if (result && buttons[0]?.onPress) {
                buttons[0].onPress();
            }
        } else {
            window.alert(`${title}\n\n${message}`);
            if (buttons[0]?.onPress) {
                buttons[0].onPress();
            }
        }
    } else {
        // For native, use Alert.alert
        showAlert(title, message, buttons);
    }
};

// Generate hour and minute options
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45]; // 15-minute intervals

// Custom Time Picker Component (works on all platforms)
function CustomTimePicker({ visible, onClose, onSelect, initialHour, initialMinute, colors }) {
    const [hour, setHour] = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);

    const handleConfirm = () => {
        onSelect(hour, minute);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Waktu</Text>

                    <View style={styles.pickerContainer}>
                        {/* Hour Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Jam</Text>
                            <ScrollView
                                style={styles.pickerScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                {HOURS.map((h) => (
                                    <TouchableOpacity
                                        key={h}
                                        style={[
                                            styles.pickerItem,
                                            hour === h && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setHour(h)}
                                    >
                                        <Text style={[
                                            styles.pickerItemText,
                                            { color: hour === h ? '#FFFFFF' : colors.text }
                                        ]}>
                                            {String(h).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={[styles.pickerSeparator, { color: colors.text }]}>:</Text>

                        {/* Minute Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Menit</Text>
                            <ScrollView
                                style={styles.pickerScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                {MINUTES.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.pickerItem,
                                            minute === m && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setMinute(m)}
                                    >
                                        <Text style={[
                                            styles.pickerItemText,
                                            { color: minute === m ? '#FFFFFF' : colors.text }
                                        ]}>
                                            {String(m).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, { borderColor: colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                            onPress={handleConfirm}
                        >
                            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function DigestSettingsScreen({ navigation }) {
    const { colors } = useTheme();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [pushToken, setPushToken] = useState(null);

    // Settings state
    const [enabled, setEnabled] = useState(false);
    const [selectedHour, setSelectedHour] = useState(7);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedTopic, setSelectedTopic] = useState('Teknologi');
    const [customPrompt, setCustomPrompt] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const id = await getDeviceId();
            setDeviceId(id);

            // Get push token
            const token = await getStoredPushToken();
            setPushToken(token);

            // Load settings from backend
            const result = await getDigestSettings(id);

            if (result.success && result.settings) {
                const { enabled: e, time, topic, customPrompt: prompt } = result.settings;
                setEnabled(e || false);
                setSelectedTopic(topic || 'Teknologi');
                setCustomPrompt(prompt || '');

                // Parse time string
                if (time) {
                    const [hours, minutes] = time.split(':').map(Number);
                    setSelectedHour(hours);
                    setSelectedMinute(minutes);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Register for push notifications if enabling
            if (enabled && !pushToken) {
                const token = await registerForPushNotifications();
                if (!token) {
                    showAlert(
                        'Notifikasi Diperlukan',
                        'Aktifkan izin notifikasi untuk menerima Daily Digest'
                    );
                    setEnabled(false);
                    setSaving(false);
                    return;
                }
                setPushToken(token);
            }

            // Format time as HH:MM (UTC)
            const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

            const result = await saveDigestSettings(deviceId, {
                enabled,
                time: timeString,
                topic: selectedTopic,
                customPrompt,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            if (result.success) {
                showAlert('Berhasil', 'Pengaturan digest berhasil disimpan! 🎉');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showAlert('Error', 'Gagal menyimpan pengaturan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTestDigest = async () => {
        setTesting(true);
        try {
            // Ensure push token exists
            let token = pushToken;
            if (!token) {
                token = await registerForPushNotifications();
                if (token) setPushToken(token);
            }

            const result = await testDigest(deviceId, selectedTopic, customPrompt, token);

            if (result.success) {
                showAlert(
                    '🧪 Test Digest Berhasil!',
                    'Digest telah dibuat. Cek History untuk melihat hasilnya.',
                    [
                        { text: 'Lihat History', onPress: () => navigation.navigate('DigestHistory') },
                        { text: 'OK' }
                    ]
                );
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showAlert('Error', 'Gagal membuat test digest: ' + error.message);
        } finally {
            setTesting(false);
        }
    };

    const handleTimeSelect = (hour, minute) => {
        setSelectedHour(hour);
        setSelectedMinute(minute);
    };

    const formatTime = () => {
        return `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
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
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryBg }]}>
                    <Ionicons name="newspaper" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Daily Digest</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Terima ringkasan berita otomatis setiap hari
                </Text>
            </Animated.View>

            {/* Enable Toggle */}
            <Animated.View
                entering={FadeInDown.delay(100).duration(600)}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons name={enabled ? "notifications" : "notifications-off"} size={24} color={colors.primary} />
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Aktifkan Digest</Text>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: colors.border, true: colors.primary + '60' }}
                        thumbColor={enabled ? colors.primary : '#FFFFFF'}
                    />
                </View>
            </Animated.View>

            {/* Time Picker */}
            <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                <Text style={[styles.cardTitle, { color: colors.text }]}>🕐 Waktu Pengiriman</Text>
                <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: colors.primaryBg }]}
                    onPress={() => setShowTimePicker(true)}
                >
                    <Ionicons name="time" size={24} color={colors.primary} />
                    <Text style={[styles.timeText, { color: colors.primary }]}>{formatTime()}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.hint, { color: colors.textTertiary }]}>
                    Tap untuk memilih waktu. Digest akan dikirim setiap hari jam ini.
                </Text>
            </Animated.View>

            {/* Custom Time Picker Modal */}
            <CustomTimePicker
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelect={handleTimeSelect}
                initialHour={selectedHour}
                initialMinute={selectedMinute}
                colors={colors}
            />

            {/* Topic Selection */}
            <Animated.View
                entering={FadeInDown.delay(300).duration(600)}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                <Text style={[styles.cardTitle, { color: colors.text }]}>📰 Topik Berita</Text>
                <View style={styles.topicGrid}>
                    {TOPICS.map((topic) => (
                        <TouchableOpacity
                            key={topic}
                            style={[
                                styles.topicChip,
                                {
                                    backgroundColor: selectedTopic === topic ? colors.primary : colors.background,
                                    borderColor: selectedTopic === topic ? colors.primary : colors.border
                                }
                            ]}
                            onPress={() => setSelectedTopic(topic)}
                        >
                            <Text style={[
                                styles.topicText,
                                { color: selectedTopic === topic ? '#FFFFFF' : colors.text }
                            ]}>
                                {topic}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* Custom Prompt */}
            <Animated.View
                entering={FadeInDown.delay(400).duration(600)}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
                <Text style={[styles.cardTitle, { color: colors.text }]}>✏️ Custom Prompt (Opsional)</Text>
                <TextInput
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Contoh: Fokus pada berita AI di Indonesia..."
                    placeholderTextColor={colors.textTertiary}
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    multiline
                    numberOfLines={3}
                />
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="save" size={20} color="#FFFFFF" />
                            <Text style={styles.saveButtonText}>Simpan Pengaturan</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.testButton, { borderColor: colors.primary }]}
                    onPress={handleTestDigest}
                    disabled={testing}
                >
                    {testing ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <>
                            <Ionicons name="flask" size={20} color={colors.primary} />
                            <Text style={[styles.testButtonText, { color: colors.primary }]}>Test Digest Sekarang</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.historyButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => navigation.navigate('DigestHistory')}
                >
                    <Ionicons name="time" size={20} color={colors.text} />
                    <Text style={[styles.historyButtonText, { color: colors.text }]}>Lihat History Digest</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    timeText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
    },
    hint: {
        fontSize: 12,
        marginTop: 8,
    },
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    topicChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    topicText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textInput: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        gap: 8,
    },
    testButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    historyButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxWidth: 320,
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    pickerColumn: {
        alignItems: 'center',
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    pickerScroll: {
        maxHeight: 180,
        width: 80,
    },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 4,
        alignItems: 'center',
    },
    pickerItemText: {
        fontSize: 18,
        fontWeight: '600',
    },
    pickerSeparator: {
        fontSize: 24,
        fontWeight: '700',
        marginHorizontal: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    confirmButton: {
        borderWidth: 0,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
