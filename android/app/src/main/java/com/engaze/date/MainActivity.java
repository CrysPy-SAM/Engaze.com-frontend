package com.engaze.date;

import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private Dialog popupDialog = null;
    private static final int CALL_NOTIF_ID = 2001;
    private String pendingActionJson = null;

    private boolean handleExternalUrl(String url) {
        if (url != null && (
            url.endsWith(".apk") || 
            url.contains(".apk?") || 
            url.contains("/download/") || 
            url.contains("/releases/") ||
            url.contains("github.com")
        )) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                MainActivity.this.startActivity(intent);
                if (popupDialog != null && popupDialog.isShowing()) {
                    popupDialog.dismiss();
                }
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                // 1. Messages & Matches Channel
                NotificationChannel msgChannel = new NotificationChannel(
                    "engaze_messages",
                    "Messages & Matches",
                    NotificationManager.IMPORTANCE_HIGH
                );
                msgChannel.setDescription("New messages and match alerts");
                msgChannel.enableVibration(true);
                msgChannel.setVibrationPattern(new long[]{0, 250, 150, 250});

                // 2. Incoming Video Calls Channel (High Priority with Ringtone)
                NotificationChannel callChannel = new NotificationChannel(
                    "engaze_calls",
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

                manager.createNotificationChannel(msgChannel);
                manager.createNotificationChannel(callChannel);
            }
        }
    }

    class NativeNotificationBridge {
        @JavascriptInterface
        public void requestPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.POST_NOTIFICATIONS) 
                        != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this, 
                        new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
                }
            }
        }

        @JavascriptInterface
        public void showMessage(String senderName, String messageText, String conversationId) {
            try {
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager == null) return;

                Intent intent = new Intent(MainActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                intent.putExtra("route", "/chat");
                if (conversationId != null) {
                    intent.putExtra("conversationId", conversationId);
                }

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(MainActivity.this, (int) System.currentTimeMillis(), intent, flags);

                Bitmap brandBitmap = null;
                try {
                    Bitmap raw = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
                    brandBitmap = EngazeFirebaseMessagingService.getCircularBitmap(raw);
                } catch (Exception ignored) {}

                String safeSender = (senderName != null && !senderName.trim().isEmpty()) ? senderName.trim() : "New Message";
                String safeText = (messageText != null && !messageText.trim().isEmpty()) ? messageText.trim() : "You have a new message";

                Person userPerson = new Person.Builder().setName("You").build();
                Person senderPerson = new Person.Builder().setName(safeSender).build();

                NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(userPerson)
                    .setConversationTitle(null)
                    .setGroupConversation(false)
                    .addMessage(safeText, System.currentTimeMillis(), senderPerson);

                int notifId = (conversationId != null) ? Math.abs(conversationId.hashCode()) : (int) System.currentTimeMillis();
                NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, "engaze_messages")
                    .setSmallIcon(R.drawable.ic_notification)
                    .setColor(ContextCompat.getColor(MainActivity.this, R.color.notification_color))
                    .setStyle(messagingStyle)
                    .setContentTitle(safeSender)
                    .setContentText(safeText)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                if (brandBitmap != null) {
                    builder.setLargeIcon(brandBitmap);
                }

                manager.notify(notifId, builder.build());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void showCall(String callerName, String callId) {
            try {
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager == null) return;

                Intent intent = new Intent(MainActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                intent.putExtra("route", "/call");
                if (callId != null) {
                    intent.putExtra("callId", callId);
                }

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getActivity(MainActivity.this, 1, intent, flags);

                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

                Bitmap brandBitmap = null;
                try {
                    Bitmap raw = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
                    brandBitmap = EngazeFirebaseMessagingService.getCircularBitmap(raw);
                } catch (Exception ignored) {}

                String safeCaller = (callerName != null && !callerName.trim().isEmpty()) ? callerName.trim() : "Someone";

                NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, "engaze_calls")
                    .setSmallIcon(R.drawable.ic_notification_call)
                    .setColor(ContextCompat.getColor(MainActivity.this, R.color.notification_color))
                    .setContentTitle(safeCaller)
                    .setContentText("Incoming video call...")
                    .setSubText("Engaze Call")
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_CALL)
                    .setSound(ringtoneUri)
                    .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000})
                    .setAutoCancel(true)
                    .setOngoing(true)
                    .setFullScreenIntent(pendingIntent, true)
                    .setContentIntent(pendingIntent);

                if (brandBitmap != null) {
                    builder.setLargeIcon(brandBitmap);
                }

                manager.notify(CALL_NOTIF_ID, builder.build());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void cancelCall() {
            try {
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(CALL_NOTIF_ID);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public String getInitialAction() {
            String action = pendingActionJson;
            pendingActionJson = null;
            return action;
        }

        @JavascriptInterface
        public String getFcmToken() {
            SharedPreferences prefs = getSharedPreferences(EngazeFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getString(EngazeFirebaseMessagingService.KEY_FCM_TOKEN, null);
        }

        @JavascriptInterface
        public void refreshFcmToken() {
            try {
                FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult() != null) {
                        String token = task.getResult();
                        SharedPreferences prefs = getSharedPreferences(EngazeFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE);
                        prefs.edit().putString(EngazeFirebaseMessagingService.KEY_FCM_TOKEN, token).apply();
                        notifyWebviewToken(token);
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Error refreshing FCM token", e);
            }
        }
    }

    private String extractIntentPayload(Intent intent) {
        if (intent == null) return null;
        String route = intent.getStringExtra("route");
        String action = intent.getStringExtra("action");
        String callId = intent.getStringExtra("callId");
        String callerId = intent.getStringExtra("callerId");
        String callerName = intent.getStringExtra("callerName");
        String callerPhoto = intent.getStringExtra("callerPhoto");
        String callType = intent.getStringExtra("callType");
        String conversationId = intent.getStringExtra("conversationId");

        if (route == null && action == null && callId == null && conversationId == null) {
            return null;
        }

        try {
            JSONObject json = new JSONObject();
            if (action != null) json.put("action", action);
            if (route != null) json.put("route", route);
            if (callId != null) json.put("callId", callId);
            if (callerId != null) json.put("callerId", callerId);
            if (callerName != null) json.put("callerName", callerName);
            if (callerPhoto != null) json.put("callerPhoto", callerPhoto);
            if (callType != null) json.put("callType", callType);
            if (conversationId != null) json.put("conversationId", conversationId);
            return json.toString();
        } catch (Exception e) {
            Log.e(TAG, "Failed to serialize intent payload", e);
            return null;
        }
    }

    private void notifyWebviewToken(String token) {
        if (token == null) return;
        try {
            WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
            if (webView != null) {
                webView.post(() -> {
                    String script = "window.dispatchEvent(new CustomEvent('nativeFcmToken', { detail: { token: '" + token + "' } }));";
                    webView.evaluateJavascript(script, null);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to dispatch nativeFcmToken event", e);
        }
    }

    private void dispatchPendingAction(String payload) {
        if (payload == null) return;
        try {
            WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
            if (webView != null) {
                webView.post(() -> {
                    String script = "window.dispatchEvent(new CustomEvent('nativeNotificationAction', { detail: " + payload + " }));";
                    webView.evaluateJavascript(script, null);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to dispatch nativeNotificationAction event", e);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String payload = extractIntentPayload(intent);
        if (payload != null) {
            pendingActionJson = payload;
            dispatchPendingAction(payload);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createNotificationChannels();

        pendingActionJson = extractIntentPayload(getIntent());

        try {
            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    String token = task.getResult();
                    SharedPreferences prefs = getSharedPreferences(EngazeFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE);
                    prefs.edit().putString(EngazeFirebaseMessagingService.KEY_FCM_TOKEN, token).apply();
                    notifyWebviewToken(token);
                }
            });
        } catch (Exception e) {
            Log.w(TAG, "FCM proactive token fetch exception: " + e.getMessage());
        }

        WebView mainWebView = this.bridge.getWebView();
        WebSettings mainSettings = mainWebView.getSettings();
        mainSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        mainSettings.setSupportMultipleWindows(true);

        mainWebView.addJavascriptInterface(new NativeNotificationBridge(), "EngazeNativeNotifications");

        DownloadListener downloadListener = (url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                MainActivity.this.startActivity(intent);
                if (popupDialog != null && popupDialog.isShowing()) {
                    popupDialog.dismiss();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        };
        mainWebView.setDownloadListener(downloadListener);

        mainWebView.setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView popupWebView = new WebView(MainActivity.this);
                WebSettings popupSettings = popupWebView.getSettings();
                popupSettings.setJavaScriptEnabled(true);
                popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                popupSettings.setSupportMultipleWindows(true);
                popupSettings.setDomStorageEnabled(true);

                popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                popupDialog.setContentView(popupWebView);
                popupDialog.setOnDismissListener(d -> {
                    popupWebView.destroy();
                    popupDialog = null;
                });
                popupDialog.show();

                popupWebView.setDownloadListener(downloadListener);

                popupWebView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onCloseWindow(WebView window) {
                        if (popupDialog != null && popupDialog.isShowing()) {
                            popupDialog.dismiss();
                        }
                    }
                });

                popupWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        if (handleExternalUrl(url)) {
                            return true;
                        }
                        return false;
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            if (handleExternalUrl(request.getUrl().toString())) {
                                return true;
                            }
                        }
                        return false;
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        if (url != null && (url.contains("blank") || url.contains("close") || url.contains("oauth2/approval"))) {
                            view.postDelayed(() -> {
                                if (popupDialog != null && popupDialog.isShowing()) {
                                    popupDialog.dismiss();
                                }
                            }, 500);
                        }
                    }
                });

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popupWebView);
                resultMsg.sendToTarget();
                return true;
            }

            @Override
            public void onCloseWindow(WebView window) {
                super.onCloseWindow(window);
                if (popupDialog != null && popupDialog.isShowing()) {
                    popupDialog.dismiss();
                }
            }
        });
    }

    @Override
    public void onDestroy() {
        if (popupDialog != null && popupDialog.isShowing()) {
            popupDialog.dismiss();
            popupDialog = null;
        }
        super.onDestroy();
    }
}
