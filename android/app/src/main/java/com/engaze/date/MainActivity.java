package com.engaze.date;

import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private Dialog popupDialog = null;
    private static final int CALL_NOTIF_ID = 2001;

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

                int notifId = (int) System.currentTimeMillis();
                NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, "engaze_messages")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(senderName != null && !senderName.isEmpty() ? senderName : "New Message")
                    .setContentText(messageText != null && !messageText.isEmpty() ? messageText : "You have a new message")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

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

                NotificationCompat.Builder builder = new NotificationCompat.Builder(MainActivity.this, "engaze_calls")
                    .setSmallIcon(android.R.drawable.ic_menu_call)
                    .setContentTitle("Incoming Video Call 📞")
                    .setContentText((callerName != null && !callerName.isEmpty() ? callerName : "Someone") + " is video calling you...")
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_CALL)
                    .setSound(ringtoneUri)
                    .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000})
                    .setAutoCancel(true)
                    .setOngoing(true)
                    .setFullScreenIntent(pendingIntent, true)
                    .setContentIntent(pendingIntent);

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
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        createNotificationChannels();

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
