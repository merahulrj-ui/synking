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
}

export const NotificationService = new NotificationServiceClass();