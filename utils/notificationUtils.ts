// utils/notificationUtils.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Ask for permissions on app load
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    console.log('Notification permissions are not supported on web.');
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

// Schedule a notification at a specific hour
export async function scheduleReminder(hour: number, minute: number, title: string, body: string) {
  if (Platform.OS === 'web') {
    console.log(`(Web) Would schedule notification: ${title} - ${body}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "💧 Time to hydrate!",
      body: body || "Don't forget to drink some water!",
    },
    trigger: {
      type: 'calendar',
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
  });
}

//Schedule multiple reminders
export async function scheduleDailyReminders(times: string[]) {
    if (Platform.OS === 'web') {
        console.log('(Web) Skipping notification scheduling');
        return;
    }

    //clear previous scheduled reminders
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const time of times) {
        const [hourStr, minuteStr] = time.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        await scheduleReminder(hour, minute, `💧 Hydration Reminder`, 'Time to drink some water!');
    }
}
