import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/components/Toast';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Main Screens
import ConversationListScreen from './src/screens/ConversationListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DigestSettingsScreen from './src/screens/DigestSettingsScreen';
import DigestHistoryScreen from './src/screens/DigestHistoryScreen';
import DigestDetailScreen from './src/screens/DigestDetailScreen';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Services
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from './src/services/notificationService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Navigation reference for deep linking
let navigationRef = null;

// Auth Navigator (Login/Register)
function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function ChatStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: 'Chat AI' }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Chat',
        })}
      />
    </Stack.Navigator>
  );
}

function DigestStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DigestSettings"
        component={DigestSettingsScreen}
        options={{ title: 'Daily Digest' }}
      />
      <Stack.Screen
        name="DigestHistory"
        component={DigestHistoryScreen}
        options={{ title: 'History Digest' }}
      />
      <Stack.Screen
        name="DigestDetail"
        component={DigestDetailScreen}
        options={{ title: 'Detail Digest' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Digest') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={ChatStack}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="Digest"
        component={DigestStack}
        options={{ title: 'Digest' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDarkMode, colors } = useTheme();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications();

    // Handle notification tap when app was opened from notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationTap(response);
      }
    });

    // Listen for notification taps while app is running
    const subscription = addNotificationResponseListener(handleNotificationTap);

    return () => subscription.remove();
  }, []);

  const handleNotificationTap = (response) => {
    const data = response?.notification?.request?.content?.data;

    if (data?.type === 'digest' && data?.digestId && navigationRef) {
      // Navigate to digest detail
      navigationRef.navigate('Digest', {
        screen: 'DigestDetail',
        params: { digestId: data.digestId, deviceId: data.deviceId },
      });
    }
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={(ref) => { navigationRef = ref; }}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
