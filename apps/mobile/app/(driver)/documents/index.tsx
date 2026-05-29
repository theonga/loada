import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Text } from "@components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useColors,
  ColorPalette,
  Typography,
  Spacing,
  Radius,
  Components,
} from "@constants/theme";
import { Chip } from "@components/ui/Chip";
import { Skeleton } from "@components/ui/Skeleton";
import * as ImagePicker from "expo-image-picker";
import {
  getMyDriverProfile,
  updateDriverProfile,
  getPresignedUrl,
  confirmUpload,
} from "@services";
import { showAlert, showError } from "@components/ui/AppAlert";
import type { DriverProfile } from "@/types";

type DocKey =
  | "licenceFront"
  | "licenceBack"
  | "registration"
  | "vehicleFront"
  | "vehicleSide";

interface DocItem {
  key: DocKey;
  label: string;
  purpose: "document" | "truck";
  profileField: keyof DriverProfile;
  expiryField?: keyof DriverProfile;
}

const DOCS: DocItem[] = [
  {
    key: "licenceFront",
    label: "Driver's licence (front)",
    purpose: "document",
    profileField: "licenceUrl",
    expiryField: "licenceExpiry",
  },
  {
    key: "licenceBack",
    label: "Driver's licence (back)",
    purpose: "document",
    profileField: "licenceBackUrl",
  },
  {
    key: "registration",
    label: "Truck registration",
    purpose: "document",
    profileField: "registrationUrl",
    expiryField: "registrationExpiry",
  },
  {
    key: "vehicleFront",
    label: "Vehicle photo (front)",
    purpose: "truck",
    profileField: "truckPhotoUrl",
  },
  {
    key: "vehicleSide",
    label: "Vehicle photo (side)",
    purpose: "truck",
    profileField: "vehicleSidePhotoUrl",
  },
];

