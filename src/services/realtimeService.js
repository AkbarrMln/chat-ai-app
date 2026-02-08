/**
 * Supabase Realtime Service
 * Handles channel subscriptions for real-time messaging, typing indicators, and presence
 */
import { supabase } from '../lib/supabase';

// Active channels storage for cleanup
const activeChannels = new Map();

/**
 * Subscribe to new messages in a room
 */
export const subscribeToMessages = (roomId, onMessage) => {
    const channelName = `room:${roomId}`;

    // Remove existing channel if any
    if (activeChannels.has(channelName)) {
        supabase.removeChannel(activeChannels.get(channelName));
    }

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                console.log('📩 New message received:', payload.new);
                if (onMessage) onMessage(payload.new);
            }
        )
        .subscribe((status) => {
            console.log(`📡 Channel ${channelName} status:`, status);
        });

    activeChannels.set(channelName, channel);
    return channel;
};

/**
 * Subscribe to typing indicators in a room
 */
export const subscribeToTyping = (roomId, onTyping) => {
    const channelName = `typing:${roomId}`;

    if (activeChannels.has(channelName)) {
        return activeChannels.get(channelName);
    }

    const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'typing' }, (payload) => {
            if (onTyping) onTyping(payload.payload);
        })
        .subscribe();

    activeChannels.set(channelName, channel);
    return channel;
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = async (roomId, userId, username, isTyping) => {
    const channelName = `typing:${roomId}`;
    let channel = activeChannels.get(channelName);

    if (!channel) {
        channel = supabase.channel(channelName);
        activeChannels.set(channelName, channel);
        await channel.subscribe();
    }

    await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, username, isTyping },
    });
};

/**
 * Subscribe to presence (online/offline status) in a room
 */
export const subscribeToPresence = (roomId, userId, username, onPresenceChange) => {
    const channelName = `presence:${roomId}`;

    if (activeChannels.has(channelName)) {
        return activeChannels.get(channelName);
    }

    const channel = supabase
        .channel(channelName)
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const onlineUsers = Object.values(state).flat();
            console.log('👥 Online users:', onlineUsers);
            if (onPresenceChange) onPresenceChange(onlineUsers);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('✅ User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('👋 User left:', leftPresences);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    userId,
                    username,
                    onlineAt: new Date().toISOString(),
                });
            }
        });

    activeChannels.set(channelName, channel);
    return channel;
};

/**
 * Unsubscribe from a specific channel
 */
export const unsubscribeFromChannel = (channelName) => {
    if (activeChannels.has(channelName)) {
        const channel = activeChannels.get(channelName);
        supabase.removeChannel(channel);
        activeChannels.delete(channelName);
        console.log(`🔌 Unsubscribed from ${channelName}`);
    }
};

/**
 * Unsubscribe from all room channels
 */
export const unsubscribeFromRoom = (roomId) => {
    const prefixes = ['room:', 'typing:', 'presence:'];
    prefixes.forEach((prefix) => {
        const channelName = `${prefix}${roomId}`;
        unsubscribeFromChannel(channelName);
    });
};

/**
 * Cleanup all active channels
 */
export const cleanupAllChannels = () => {
    activeChannels.forEach((channel, name) => {
        supabase.removeChannel(channel);
        console.log(`🧹 Cleaned up channel: ${name}`);
    });
    activeChannels.clear();
};

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Fetch messages for a room
 */
export const fetchMessages = async (roomId, limit = 50) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching messages:', error);
        return { data: [], error };
    }

    return { data, error: null };
};

/**
 * Send a message to a room
 */
export const sendMessage = async (roomId, userId, content, isAi = false) => {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            room_id: roomId,
            user_id: userId,
            content,
            is_ai: isAi,
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
    }

    return { data, error };
};

/**
 * Fetch rooms for current user
 */
export const fetchUserRooms = async () => {
    const { data, error } = await supabase
        .from('room_members')
        .select(`
            rooms (*)
        `)
        .order('joined_at', { ascending: false });

    if (error) {
        console.error('Error fetching rooms:', error);
        return { data: [], error };
    }

    // Flatten the response
    const rooms = data?.map((rm) => rm.rooms) || [];
    return { data: rooms, error: null };
};

/**
 * Create a new room
 */
export const createRoom = async (name, type = 'group') => {
    const { data, error } = await supabase.rpc('create_room_with_member', {
        room_name: name,
        room_type: type,
    });

    if (error) {
        console.error('Error creating room:', error);
    }

    return { data, error };
};

/**
 * Join an existing room
 */
export const joinRoom = async (roomId, userId) => {
    const { data, error } = await supabase
        .from('room_members')
        .insert({
            room_id: roomId,
            user_id: userId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error joining room:', error);
    }

    return { data, error };
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        console.error('Error deleting message:', error);
    }

    return { error };
};

/**
 * Delete a room (and all its messages via cascade)
 */
export const deleteRoom = async (roomId) => {
    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

    if (error) {
        console.error('Error deleting room:', error);
    }

    return { error };
};

export default {
    subscribeToMessages,
    subscribeToTyping,
    sendTypingIndicator,
    subscribeToPresence,
    unsubscribeFromChannel,
    unsubscribeFromRoom,
    cleanupAllChannels,
    fetchMessages,
    sendMessage,
    fetchUserRooms,
    createRoom,
    joinRoom,
    deleteMessage,
    deleteRoom,
};
