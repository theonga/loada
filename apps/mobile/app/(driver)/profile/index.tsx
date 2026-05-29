import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Text } from "@components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useColors,
  ColorPalette,
  Typography,
  Spacing,
  Radius,
  Components,
} from "@constants/theme";
import { Avatar } from "@components/ui/Avatar";
import { Stars } from "@components/ui/Stars";
import { Chip } from "@components/ui/Chip";
import { Skeleton } from "@components/ui/Skeleton";
import { useAuthStore } from "@store/auth.store";
import { showError, showConfirm } from "@components/ui/AppAlert";
import {
  getMyDriverProfile,
  updateProfile,
  updateDriverProfile,
} from "@services";
import { isAuthError } from "@services/api";
import { TONNAGE_TIERS, TRUCK_TYPES, TRUCK_TYPE_HAS_TONNAGE, TRUCK_TYPE_LABELS, type TruckType } from "@constants/index";
import type { DriverProfile } from "@/types";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout, updateName, updateEmail } = useAuthStore();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [truckTypeInput, setTruckTypeInput] = useState<TruckType>('TRUCK');
  const [truckMakeInput, setTruckMakeInput] = useState("");
  const [truckModelInput, setTruckModelInput] = useState("");
  const [truckYearInput, setTruckYearInput] = useState("");
  const [truckRegInput, setTruckRegInput] = useState("");
  const [capacityInput, setCapacityInput] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getMyDriverProfile()
      .then(setDriver)
      .catch((err: unknown) => {
        if (isAuthError(err)) return;
        setLoadError(
          (err as { message?: string })?.message ?? "Could not load profile",
        );
      });
  }, []);

  const startEdit = useCallback(() => {
    setNameInput(user?.name ?? "");
    setEmailInput(user?.email ?? "");
    setTruckTypeInput((driver?.truckType as TruckType) ?? 'TRUCK');
    setTruckMakeInput(driver?.truckMake ?? "");
    setTruckModelInput(driver?.truckModel ?? "");
    setTruckYearInput(driver?.truckYear ? String(driver.truckYear) : "");
    setTruckRegInput(driver?.truckRegistration ?? "");
    setCapacityInput(driver?.capacityTonnes ?? 10);
    setEditing(true);
  }, [user?.name, user?.email, driver]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const saveEdit = useCallback(async () => {
    setSaving(true);
    try {
      const nameTrimmed = nameInput.trim();
      const emailTrimmed = emailInput.trim();

      await updateProfile({
        name: nameTrimmed || undefined,
        email: emailTrimmed || null,
      });
      if (nameTrimmed) updateName(nameTrimmed);
      updateEmail(emailTrimmed || null);

      const year = parseInt(truckYearInput, 10);
      const hasTonnage = TRUCK_TYPE_HAS_TONNAGE[truckTypeInput];
      await updateDriverProfile({
        truckType: truckTypeInput,
        truckMake: truckMakeInput.trim() || undefined,
        truckModel: truckModelInput.trim() || undefined,
        truckYear: !isNaN(year) && year >= 1990 ? year : undefined,
        truckRegistration: truckRegInput.trim() || undefined,
        capacityTonnes: hasTonnage ? (capacityInput as 1 | 1.5 | 2 | 5 | 10 | 20 | 30) : 1,
      });
      const updated = await getMyDriverProfile();
      setDriver(updated);
      setEditing(false);
    } catch {
      showError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    nameInput,
    emailInput,
    truckTypeInput,
    truckMakeInput,
    truckModelInput,
    truckYearInput,
    truckRegInput,
    capacityInput,
    updateName,
    updateEmail,
  ]);

  function expiryWarning(isoDate?: string) {
    if (!isoDate) return false;
    return new Date(isoDate).getTime() - Date.now() < 60 * 86400000;
  }

  function formatExpiry(isoDate?: string) {
    if (!isoDate) return "No expiry on file";
    return `Expires ${new Date(isoDate).toLocaleDateString()}`;
  }

  const menuItems: { label: string; icon: IoniconName; onPress: () => void }[] =
    [
      {
        label: "Wallet & deposits",
        icon: "wallet-outline",
        onPress: () => router.push("/(driver)/wallet"),
      },
      {
        label: "Earnings",
        icon: "trending-up-outline",
        onPress: () => router.push("/(driver)/earnings"),
      },
      {
        label: "Help & support",
        icon: "help-circle-outline",
        onPress: () => router.push("/(shared)/help"),
      },
      {
        label: "Settings",
        icon: "settings-outline",
        onPress: () => router.push("/(shared)/settings"),
      },
    ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* ── Appbar ─────────────────────────────────────────────────────────── */}
      <View style={styles.appbar}>
        {editing ? (
          <Pressable
            style={styles.appbarAction}
            onPress={cancelEdit}
            disabled={saving}
          >
            <Text style={[styles.appbarActionText, { color: C.text.secondary }]}>
              Cancel
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}

        <Text style={styles.appbarTitle}>
          {editing ? "Edit profile" : "Profile"}
        </Text>

        {editing ? (
          <Pressable
            style={styles.appbarAction}
            onPress={saveEdit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <Text style={[styles.appbarActionText, { color: C.accent }]}>
                Save
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.appbarAction} onPress={startEdit}>
            <Text style={[styles.appbarActionText, { color: C.accent }]}>
              Edit
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, { color: C.status.red }]}>
              {loadError}
            </Text>
          </View>
        ) : null}

        {editing ? (
          /* ── Flat edit form — no card wrapper ──────────────────────────────── */
          <View style={styles.editFields}>
            <Text style={styles.editSectionLabel}>PERSONAL</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput
                style={[styles.fieldInput, { color: C.text.primary }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Your full name"
                placeholderTextColor={C.text.tertiary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <View style={[styles.fieldDisplay, { backgroundColor: C.background.elevated }]}>
                <Text style={[styles.fieldDisplayText, { color: C.text.secondary }]}>
                  {user?.phone ?? "—"}
                </Text>
                <Text style={styles.fieldNote}>Contact support to change</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL <Text style={styles.fieldOptional}>(optional)</Text></Text>
              <TextInput
                style={[styles.fieldInput, { color: C.text.primary }]}
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="your@email.com"
                placeholderTextColor={C.text.tertiary}
                returnKeyType="next"
              />
              <Text style={styles.fieldHint}>
                Used for EcoCash/OneMoney payment notifications
              </Text>
            </View>

            <View style={styles.editSectionDivider} />
            <Text style={styles.editSectionLabel}>VEHICLE</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TRUCK TYPE</Text>
              <View style={styles.capacityRow}>
                {TRUCK_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    style={[
                      styles.capacityPill,
                      truckTypeInput === t && { backgroundColor: "rgba(245,166,35,0.15)", borderColor: C.accent },
                    ]}
                    onPress={() => setTruckTypeInput(t)}
                  >
                    <Text style={[styles.capacityPillText, { color: truckTypeInput === t ? C.accent : C.text.secondary }]}>
                      {TRUCK_TYPE_LABELS[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>MAKE</Text>
                <TextInput
                  style={[styles.fieldInput, { color: C.text.primary }]}
                  value={truckMakeInput}
                  onChangeText={setTruckMakeInput}
                  placeholder="e.g. Isuzu"
                  placeholderTextColor={C.text.tertiary}
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>MODEL</Text>
                <TextInput
                  style={[styles.fieldInput, { color: C.text.primary }]}
                  value={truckModelInput}
                  onChangeText={setTruckModelInput}
                  placeholder="e.g. NQR"
                  placeholderTextColor={C.text.tertiary}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>YEAR</Text>
                <TextInput
                  style={[styles.fieldInput, { color: C.text.primary }]}
                  value={truckYearInput}
                  onChangeText={setTruckYearInput}
                  placeholder="e.g. 2019"
                  placeholderTextColor={C.text.tertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>REGISTRATION</Text>
                <TextInput
                  style={[styles.fieldInput, { color: C.text.primary }]}
                  value={truckRegInput}
                  onChangeText={setTruckRegInput}
                  placeholder="e.g. ABC 1234"
                  placeholderTextColor={C.text.tertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            {TRUCK_TYPE_HAS_TONNAGE[truckTypeInput] ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CAPACITY (TONNES)</Text>
                <View style={styles.capacityRow}>
                  {TONNAGE_TIERS.map((t) => (
                    <Pressable
                      key={t}
                      style={[
                        styles.capacityPill,
                        capacityInput === t && { backgroundColor: "rgba(245,166,35,0.15)", borderColor: C.accent },
                      ]}
                      onPress={() => setCapacityInput(t)}
                    >
                      <Text style={[styles.capacityPillText, { color: capacityInput === t ? C.accent : C.text.secondary }]}>
                        {t}t
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CAPACITY (TONNES)</Text>
                <View style={[styles.fieldDisplay, { backgroundColor: C.background.elevated }]}>
                  <Text style={[styles.fieldDisplayText, { color: C.text.secondary }]}>Standard</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ── View mode hero card ──────────────────────────────────────────── */
          <View style={styles.heroCard}>
            <Avatar name={user?.name ?? "?"} size={72} />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.name || "—"}</Text>
              <Text style={styles.heroPhone}>{user?.phone ?? ""}</Text>
              {user?.email ? (
                <Text style={styles.heroEmail}>{user.email}</Text>
              ) : null}
              {driver ? (
                <Stars rating={driver.rating} count={driver.reviewCount} size={14} />
              ) : (
                <Skeleton width={80} height={14} borderRadius={4} />
              )}
              <View style={[styles.roleBadge, { borderColor: C.background.divider, backgroundColor: C.background.elevated }]}>
                <Text style={[styles.roleBadgeText, { color: C.text.secondary }]}>
                  Driver
                </Text>
              </View>
            </View>
          </View>
        )}

        {!editing && (
          <>
            {/* ── Vehicle ──────────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VEHICLE</Text>
              <View style={styles.card}>
                {driver ? (
                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleModel}>
                        {driver.truckMake} {driver.truckModel} ({driver.truckYear})
                      </Text>
                      <Text style={styles.vehicleReg}>{driver.truckRegistration}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {driver.truckType && (
                        <Chip variant="default">
                          {TRUCK_TYPE_LABELS[(driver.truckType as TruckType)] ?? driver.truckType}
                        </Chip>
                      )}
                      <Chip variant="amber">
                        {TRUCK_TYPE_HAS_TONNAGE[(driver.truckType as TruckType) ?? 'TRUCK']
                          ? `${driver.capacityTonnes}t`
                          : 'Standard'}
                      </Chip>
                    </View>
                  </View>
                ) : (
                  <Skeleton width="100%" height={40} borderRadius={8} />
                )}
              </View>
            </View>

            {/* ── Documents ────────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DOCUMENTS</Text>
              <View style={styles.card}>
                {driver ? (
                  <>
                    {[
                      {
                        label: "Driver's licence",
                        expiry: driver.licenceExpiry,
                        warn: expiryWarning(driver.licenceExpiry),
                      },
                      {
                        label: "Truck registration",
                        expiry: driver.registrationExpiry,
                        warn: expiryWarning(driver.registrationExpiry),
                      },
                    ].map(({ label, expiry, warn }, i, arr) => (
                      <React.Fragment key={label}>
                        <View style={styles.docRow}>
                          <View style={styles.docInfo}>
                            <Text style={styles.docLabel}>{label}</Text>
                            <View style={styles.docExpiryRow}>
                              {warn && (
                                <Ionicons name="warning-outline" size={12} color={C.status.amber} />
                              )}
                              <Text style={[styles.docExpiry, warn && { color: C.status.amber }]}>
                                {formatExpiry(expiry)}
                              </Text>
                            </View>
                          </View>
                          <Chip
                            variant={
                              driver.documentStatus === "APPROVED" ? "green" :
                              driver.documentStatus === "REJECTED" ? "red" : "amber"
                            }
                          >
                            {driver.documentStatus}
                          </Chip>
                        </View>
                        {i < arr.length - 1 && (
                          <View style={[styles.cardDivider, { backgroundColor: C.background.divider }]} />
                        )}
                      </React.Fragment>
                    ))}
                    <View style={[styles.cardDivider, { backgroundColor: C.background.divider }]} />
                    <Pressable style={styles.manageDocsBtn} onPress={() => router.push("/(driver)/documents")}>
                      <Text style={[styles.manageDocsBtnText, { color: C.accent }]}>
                        Manage documents
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Skeleton width="100%" height={80} borderRadius={8} />
                )}
              </View>
            </View>

            {/* ── Menu ─────────────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCOUNT</Text>
              <View style={styles.menuCard}>
                {menuItems.map(({ label, icon, onPress }, i) => (
                  <React.Fragment key={label}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.menuRow,
                        pressed && { backgroundColor: C.background.elevated },
                      ]}
                      onPress={onPress}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: C.background.elevated }]}>
                        <Ionicons name={icon} size={18} color={C.text.secondary} />
                      </View>
                      <Text style={styles.menuLabel}>{label}</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.text.tertiary} />
                    </Pressable>
                    {i < menuItems.length - 1 && (
                      <View style={[styles.menuDivider, { backgroundColor: C.background.divider }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Sign out ─────────────────────────────────────────────────────── */}
            <Pressable
              style={[styles.signOutBtn, { borderColor: "rgba(244,67,54,0.30)" }]}
              onPress={() =>
                showConfirm({
                  title: "Sign out?",
                  message: "You can sign back in at any time.",
                  confirmLabel: "Sign out",
                  destructive: true,
                  onConfirm: () => {
                    logout();
                    router.replace("/(auth)");
                  },
                })
              }
            >
              <Text style={[styles.signOutText, { color: C.status.red }]}>
                Sign out
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background.primary },

    // Appbar
    appbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenH,
      height: 52,
    },
    appbarTitle: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    appbarAction: {
      minWidth: 72,
      height: Components.touchMin,
      alignItems: "center",
      justifyContent: "center",
    },
    appbarActionText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.medium,
    },

    content: { padding: Spacing.screenH, gap: 28, paddingBottom: 48 },

    errorBanner: {
      borderRadius: Radius.card,
      padding: Spacing.card,
      backgroundColor: "rgba(244,67,54,0.08)",
      borderWidth: 1,
      borderColor: "rgba(244,67,54,0.20)",
    },
    errorText: { fontSize: Typography.sizes.label },

    // Hero card
    heroCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: Spacing.card,
      gap: 14,
    },
    heroInfo: { alignItems: "center", gap: 5 },
    heroName: {
      fontSize: Typography.sizes.cardTitle,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    heroPhone: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      fontVariant: ["tabular-nums"],
    },
    heroEmail: {
      fontSize: Typography.sizes.label,
      color: C.text.tertiary,
    },
    roleBadge: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      letterSpacing: 0.3,
    },

    // Edit fields
    editFields: { width: "100%", gap: 20 },
    editSectionLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: "600",
      letterSpacing: 1.2,
      color: C.text.tertiary,
      marginBottom: -8,
    },
    editSectionDivider: {
      height: 1,
      backgroundColor: C.background.divider,
    },
    fieldGroup: { gap: 7 },
    fieldRow: { flexDirection: "row", gap: Spacing.gap },
    fieldLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: "600",
      letterSpacing: 1.2,
      color: C.text.secondary,
    },
    fieldOptional: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: "400",
      color: C.text.tertiary,
      letterSpacing: 0,
      textTransform: "none",
    },
    fieldInput: {
      height: Components.inputHeight,
      borderRadius: Radius.button,
      backgroundColor: C.background.elevated,
      paddingHorizontal: 14,
      fontSize: Typography.sizes.body,
    },
    fieldDisplay: {
      borderRadius: Radius.button,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 2,
    },
    fieldDisplayText: {
      fontSize: Typography.sizes.body,
      fontVariant: ["tabular-nums"],
    },
    fieldNote: { fontSize: Typography.sizes.chip, color: C.text.tertiary },
    fieldHint: { fontSize: Typography.sizes.chip, color: C.text.tertiary, lineHeight: 16 },
    capacityRow: { flexDirection: "row", gap: Spacing.gapSm, flexWrap: "wrap" },
    capacityPill: {
      height: Components.pillHeight,
      paddingHorizontal: 14,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    capacityPillText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.semibold,
    },

    // Section
    section: { gap: Spacing.gap },
    sectionLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: "600",
      letterSpacing: 1.2,
      color: C.text.tertiary,
      paddingLeft: 4,
    },
    card: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: Spacing.gap,
    },
    cardDivider: { height: StyleSheet.hairlineWidth },

    // Vehicle
    vehicleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    vehicleInfo: { gap: 3 },
    vehicleModel: {
      fontSize: Typography.sizes.body,
      color: C.text.primary,
      fontWeight: Typography.weights.medium,
    },
    vehicleReg: { fontSize: Typography.sizes.label, color: C.text.secondary },

    // Documents
    docRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    docInfo: { gap: 3 },
    docLabel: { fontSize: Typography.sizes.body, color: C.text.primary },
    docExpiryRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    docExpiry: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    manageDocsBtn: { paddingTop: 2 },
    manageDocsBtnText: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.medium,
    },

    // Menu
    menuCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: Spacing.card,
      gap: 12,
      minHeight: Components.touchMin,
    },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    menuLabel: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },

    // Sign out
    signOutBtn: {
      height: Components.buttonHeight,
      borderRadius: Radius.button,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    signOutText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.medium,
    },
  });
}