const GROUPS: { label: string; keys: DocKey[] }[] = [
  { label: "IDENTITY", keys: ["licenceFront", "licenceBack", "registration"] },
  { label: "VEHICLE", keys: ["vehicleFront", "vehicleSide"] },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocKey | null>(null);

  useEffect(() => {
    getMyDriverProfile()
      .then(setDriver)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function expiryWarning(isoDate?: string) {
    if (!isoDate) return false;
    return new Date(isoDate).getTime() - Date.now() < 60 * 86400000;
  }

  function formatExpiry(isoDate?: string) {
    if (!isoDate) return null;
    return `Expires ${new Date(isoDate).toLocaleDateString()}`;
  }

  async function handleUpload(doc: DocItem) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        icon: "camera-outline",
        title: "Permission needed",
        message: "Allow photo access to upload documents.",
        buttons: [{ label: "OK", variant: "accent" }],
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";

    setUploading(doc.key);
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(
        doc.purpose,
        mimeType,
      );

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: await fetch(asset.uri).then((r) => r.blob()),
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // Persist the S3 key, not the (1-hour) presigned URL. getMyDriverProfile
      // returns fresh URLs on every call, so the view stays valid forever.
      const { s3Key: confirmedKey } = await confirmUpload(s3Key);
      await updateDriverProfile({ [doc.profileField]: confirmedKey });
      const updated = await getMyDriverProfile();
      setDriver(updated);
    } catch (err) {
      showError((err as Error).message ?? "Please try again.", "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  const uploadedCount = driver
    ? DOCS.filter((d) => !!driver[d.profileField]).length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Documents</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.section * 2 },
        ]}
      >
        {/* Overall status */}
        {!loading && driver && (
          <View style={styles.statusCard}>
            <Ionicons
              name={
                driver.documentStatus === "APPROVED"
                  ? "checkmark-circle"
                  : driver.documentStatus === "REJECTED"
                    ? "close-circle"
                    : "time-outline"
              }
              size={20}
              color={
                driver.documentStatus === "APPROVED"
                  ? C.status.green
                  : driver.documentStatus === "REJECTED"
                    ? C.status.red
                    : C.status.amber
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>
                Verification status · {uploadedCount}/{DOCS.length} uploaded
              </Text>
              <Text style={styles.statusSub}>
                {driver.documentStatus === "APPROVED"
                  ? "Your documents are verified. You can bid on loads."
                  : driver.documentStatus === "REJECTED"
                    ? "Documents rejected. Re-upload clear, well-lit photos."
                    : driver.documentStatus === "UNDER_REVIEW"
                      ? "Under review — usually 1–2 business days."
                      : "Upload all documents below to start bidding on loads."}
              </Text>
            </View>
            <Chip
              variant={
                driver.documentStatus === "APPROVED"
                  ? "green"
                  : driver.documentStatus === "REJECTED"
                    ? "red"
                    : "amber"
              }
            >
              {driver.documentStatus}
            </Chip>
          </View>
        )}

        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={72} borderRadius={12} />
            ))
          : GROUPS.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                {group.keys.map((key) => {
                  const doc = DOCS.find((d) => d.key === key)!;
                  const url = driver?.[doc.profileField] as string | undefined;
                  const expiry = doc.expiryField
                    ? (driver?.[doc.expiryField] as string | undefined)
                    : undefined;
                  const warn = expiryWarning(expiry);
                  const isUploading = uploading === key;
                  const expiryText = formatExpiry(expiry);

                  return (
                    <View
                      key={key}
                      style={[
                        styles.docCard,
                        url && styles.docCardUploaded,
                        warn && { borderColor: C.status.amber },
                      ]}
                    >
                      <View
                        style={[
                          styles.docIconBox,
                          url && { backgroundColor: "rgba(245,166,35,0.10)" },
                        ]}
                      >
                        <Ionicons
                          name={url ? "document-text" : "document-text-outline"}
                          size={22}
                          color={url ? C.accent : C.text.tertiary}
                        />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docLabel}>{doc.label}</Text>
                        <View style={styles.docMeta}>
                          {url ? (
                            <>
                              <Ionicons
                                name="checkmark-circle"
                                size={12}
                                color={C.status.green}
                              />
                              <Text
                                style={[
                                  styles.docSub,
                                  { color: C.status.green },
                                ]}
                              >
                                Uploaded
                              </Text>
                              {warn && expiryText && (
                                <>
                                  <Text
                                    style={[
                                      styles.docSub,
                                      { color: C.text.tertiary },
                                    ]}
                                  >
                                    ·
                                  </Text>
                                  <Ionicons
                                    name="warning-outline"
                                    size={12}
                                    color={C.status.amber}
                                  />
                                  <Text
                                    style={[
                                      styles.docSub,
                                      { color: C.status.amber },
                                    ]}
                                  >
                                    {expiryText}
                                  </Text>
                                </>
                              )}
                              {!warn && expiryText && (
                                <>
                                  <Text
                                    style={[
                                      styles.docSub,
                                      { color: C.text.tertiary },
                                    ]}
                                  >
                                    ·
                                  </Text>
                                  <Text style={styles.docSub}>
                                    {expiryText}
                                  </Text>
                                </>
                              )}
                            </>
                          ) : (
                            <Text
                              style={[
                                styles.docSub,
                                { color: C.text.tertiary },
                              ]}
                            >
                              Not uploaded
                            </Text>
                          )}
                        </View>
                      </View>
                      <Pressable
                        style={[
                          styles.uploadChip,
                          isUploading && { opacity: 0.6 },
                        ]}
                        onPress={() => handleUpload(doc)}
                        disabled={isUploading || uploading !== null}
                      >
                        {isUploading ? (
                          <ActivityIndicator size="small" color={C.accent} />
                        ) : (
                          <>
                            <Ionicons
                              name={url ? "refresh" : "cloud-upload-outline"}
                              size={14}
                              color={C.accent}
                            />
                            <Text style={styles.uploadChipText}>
                              {url ? "Replace" : "Upload"}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={C.text.tertiary}
          />
          <Text style={styles.infoText}>
            Upload clear, well-lit photos. Documents are reviewed by Loada staff
            within 1–2 business days. Re-upload if any are rejected.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenH,
      height: 56,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: 48 },

    statusCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    statusLabel: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      marginBottom: 2,
    },
    statusSub: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      lineHeight: 18,
    },

    group: { gap: Spacing.gapSm },
    groupLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.tertiary,
      letterSpacing: 1.2,
      paddingLeft: 4,
    },

    docCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.gap,
      minHeight: Components.touchMin,
    },
    docCardUploaded: { borderColor: "rgba(245,166,35,0.20)" },
    docIconBox: {
      width: 40,
      height: 40,
      borderRadius: Radius.inner,
      backgroundColor: C.background.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    docInfo: { flex: 1, gap: 4 },
    docLabel: {
      fontSize: Typography.sizes.bodySmall,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    docMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap",
    },
    docSub: { fontSize: Typography.sizes.chip, color: C.text.secondary },

    uploadChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(245,166,35,0.10)",
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: "rgba(245,166,35,0.25)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      minWidth: 76,
      justifyContent: "center",
    },
    uploadChipText: {
      fontSize: Typography.sizes.chip,
      color: C.accent,
      fontWeight: Typography.weights.medium,
    },

    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
    },
    infoText: {
      flex: 1,
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      lineHeight: 18,
    },
  });
}
