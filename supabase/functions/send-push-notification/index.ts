import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Initialize Supabase Client for Edge Function
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

interface NotificationRequest {
    userId: string;
    title: string;
    body: string;
    data?: any;
    type?: string;
}

/**
 * Supabase Edge Function to send push notifications via FCM
 * Deploy: supabase functions deploy send-push-notification
 */
Deno.serve(async (req) => {
    try {
        // Parse request body
        const payload: NotificationRequest = await req.json();
        const { userId, title, body, data, type } = payload;

        // Get user's FCM tokens from database
        const { data: tokens, error: tokenError } = await supabase
            .from('push_tokens')
            .select('token, platform')
            .eq('user_id', userId);

        if (tokenError || !tokens || tokens.length === 0) {
            console.error('No FCM tokens found for user:', userId);
            return new Response(
                JSON.stringify({ error: 'No push tokens found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Prepare FCM message
        const fcmTokens = tokens.map(t => t.token);
        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                type: type || 'general',
                ...data
            },
            tokens: fcmTokens
        };

        // Send via Firebase Cloud Messaging
        const response = await admin.messaging().sendMulticast(message);

        console.log(`✅ Sent ${response.successCount} notifications, ${response.failureCount} failed`);

        // Remove invalid tokens from database
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(fcmTokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                await supabase
                    .from('push_tokens')
                    .delete()
                    .in('token', failedTokens);

                console.log(`🗑️ Removed ${failedTokens.length} invalid tokens`);
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
        console.error('❌ Error sending push notification:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
