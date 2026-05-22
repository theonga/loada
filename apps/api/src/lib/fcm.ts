import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, "\n"),
        clientEmail,
      }),
    });
  }
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!admin.apps.length) {
    console.warn("[FCM stub] Push not sent — Firebase not configured:", { title, body });
    return;
  }
  try {
    await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
  } catch (err) {
    console.error("[FCM] Failed to send push:", err);
  }
}
