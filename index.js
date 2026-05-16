/**
 * @format
 */
import { getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

if (getApps().length) {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📩 Background notification:', remoteMessage);

    // For data-only messages, manually display local notification.
    // For notification payloads, system already displays it.
    if (!remoteMessage?.notification) {
      await notifee.createChannel({
        id: 'default-channel-id',
        name: 'Default Channel',
        importance: 4,
      });

      await notifee.displayNotification({
        title: remoteMessage?.data?.title || 'Notification',
        body: remoteMessage?.data?.body || '',
        android: {
          channelId: 'default-channel-id',
          pressAction: { id: 'default' },
        },
      });
    }
  });
} else {
  console.warn('Firebase app is not initialized yet. Background messaging is disabled.');
}

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('AttendanceBootTask', () => async () => {
  const { resumePersistentAttendanceTrackingIfNeeded } = require('./TeacherDashboard/AttendanceService');
  await resumePersistentAttendanceTrackingIfNeeded();
});
