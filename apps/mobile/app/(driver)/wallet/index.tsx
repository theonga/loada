import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput } from "@components/ui/TextInput";
import { Text } from "@components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useColors,
  ColorPalette,
  Typography,
  Spacing,
  Radius,
  Components,
} from "@constants/theme";
import { getWalletBalance, initiateWalletDeposit } from "@services";
import { getSocket } from "@services/socket";
import { useWalletStore } from "@store/wallet.store";
import { showAlert, showError } from "@components/ui/AppAlert";

type DepositState = "idle" | "sending" | "sent" | "confirmed";

const MIN_DEPOSIT = 10;

const PAYMENT_METHODS = [
  {
    id: "ecocash" as const,
    label: "EcoCash",
    icon: "phone-portrait-outline" as const,
  },
  {
    id: "onemoney" as const,
    label: "OneMoney",
    icon: "phone-portrait-outline" as const,
  },
  {
    id: "vmc" as const,
    label: "Visa / Mastercard",
    icon: "card-outline" as const,
  },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const { balance, commissionPct, setWallet } = useWalletStore();

  const [amount, setAmount] = useState("10");
  const [method, setMethod] = useState<"ecocash" | "onemoney" | "vmc">(
    "ecocash",
  );
  const [phone, setPhone] = useState("");
  const [depositState, setDepositState] = useState<DepositState>("idle");
  const [refreshing, setRefreshing] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const prevBalanceRef = useRef<number>(balance);

  const numAmount = parseInt(amount, 10) || 0;
  const isValid = numAmount >= MIN_DEPOSIT;
  const needsPhone = method === "ecocash" || method === "onemoney";

  useEffect(() => {
    getWalletBalance()
      .then((w) => {
        setWallet(w.balance, w.reservedBalance, w.commissionPct);
        prevBalanceRef.current = w.balance;
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, []);

  // While waiting for payment confirmation: poll every 5 s + listen for socket event
  useEffect(() => {
    if (depositState !== "sent") return;

    function confirm(newBalance: number) {
      setWallet(newBalance, 0, commissionPct);
      setDepositState("confirmed");
    }

    // Socket: instant confirmation when server emits wallet:balance_updated
    const socket = getSocket("/jobs");
    if (!socket.connected) socket.connect();
    const onBalanceUpdated = (data: { balance: number }) => confirm(data.balance);
    socket.on("wallet:balance_updated", onBalanceUpdated);

    // Polling: fallback in case socket misses the event
    const poll = setInterval(() => {
      getWalletBalance()
        .then((w) => {
          if (w.balance > prevBalanceRef.current) confirm(w.balance);
        })
        .catch(() => {});
    }, 5000);

    return () => {
      socket.off("wallet:balance_updated", onBalanceUpdated);
      clearInterval(poll);
    };
  }, [depositState]);

  async function handleDeposit() {
    if (!isValid || depositState === "sending") return;
    if (needsPhone && !phone.trim()) {
      showError(
        `Enter your mobile number to pay with ${method === "ecocash" ? "EcoCash" : "OneMoney"}.`,
        "Phone number required",
      );
      return;
    }

    setDepositState("sending");
    try {
      await initiateWalletDeposit({
        amount: numAmount,
        method,
        phone: needsPhone ? phone : undefined,
      });
      setDepositState("sent");
    } catch (err) {
      setDepositState("idle");
      const raw = (err as Error).message ?? "";
      showAlert({
        icon: "alert-circle-outline",
        iconVariant: "destructive",
        title: "Deposit failed",
        message:
          raw ||
          "Could not reach the payment provider. Check your connection and try again.",
        buttons: [{ label: "OK", variant: "default" }],
      });
    }
  }

  function resetDeposit() {
    setDepositState("idle");
  }

  // ── Confirmed ────────────────────────────────────────────────────────────
  if (depositState === "confirmed") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.title}>Wallet</Text>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillText}>${balance.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.statusScreen}>
          <View style={[styles.statusIconWrap, { backgroundColor: "rgba(0,200,83,0.12)" }]}>
            <Ionicons name="checkmark-circle" size={40} color={C.status.green} />
          </View>
          <Text style={styles.statusTitle}>Balance updated</Text>
          <Text style={styles.statusSub}>
            Your wallet now has ${balance.toFixed(2)}. You can start bidding on loads.
          </Text>
          <View style={styles.steps}>
            <Step C={C} icon="checkmark-circle" label="Payment initiated" state="done" />
            <StepLine C={C} done />
            <Step C={C} icon="phone-portrait" label="Payment confirmed" state="done" />
            <StepLine C={C} done />
            <Step C={C} icon="wallet-outline" label="Balance updated" state="done" />
          </View>
        </View>
        <View style={styles.statusFooter}>
          <Pressable onPress={resetDeposit} style={styles.newDepositBtn}>
            <Text style={styles.newDepositText}>Make another deposit</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Payment status view (replaces entire body after deposit clicked) ────
  if (depositState === "sending" || depositState === "sent") {
    const isSending = depositState === "sending";
    const isMobileMoney = method === "ecocash" || method === "onemoney";
    const methodName =
      method === "ecocash"
        ? "EcoCash"
        : method === "onemoney"
          ? "OneMoney"
          : "Card";

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.appbar}>
          <Pressable
            onPress={isSending ? undefined : () => router.back()}
            style={[styles.backBtn, isSending && { opacity: 0.3 }]}
            disabled={isSending}
          >
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.title}>Wallet</Text>
          <View style={styles.balancePill}>
            {refreshing ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <Text style={styles.balancePillText}>${balance.toFixed(2)}</Text>
            )}
          </View>
        </View>

        <View style={styles.statusScreen}>
          {/* Icon */}
          <View style={styles.statusIconWrap}>
            {isSending ? (
              <ActivityIndicator color={C.accent} size="large" />
            ) : (
              <Ionicons
                name={isMobileMoney ? "phone-portrait" : "card"}
                size={40}
                color={C.accent}
              />
            )}
          </View>

          {/* Heading */}
          <Text style={styles.statusTitle}>
            {isSending
              ? "Initiating payment…"
              : isMobileMoney
                ? `Check your ${methodName} app`
                : "Complete your payment"}
          </Text>
          <Text style={styles.statusSub}>
            {isSending
              ? "Contacting Paynow. Please wait."
              : isMobileMoney
                ? `A $${numAmount} payment prompt was sent to ${phone}. Open ${methodName} and approve it.`
                : `Your $${numAmount} card payment has been initiated. Complete it in your browser.`}
          </Text>

          {/* Steps */}
          <View style={styles.steps}>
            <Step
              C={C}
              icon="checkmark-circle"
              label="Payment initiated"
              state="done"
            />
            <StepLine C={C} done={!isSending} />
            <Step
              C={C}
              icon={isMobileMoney ? "phone-portrait" : "globe-outline"}
              label={
                isMobileMoney ? "Confirm on your phone" : "Approve in browser"
              }
              state={isSending ? "waiting" : "active"}
            />
            <StepLine C={C} done={false} />
            <Step
              C={C}
              icon="wallet-outline"
              label="Balance updated"
              state="waiting"
            />
          </View>

          {!isSending && (
            <Text style={styles.statusHint}>
              Your balance will update automatically once confirmed.
            </Text>
          )}
        </View>

        {/* New deposit — only when sent */}
        {!isSending && (
          <View style={styles.statusFooter}>
            <Pressable onPress={resetDeposit} style={styles.newDepositBtn}>
              <Text style={styles.newDepositText}>Make another deposit</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Deposit form (idle) ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.balancePill}>
          {refreshing ? (
            <ActivityIndicator size="small" color={C.accent} />
          ) : (
            <Text style={styles.balancePillText}>${balance.toFixed(2)}</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.section * 2 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* How Loada fees work — collapsible
          <Pressable style={styles.infoCard} onPress={() => setInfoExpanded((v) => !v)}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>How Loada fees work</Text>
              <Ionicons name={infoExpanded ? "chevron-up" : "chevron-down"} size={16} color={C.accent} />
            </View>
            {infoExpanded && (
              <Text style={styles.infoBody}>
                When you place a bid, {commissionPct}% of your bid amount is reserved from your balance.
                {"\n\n"}If your bid isn't accepted, the amount is returned immediately.
                {"\n\n"}When you complete a job, the {commissionPct}% fee is deducted — that's all. No subscriptions, no monthly fees.
              </Text>
            )}
          </Pressable> */}

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Top-up amount (USD)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={C.text.tertiary}
              />
            </View>
            {numAmount > 0 && numAmount < MIN_DEPOSIT && (
              <Text style={styles.minWarn}>
                Minimum deposit is ${MIN_DEPOSIT}
              </Text>
            )}
            <View style={styles.quickAmounts}>
              {[10, 20, 50, 100].map((v) => (
                <Pressable
                  key={v}
                  style={[
                    styles.quickBtn,
                    String(v) === amount && styles.quickBtnActive,
                  ]}
                  onPress={() => setAmount(String(v))}
                >
                  <Text
                    style={[
                      styles.quickBtnText,
                      String(v) === amount && styles.quickBtnTextActive,
                    ]}
                  >
                    ${v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.label}>Pay via</Text>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                style={[
                  styles.methodRow,
                  method === m.id && styles.methodRowActive,
                ]}
                onPress={() => setMethod(m.id)}
              >
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={method === m.id ? C.accent : C.text.secondary}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    method === m.id && { color: C.accent },
                  ]}
                >
                  {m.label}
                </Text>
                <View
                  style={[styles.radio, method === m.id && styles.radioActive]}
                >
                  {method === m.id && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Phone number — mobile money only */}
          {needsPhone && (
            <View style={styles.section}>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+263 7X XXX XXXX"
                placeholderTextColor={C.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <Pressable
            style={[styles.depositBtn, !isValid && styles.depositBtnDisabled]}
            onPress={handleDeposit}
            disabled={!isValid}
          >
            <Text style={styles.depositBtnText}>
              Deposit ${numAmount || MIN_DEPOSIT}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Step indicator sub-components ───────────────────────────────────────────

function Step({
  C,
  icon,
  label,
  state,
}: {
  C: ColorPalette;
  icon: string;
  label: string;
  state: "done" | "active" | "waiting";
}) {
  const color =
    state === "done"
      ? C.status.green
      : state === "active"
        ? C.accent
        : C.text.tertiary;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor:
            state === "done"
              ? "rgba(0,200,83,0.12)"
              : state === "active"
                ? "rgba(245,166,35,0.12)"
                : "rgba(74,74,74,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as never} size={18} color={color} />
      </View>
      <Text
        style={{
          fontSize: Typography.sizes.body,
          fontWeight:
            state === "active"
              ? Typography.weights.semibold
              : Typography.weights.regular,
          color,
        }}
      >
        {label}
      </Text>
      {state === "done" && (
        <Ionicons
          name="checkmark"
          size={16}
          color={C.status.green}
          style={{ marginLeft: "auto" }}
        />
      )}
    </View>
  );
}

function StepLine({ C, done }: { C: ColorPalette; done: boolean }) {
  return (
    <View
      style={{
        width: 2,
        height: 16,
        marginLeft: 17,
        backgroundColor: done ? C.status.green : C.background.divider,
      }}
    />
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    // ── App bar ────────────────────────────────────────────────────────
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
    balancePill: {
      backgroundColor: C.background.elevated,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minWidth: 70,
      alignItems: "center",
    },
    balancePillText: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      fontVariant: ["tabular-nums"],
    },
    // ── Scroll content ─────────────────────────────────────────────────
    content: {
      padding: Spacing.screenH,
      gap: Spacing.section,
      paddingBottom: 40,
    },
    // ── Info card ──────────────────────────────────────────────────────
    infoCard: {
      backgroundColor: "rgba(245,166,35,0.06)",
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: "rgba(245,166,35,0.15)",
      padding: Spacing.card,
      gap: 6,
    },
    infoHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    infoTitle: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.semibold,
      color: C.accent,
    },
    infoBody: {
      fontSize: Typography.sizes.label,
      color: C.text.secondary,
      lineHeight: 20,
      marginTop: 4,
    },
    // ── Form sections ──────────────────────────────────────────────────
    section: { gap: Spacing.gap },
    label: { fontSize: Typography.sizes.label, color: C.text.secondary },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: Spacing.card,
      paddingVertical: 12,
    },
    currencySymbol: {
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.weights.light,
      color: C.text.secondary,
      marginRight: 4,
    },
    amountInput: {
      flex: 1,
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ["tabular-nums"],
      textAlignVertical: "center",
      includeFontPadding: false,
      padding: 0,
    },
    minWarn: { fontSize: Typography.sizes.chip, color: C.status.amber },
    quickAmounts: { flexDirection: "row", gap: Spacing.gapSm },
    quickBtn: {
      flex: 1,
      height: 36,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    quickBtnActive: {
      borderColor: C.accent,
      backgroundColor: "rgba(245,166,35,0.08)",
    },
    quickBtnText: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      fontVariant: ["tabular-nums"],
    },
    quickBtnTextActive: {
      color: C.accent,
      fontWeight: Typography.weights.semibold,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.gap,
      padding: Spacing.card,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      backgroundColor: C.background.card,
      minHeight: Components.touchMin,
    },
    methodRowActive: {
      borderColor: C.accent,
      backgroundColor: "rgba(245,166,35,0.06)",
    },
    methodLabel: {
      flex: 1,
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: C.background.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: { borderColor: C.accent },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: C.accent,
    },
    phoneInput: {
      height: Components.inputHeight,
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: Spacing.card,
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
    // ── Deposit button ─────────────────────────────────────────────────
    depositBtn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: "center",
      justifyContent: "center",
    },
    depositBtnDisabled: { opacity: 0.5 },
    depositBtnText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },
    // ── Payment status screen ──────────────────────────────────────────
    statusScreen: {
      flex: 1,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 48,
      gap: 20,
    },
    statusIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(245,166,35,0.10)",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 4,
    },
    statusTitle: {
      fontSize: Typography.sizes.screenTitle,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      textAlign: "center",
    },
    statusSub: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      textAlign: "center",
      lineHeight: 22,
    },
    steps: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: 0,
      marginTop: 8,
    },
    statusHint: {
      fontSize: Typography.sizes.chip,
      color: C.text.tertiary,
      textAlign: "center",
    },
    statusFooter: {
      padding: Spacing.screenH,
      paddingBottom: 32,
    },
    newDepositBtn: {
      height: Components.buttonHeight,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    newDepositText: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
    },
  });
}
