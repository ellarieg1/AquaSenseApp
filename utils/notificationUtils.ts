// utils/notificationUtils.ts
import * as Notifications from 'expo-notifications';

// Ask for permissions on app load
export async function requestNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

// Schedule a notification at a specific hour
export async function scheduleReminder(hour: number, minute: number, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💧 Time to hydrate!",
      body: "Don't forget to drink some water!",
    },
    trigger: {
      type: 'calendar',
      hour,
      minute,
      repeats: true,
    } as Notifications.CalendarTriggerInput,
});
}
