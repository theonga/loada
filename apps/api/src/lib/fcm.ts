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

export interface PushResult {
  sent: boolean;
  /** true when the token is invalid/expired and should be removed from the DB */
  invalidToken: boolean;
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<PushResult> {
  if (!admin.apps.length) {
    console.warn("[FCM stub] Push not sent — Firebase not configured:", { title, body });
    return { sent: false, invalidToken: false };
  }
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    });
    return { sent: true, invalidToken: false };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    const invalidToken =
      code === "messaging/invalid-registration-token" ||
      code === "messaging/registration-token-not-registered";
    console.error("[FCM] Failed to send push:", code, err);
    return { sent: false, invalidToken };
  }
}
