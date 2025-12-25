import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Initialize Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}');

if (!admin.apps.length && serviceAccount.project_id) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

interface MessagePayload {
    record: {
        id: string;
        sender_id: string;
        recipient_id: string;
        content: string;
        message_type: string;
        created_at: string;
    };
    type: 'INSERT';
    table: 'messages';
}

/**
 * Supabase Edge Function - Auto-notify on new message
 * Triggered by database webhook or called directly
 * 
 * Deploy: supabase functions deploy notify-on-message
 */
Deno.serve(async (req) => {
    try {
        const payload: MessagePayload = await req.json();

        // Only process INSERT events
        if (payload.type !== 'INSERT') {
            return new Response(JSON.stringify({ skipped: true }), { status: 200 });
        }

        const { sender_id, recipient_id, content, message_type } = payload.record;

        // Get sender info
        const { data: sender } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', sender_id)
            .single();

        // Get recipient's push tokens
        const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token, platform')
            .eq('user_id', recipient_id);

        if (!tokens || tokens.length === 0) {
            console.log('No push tokens for recipient:', recipient_id);
            return new Response(
                JSON.stringify({ success: true, message: 'No tokens found' }),
                { status: 200 }
            );
        }

        // Prepare notification content
        const senderName = sender?.name || 'Someone';
        let notificationBody = content;

        if (message_type === 'image') {
            notificationBody = '📷 Sent a photo';
        } else if (message_type === 'invite') {
            notificationBody = '🏋️ Sent a workout invite';
        } else if (message_type === 'ai_plan') {
            notificationBody = '🤖 Shared an AI workout plan';
        } else if (message_type === 'photo_comment') {
            notificationBody = '💬 Commented on your photo';
        }

        // Truncate long messages
        if (notificationBody.length > 100) {
            notificationBody = notificationBody.substring(0, 97) + '...';
        }

        // Send via FCM
        const fcmTokens = tokens.map(t => t.token);
        const message = {
            notification: {
                title: `${senderName}`,
                body: notificationBody,
                image: sender?.avatar_url || undefined
            },
            data: {
                type: 'message',
                senderId: sender_id,
                senderName: senderName,
                messageType: message_type,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            tokens: fcmTokens
        };

        // Check if Firebase Admin is initialized
        if (!admin.apps.length) {
            console.warn('Firebase Admin not initialized, skipping push');
            return new Response(
                JSON.stringify({ success: true, message: 'Firebase not configured' }),
                { status: 200 }
            );
        }

        const response = await admin.messaging().sendMulticast(message);

        console.log(`✅ Pushed to ${response.successCount}/${tokens.length} devices`);

        // Remove invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
                    invalidTokens.push(fcmTokens[idx]);
                }
            });

            if (invalidTokens.length > 0) {
                await supabase
                    .from('push_tokens')
                    .delete()
                    .in('token', invalidTokens);
                console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('❌ Notification error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
