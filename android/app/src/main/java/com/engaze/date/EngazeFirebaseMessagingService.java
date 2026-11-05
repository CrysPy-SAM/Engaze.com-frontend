package com.engaze.date;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class EngazeFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "EngazeFCM";
    public static final String PREFS_NAME = "engaze_prefs";
    public static final String KEY_FCM_TOKEN = "fcm_token";

    public static final String CHANNEL_MESSAGES = "engaze_messages";
    public static final String CHANNEL_CALLS = "engaze_calls";

    public static final int CALL_NOTIF_ID = 2001;
    public static final int MISSED_CALL_BASE_ID = 3000;

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed FCM token: " + token);

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_FCM_TOKEN, token).apply();

        // Broadcast to MainActivity if active
        Intent tokenIntent = new Intent("com.engaze.date.FCM_TOKEN_REFRESHED");
        tokenIntent.putExtra("token", token);
        tokenIntent.setPackage(getPackageName());
        sendBroadcast(tokenIntent);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM message received from: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) {
            return;
        }

        String type = data.get("type");
        Log.d(TAG, "FCM message type: " + type);

        if ("incoming_call".equals(type)) {
            handleIncomingCall(data);
        } else if ("call_cancelled".equals(type)) {
            handleCallCancelled(data);
        } else if ("chat_message".equals(type)) {
            handleChatMessage(data);
        }
    }

    private void ensureChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            // 1. Messages & Matches Channel
            NotificationChannel msgChannel = manager.getNotificationChannel(CHANNEL_MESSAGES);
            if (msgChannel == null) {
                msgChannel = new NotificationChannel(
                    CHANNEL_MESSAGES,
                    "Messages & Matches",
                    NotificationManager.IMPORTANCE_HIGH
                );
                msgChannel.setDescription("New messages and match alerts");
                msgChannel.enableVibration(true);
                msgChannel.setVibrationPattern(new long[]{0, 250, 150, 250});
                manager.createNotificationChannel(msgChannel);
            }

            // 2. Incoming Video Calls Channel (Ringtone + Max Importance)
            NotificationChannel callChannel = manager.getNotificationChannel(CHANNEL_CALLS);
            if (callChannel == null) {
                callChannel = new NotificationChannel(
                    CHANNEL_CALLS,
                    "Incoming Video Calls",
                    NotificationManager.IMPORTANCE_HIGH
                );
                callChannel.setDescription("High-priority incoming 1-on-1 video call alerts");
                callChannel.enableVibration(true);
                callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000});

                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
                callChannel.setSound(ringtoneUri, audioAttributes);

                manager.createNotificationChannel(callChannel);
            }
        }
    }

    private void handleIncomingCall(Map<String, String> data) {
        String callId = data.get("callId");
        String callerId = data.get("callerId");
        String callerName = data.get("callerName");
        String callerPhoto = data.get("callerPhoto");
        String callType = data.get("callType");
        String conversationId = data.get("conversationId");
        String timestampStr = data.get("timestamp");

        if (callerName == null || callerName.trim().isEmpty()) {
            callerName = "Engaze Match";
        }
        if (callType == null || callType.trim().isEmpty()) {
            callType = "video";
        }

        // Drop stale calls (older than 45 seconds)
        if (timestampStr != null) {
            try {
                long sentTime = Long.parseLong(timestampStr);
                if (System.currentTimeMillis() - sentTime > 45000) {
                    Log.w(TAG, "Ignoring expired incoming call push: " + callId);
                    return;
                }
            } catch (NumberFormatException ignored) {}
        }

        ensureChannels();

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // PendingIntent flags
        int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Fullscreen & Content Tap Intent: opens MainActivity
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setAction("com.engaze.date.ACTION_INCOMING_CALL");
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("route", "/call");
        fullScreenIntent.putExtra("action", "incoming");
        fullScreenIntent.putExtra("callId", callId);
        fullScreenIntent.putExtra("callerId", callerId);
        fullScreenIntent.putExtra("callerName", callerName);
        fullScreenIntent.putExtra("callerPhoto", callerPhoto);
        fullScreenIntent.putExtra("callType", callType);
        fullScreenIntent.putExtra("conversationId", conversationId);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 1001, fullScreenIntent, pFlags);

        // Accept Action Intent: opens MainActivity with accept flag
        Intent acceptIntent = new Intent(this, MainActivity.class);
        acceptIntent.setAction("com.engaze.date.ACTION_ACCEPT_CALL");
        acceptIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        acceptIntent.putExtra("route", "/call");
        acceptIntent.putExtra("action", "accept");
        acceptIntent.putExtra("callId", callId);
        acceptIntent.putExtra("callerId", callerId);
        acceptIntent.putExtra("callerName", callerName);
        acceptIntent.putExtra("callerPhoto", callerPhoto);
        acceptIntent.putExtra("callType", callType);
        acceptIntent.putExtra("conversationId", conversationId);
        PendingIntent acceptPendingIntent = PendingIntent.getActivity(this, 1002, acceptIntent, pFlags);

        // Decline Action Intent: broadcast to CallActionReceiver
        Intent declineIntent = new Intent(this, CallActionReceiver.class);
        declineIntent.setAction(CallActionReceiver.ACTION_DECLINE_CALL);
        declineIntent.putExtra("callId", callId);
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(this, 1003, declineIntent, pFlags);

        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

        String callTypeLabel = "audio".equalsIgnoreCase(callType) ? "Audio" : "Video";
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_CALLS)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Incoming " + callTypeLabel + " Call 📞")
            .setContentText(callerName + " is calling you on Engaze...")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setSound(ringtoneUri)
            .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000})
            .setAutoCancel(true)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent);

        manager.notify(CALL_NOTIF_ID, builder.build());
    }

    private void handleCallCancelled(Map<String, String> data) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // Dismiss the ringing call notification immediately
        manager.cancel(CALL_NOTIF_ID);

        String reason = data.get("reason");
        String callId = data.get("callId");

        // If the call was missed, show a missed call notification
        if ("missed".equalsIgnoreCase(reason) || "timeout".equalsIgnoreCase(reason)) {
            ensureChannels();

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }

            Intent openAppIntent = new Intent(this, MainActivity.class);
            openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            openAppIntent.putExtra("route", "/chat");
            PendingIntent openPendingIntent = PendingIntent.getActivity(this, 1004, openAppIntent, pFlags);

            NotificationCompat.Builder missedBuilder = new NotificationCompat.Builder(this, CHANNEL_MESSAGES)
                .setSmallIcon(android.R.drawable.ic_menu_call)
                .setContentTitle("Missed Call 📞")
                .setContentText("You missed an incoming call on Engaze.")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openPendingIntent);

            int missedId = MISSED_CALL_BASE_ID + (callId != null ? Math.abs(callId.hashCode() % 1000) : 1);
            manager.notify(missedId, missedBuilder.build());
        }
    }

    private void handleChatMessage(Map<String, String> data) {
        String conversationId = data.get("conversationId");
        String senderName = data.get("senderName");
        String content = data.get("content");

        if (senderName == null || senderName.trim().isEmpty()) {
            senderName = "New Message";
        }
        if (content == null || content.trim().isEmpty()) {
            content = "You have a new message on Engaze";
        }

        ensureChannels();

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        Intent chatIntent = new Intent(this, MainActivity.class);
        chatIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        chatIntent.putExtra("route", "/chat");
        if (conversationId != null) {
            chatIntent.putExtra("conversationId", conversationId);
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            conversationId != null ? Math.abs(conversationId.hashCode()) : (int) System.currentTimeMillis(),
            chatIntent,
            pFlags
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_MESSAGES)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(senderName)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        int notifId = conversationId != null ? Math.abs(conversationId.hashCode()) : (int) System.currentTimeMillis();
        manager.notify(notifId, builder.build());
    }
}

