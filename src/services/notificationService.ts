import { Platform } from 'react-native';
import { CallDebugger } from './callDebugger';

// Safe dynamic require for expo-notifications
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('[NOTIF_MODULE_WARN]', e);
  }
}

class NotificationServiceClass {
  private isInitialized = false;

  public async initialize() {
    if (this.isInitialized || Platform.OS === 'web' || !Notifications) return;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
        }),
      });

      let finalStatus = 'undetermined';
      try {
        const perm = await Notifications.getPermissionsAsync().catch(() => null);
        finalStatus = perm?.status || 'undetermined';
        if (finalStatus !== 'granted') {
          const req = await Notifications.requestPermissionsAsync().catch(() => null);
          finalStatus = req?.status || finalStatus;
        }
      } catch (e) {}

      CallDebugger.logStage('NOTIFICATION PERMISSION', finalStatus === 'granted' ? 'OK' : 'INFO', { status: finalStatus });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('incoming_calls', {
          name: 'SYNKING Incoming Calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 800, 1000],
          lightColor: '#FD3A73',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          sound: 'default',
        });
      }

      // 4. Interactive Call Actions: Answer (Pick) & Decline (Disconnect) Buttons
      await Notifications.setNotificationCategoryAsync('CALL', [
        {
          identifier: 'ACCEPT_CALL',
          buttonTitle: '🟢 Answer',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'DECLINE_CALL',
          buttonTitle: '🔴 Decline',
          options: {
            opensAppToForeground: false,
            isDestructive: true,
          },
        },
      ]);

      // 5. Handle user tapping Answer / Decline directly on notification banner
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        const actionId = response.actionIdentifier;
        const callData = response.notification?.request?.content?.data;
        CallDebugger.logStage('NOTIFICATION ACTION', 'OK', { actionId, callId: callData?.callId });

        if (actionId === 'ACCEPT_CALL' || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          this.dismissCallNotification(callData?.callId);
          try {
            const { WebRTCService } = require('./webrtcService');
            WebRTCService.acceptCall().catch(() => {});
          } catch (e) {}
        } else if (actionId === 'DECLINE_CALL') {
          this.dismissCallNotification(callData?.callId);
          try {
            const { WebRTCService } = require('./webrtcService');
            const { RingtoneService } = require('./ringtoneService');
            RingtoneService.stop();
            WebRTCService.rejectCall();
          } catch (e) {}
        }
      });

      // 6. Handle background / locked FCM push incoming call wakeup
      Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification.request?.content?.data;
        CallDebugger.logStage('FCM MESSAGE RECEIVED', 'OK', { 
          callId: data?.callId, 
          caller: data?.callerUser?.name,
          type: data?.type || data?.callType 
        });

        if (data && (data.type === 'INCOMING_CALL' || data.callId) && data.callerUser) {
          try {
            CallDebugger.logStage('MESSAGE HANDLER', 'OK', { launchingCall: true });
            const { WebRTCService } = require('./webrtcService');
            WebRTCService.receiveIncomingCall(data.callerUser, data.callType || 'audio', data.callId);
          } catch (e: any) {
            CallDebugger.logStage('MESSAGE HANDLER', 'FAIL', { error: e?.message });
          }
        }
      });

      this.isInitialized = true;
    } catch (e: any) {
      CallDebugger.logStage('NOTIFICATION INIT', 'FAIL', { error: e?.message });
    }
  }

  public async showIncomingCallNotification(callerName: string, callType: 'audio' | 'video', callId: string) {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      await this.initialize();
      await Notifications.scheduleNotificationAsync({
        identifier: `call_${callId}`,
        content: {
          title: `📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`,
          body: `${callerName} is calling you on SYNKING`,
          data: { callId, callerName, callType },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'CALL',
          channelId: 'incoming_calls',
        },
        trigger: null,
      });
      CallDebugger.logStage('FULL SCREEN INTENT', 'OK', { callerName, callType, callId });
    } catch (e: any) {
      CallDebugger.logStage('FULL SCREEN INTENT', 'FAIL', { error: e?.message });
    }
  }


  public async dismissCallNotification(callId?: string) {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      if (callId) {
        await Notifications.dismissNotificationAsync(`call_${callId}`);
      } else {
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch (e) {}
  }

  // Register device push token to backend for background / closed app call wakeups
  public async registerForPushNotificationsAsync(userId: string) {
    if (Platform.OS === 'web' || !Notifications || !userId) return;

    try {
      await this.initialize();
      let pushToken: string | null = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        pushToken = tokenData?.data || null;
      } catch (e) {}

      if (!pushToken) {
        try {
          const deviceTokenData = await Notifications.getDevicePushTokenAsync().catch(() => null);
          pushToken = deviceTokenData?.data || null;
        } catch (e) {}
      }

      if (pushToken) {
        CallDebugger.logStage('FCM TOKEN', 'OK', { userId, pushToken: pushToken.substring(0, 20) + '...' });
        const { getLocalBackendUrl } = require('./firebase');
        const backendUrl = getLocalBackendUrl();
        await fetch(`${backendUrl}/api/profiles/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, pushToken }),
        }).catch(() => {});
      } else {
        CallDebugger.logStage('FCM TOKEN', 'FAIL', { reason: 'No push token returned by device' });
      }
    } catch (e: any) {
      CallDebugger.logStage('FCM TOKEN', 'FAIL', { error: e?.message });
    }
  }
}

export const NotificationService = new NotificationServiceClass();