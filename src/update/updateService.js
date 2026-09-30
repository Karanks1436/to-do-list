import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

const ADMIN_EMAIL = "karank2s6266@gmail.com";

export async function publishAndroidUpdate({
  latestVersion,
  minSupportedVersion,
  title,
  message,
  downloadUrl,
  force = false,
}) {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.email?.toLowerCase() !== ADMIN_EMAIL) {
    throw new Error("Only the designated administrator can publish updates.");
  }

  const version = String(latestVersion || "").trim();
  const minimum = String(minSupportedVersion || version).trim();
  const url = String(downloadUrl || "").trim();
  const updateTitle = String(title || "New version available").trim();
  const updateMessage = String(
    message || `Trash2Treasure version ${version} is ready to download.`
  ).trim();

  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("Latest version must use a format such as 1.2.0.");
  }
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(minimum)) {
    throw new Error("Minimum supported version must use a format such as 1.0.0.");
  }
  if (!/^https:\/\//i.test(url)) {
    throw new Error("Enter a secure HTTPS download link.");
  }

  const config = {
    platform: "android",
    latestVersion: version,
    minSupportedVersion: minimum,
    title: updateTitle,
    message: updateMessage,
    downloadUrl: url,
    force: force === true,
    publishedBy: currentUser.uid,
    publishedByEmail: currentUser.email || ADMIN_EMAIL,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Write the live configuration first. Every running app subscribed through
  // useAppUpdate receives this document immediately.
  await Promise.all([
    setDoc(doc(db, "appConfig", "android"), config, { merge: true }),
    setDoc(
      doc(db, "appVersions", `android-${version.replace(/[^0-9A-Za-z.-]/g, "-")}`),
      config,
      { merge: true }
    ),
  ]);

  // Notify every non-removed account in chunks below Firestore's 500-write
  // batch limit. Notifications remain available in the in-app Firebase inbox.
  const usersSnapshot = await getDocs(collection(db, "users"));
  const recipients = usersSnapshot.docs.filter(
    (snapshot) => snapshot.data()?.accountStatus !== "removed"
  );

  const chunkSize = 400;
  for (let index = 0; index < recipients.length; index += chunkSize) {
    const batch = writeBatch(db);
    recipients.slice(index, index + chunkSize).forEach((userSnapshot) => {
      const notificationRef = doc(collection(db, "notifications"));
      batch.set(notificationRef, {
        userId: userSnapshot.id,
        senderId: currentUser.uid,
        type: "app_update",
        title: updateTitle,
        body: updateMessage,
        version,
        downloadUrl: url,
        required: force === true,
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return { version, recipientCount: recipients.length, config };
}
