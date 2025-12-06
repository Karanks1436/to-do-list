import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    alert("Notification permission required!");
  }
}

export async function scheduleHourlyReminder(pendingCount: number): Promise<void> {
  // Remove previous schedules to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (pendingCount === 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏳ Reminder!",
      body: `You still have ${pendingCount} pending tasks.`,
      sound: true,
    },
    trigger: {
      seconds: 3600, // 1 hour
      repeats: true,
    },
  });
}
