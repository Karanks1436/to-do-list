// utils/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure how notifications behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register & return push token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("Must use physical device for Push Notifications");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification Permission Denied");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id", // Replace with your actual Expo projectId from app.json
    });

    return tokenData.data;
  } catch (err) {
    console.error("Error registering push notification:", err);
    return null;
  }
}

// Schedule repeating reminders
export async function scheduleHourlyReminder(message: string) {
  await Notifications.cancelAllScheduledNotificationsAsync(); // avoid duplication

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏱ Reminder",
      body: message || "Don't forget to check your tasks!",
    },
    trigger: {
      seconds: 3600, // 1 hour
      repeats: true,
    },
  });

  console.log("Hourly reminder scheduled!");
}
