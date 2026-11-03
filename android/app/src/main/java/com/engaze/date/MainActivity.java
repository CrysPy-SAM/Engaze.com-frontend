package com.engaze.date;

import android.app.Dialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private Dialog popupDialog = null;

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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView mainWebView = this.bridge.getWebView();
        WebSettings mainSettings = mainWebView.getSettings();
        mainSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        mainSettings.setSupportMultipleWindows(true);

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
