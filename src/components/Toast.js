import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Toast Context
const ToastContext = createContext(null);

// Toast types with icons and colors
const TOAST_CONFIG = {
    success: {
        icon: 'checkmark-circle',
        backgroundColor: '#10B981',
        iconColor: '#FFFFFF',
    },
    error: {
        icon: 'close-circle',
        backgroundColor: '#EF4444',
        iconColor: '#FFFFFF',
    },
    warning: {
        icon: 'warning',
        backgroundColor: '#F59E0B',
        iconColor: '#FFFFFF',
    },
    info: {
        icon: 'information-circle',
        backgroundColor: '#3B82F6',
        iconColor: '#FFFFFF',
    },
    confirm: {
        icon: 'trash',
        backgroundColor: '#EF4444',
        iconColor: '#FFFFFF',
    },
};

// Toast Component
function Toast({ visible, type, title, message, onHide, onConfirm, onCancel }) {
    const [animation] = useState(new Animated.Value(0));
    const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
    const isConfirm = type === 'confirm';

    useEffect(() => {
        if (visible) {
            animation.setValue(0);
            Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
            }).start();

            // Auto hide only for non-confirm toasts
            if (!isConfirm) {
                const timer = setTimeout(() => {
                    hideToast();
                }, 3500);
                return () => clearTimeout(timer);
            }
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(animation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            if (onHide) onHide();
        });
    };

    const handleConfirm = () => {
        hideToast();
        if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
        hideToast();
        if (onCancel) onCancel();
    };

    if (!visible) return null;

    const { width: screenWidth } = Dimensions.get('window');
    const toastWidth = Math.min(350, screenWidth - 40);

    return (
        <View style={styles.toastWrapper} pointerEvents="box-none">
            <Animated.View
                style={[
                    styles.toastContainer,
                    {
                        backgroundColor: config.backgroundColor,
                        width: toastWidth,
                        transform: [
                            {
                                translateY: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-100, 0],
                                }),
                            },
                        ],
                        opacity: animation,
                    },
                ]}
            >
                <View style={styles.toastContent}>
                    <Ionicons name={config.icon} size={24} color={config.iconColor} />
                    <View style={styles.toastTextContainer}>
                        <Text style={styles.toastTitle}>{title}</Text>
                        {message && <Text style={styles.toastMessage}>{message}</Text>}
                    </View>
                    {!isConfirm && (
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <Ionicons name="close" size={20} color="#FFFFFF99" />
                        </TouchableOpacity>
                    )}
                </View>
                {isConfirm && (
                    <View style={styles.confirmButtons}>
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
                            <Text style={styles.confirmBtnText}>Hapus</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

// Toast Provider
export function ToastProvider({ children }) {
    const [toast, setToast] = useState({
        visible: false,
        type: 'info',
        title: '',
        message: '',
        key: 0,
        onConfirm: null,
        onCancel: null,
    });

    const showToast = (type, title, message = '', callbacks = {}) => {
        setToast(prev => ({
            visible: true,
            type,
            title,
            message,
            key: prev.key + 1,
            onConfirm: callbacks.onConfirm || null,
            onCancel: callbacks.onCancel || null,
        }));
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            <View style={styles.providerContainer}>
                {children}
                <Toast
                    key={toast.key}
                    visible={toast.visible}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onHide={hideToast}
                    onConfirm={toast.onConfirm}
                    onCancel={toast.onCancel}
                />
            </View>
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    providerContainer: {
        flex: 1,
    },
    toastWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'web' ? 20 : 50,
        paddingRight: 20,
        zIndex: 99999,
        elevation: 99999,
    },
    toastContainer: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    toastMessage: {
        color: '#FFFFFFCC',
        fontSize: 13,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    cancelBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    confirmBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    confirmBtnText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default Toast;
