import { Platform } from 'react-native';

// Safe dynamic require for expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {}

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

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }


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
        if (actionId === 'DECLINE_CALL') {
          this.dismissCallNotification(callData?.callId);
        }
      });

      this.isInitialized = true;
    } catch (e) {
      console.warn('[NOTIF_INIT_WARN]', e);
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
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('[SHOW_CALL_NOTIF_ERROR]', e);
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
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      const pushToken = tokenData?.data;
      if (pushToken) {
        const backendUrl = 'https://synking-9my2.onrender.com';
        await fetch(`${backendUrl}/api/profiles/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, pushToken }),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[PUSH_TOKEN_REG_WARN]', e);
    }
  }
}

export const NotificationService = new NotificationServiceClass();