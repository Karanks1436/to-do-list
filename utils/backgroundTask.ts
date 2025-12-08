import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

const TASK_NAME = "HOURLY_TASK_REMINDER";

// Runs every time the task triggers in background
TaskManager.defineTask(TASK_NAME, async () => {
  console.log("⏰ Background task triggered...");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📝 Task Reminder",
      body: "You still have tasks pending — tap to check!",
    },
    trigger: null, // Fire instantly when task runs
  });

  return TaskManager.TaskStatus.RUNNING;
});

export async function registerBackgroundTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  
  if (!isRegistered) {
    console.log("Registering hourly task reminder...");

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Reminder Active",
        body: "You will receive reminders every hour.",
      },
      trigger: null,
    });

    await TaskManager.registerTaskAsync(TASK_NAME, {
      minimumInterval: 3600, // 1 hour (seconds)
      stopOnTerminate: false,
    });
  }
}
