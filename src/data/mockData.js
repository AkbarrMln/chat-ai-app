export const CONVERSATIONS = [
    {
        id: '1',
        title: 'Travel Planning Assistant',
        lastMessage: 'I recommend visiting Bali in June for the best weather. The dry season offers...',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        avatar: 'TP',
        unread: true,
        category: 'Personal',
        avatarColor: '#356899'
    },
    {
        id: '2',
        title: 'Code Helper',
        lastMessage: 'Here is how you can implement a binary search algorithm in Python...',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        avatar: 'CH',
        unread: false,
        category: 'Work',
        avatarColor: '#0D0140'
    },
    {
        id: '3',
        title: 'Recipe Ideas',
        lastMessage: 'For a healthy dinner, try this grilled salmon with vegetables recipe...',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        avatar: 'RI',
        unread: false,
        category: 'Personal',
        avatarColor: '#FF9228'
    },
    {
        id: '4',
        title: 'Fitness Coach',
        lastMessage: 'Great progress! Tomorrow we focus on upper body exercises...',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        avatar: 'FC',
        unread: true,
        category: 'Health',
        avatarColor: '#10B981'
    },
    {
        id: '5',
        title: 'Language Learning',
        lastMessage: 'Bonjour! Let us practice French conversation today...',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        avatar: 'LL',
        unread: false,
        category: 'Education',
        avatarColor: '#A78BFA'
    },
    {
        id: '6',
        title: 'Creative Writing',
        lastMessage: 'Your story has great potential! Consider adding more conflict...',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        avatar: 'CW',
        unread: false,
        category: 'Creative',
        avatarColor: '#EF4444'
    },
];

export const CATEGORIES = ['All', 'Work', 'Personal', 'Health', 'Education', 'Creative', 'Finance', 'Travel', 'News', 'Social', 'Music'];

export const CHAT_MESSAGES = {
    '1': [
        {
            id: '1',
            text: 'Hi! I am planning a trip to Indonesia. Any recommendations?',
            isUser: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
            id: '2',
            text: 'Indonesia is a wonderful destination! I would recommend visiting Bali for its beautiful beaches and rich culture. June is the perfect time as it is the dry season.',
            isUser: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 14),
        },
        {
            id: '3',
            text: 'What about other places besides Bali?',
            isUser: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 10),
        },
        {
            id: '4',
            text: 'Great question! Here are some amazing alternatives:\n\nRaja Ampat - World-class diving\nYogyakarta - Cultural heritage & temples\nKomodo Island - See the famous dragons\nUbud - Art, nature, and spirituality\n\nWhich interests you most?',
            isUser: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 9),
        },
        {
            id: '5',
            text: 'I recommend visiting Bali in June for the best weather. The dry season offers perfect conditions for outdoor activities!',
            isUser: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
        },
    ],
    // ... rest of messages remain same
};

// ... keep other exports (PROFILE_MENU_ITEMS, USER_PROFILE) 
// but ensure CATEGORIES is exported
export const PROFILE_MENU_ITEMS = [
    { id: '1', icon: 'settings-outline', label: 'Settings', hasArrow: true },
    { id: '2', icon: 'notifications-outline', label: 'Notifications', hasArrow: true },
    { id: '3', icon: 'shield-checkmark-outline', label: 'Privacy & Security', hasArrow: true },
    { id: '4', icon: 'help-circle-outline', label: 'Help & Support', hasArrow: true },
    { id: '5', icon: 'information-circle-outline', label: 'About', hasArrow: true },
    { id: '6', icon: 'log-out-outline', label: 'Logout', hasArrow: false },
];

export const USER_PROFILE = {
    name: 'Akbar Maulana',
    email: 'akbar.maulana@example.com',
    avatar: null,
};
