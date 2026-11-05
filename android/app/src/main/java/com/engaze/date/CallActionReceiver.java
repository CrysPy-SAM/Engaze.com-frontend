package com.engaze.date;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class CallActionReceiver extends BroadcastReceiver {
    private static final String TAG = "CallActionReceiver";
    public static final String ACTION_DECLINE_CALL = "com.engaze.date.ACTION_DECLINE_CALL";
    public static final int CALL_NOTIF_ID = 2001;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.d(TAG, "onReceive action=" + action);

        if (ACTION_DECLINE_CALL.equals(action)) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(CALL_NOTIF_ID);
            }
        }
    }
}

