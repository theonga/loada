import { useColorScheme } from "react-native";

export type ColorPalette = {
  background: {
    primary: string;
    card: string;
    elevated: string;
    divider: string;
  };
  accent: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  status: {
    green: string;
    amber: string;
    red: string;
    blue: string;
  };
};

export const darkColors: ColorPalette = {
  background: {
    primary: "#0A0A0A",
    card: "#141414",
    elevated: "#1E1E1E",
    divider: "#2A2A2A",
  },
  accent: "#F5A623",
  text: {
    primary: "#FFFFFF",
    secondary: "#8A8A8A",
    tertiary: "#4A4A4A",
  },
  status: {
    green: "#00C853",
    amber: "#FFB300",
    red: "#F44336",
    blue: "#2196F3",
  },
};

export const lightColors: ColorPalette = {
  background: {
    primary: "#F5F5F5",
    card: "#FFFFFF",
    elevated: "#EBEBEB",
    divider: "#E0E0E0",
  },
  accent: "#F5A623",
  text: {
    primary: "#0A0A0A",
    secondary: "#6B6B6B",
    tertiary: "#A0A0A0",
  },
  status: {
    green: "#00C853",
    amber: "#FFB300",
    red: "#F44336",
    blue: "#2196F3",
  },
};

export function useColors(): ColorPalette {
  const scheme = useColorScheme();
  return scheme === "light" ? lightColors : darkColors;
}

// Legacy export — kept for module-level StyleSheet.create() in files not yet migrated.
// Prefer useColors() for all new and updated components.
export const Colors = darkColors;

export const Typography = {
  fontHeading: "OpenSans",
  fontBody: "OpenSans",
  weights: {
    light: "300" as const,
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  sizes: {
    heroPrice: 72,
    largePrice: 48,
    price: 32,
    heading: 29,
    screenTitle: 23,
    cardTitle: 19,
    body: 16,
    bodySmall: 15,
    label: 14,
    chip: 13,
    eyebrow: 12,
    micro: 11,
  },
} as const;

export const Spacing = {
  screenH: 20,
  card: 16,
  cardSm: 14,
  gap: 12,
  gapSm: 8,
  section: 24,
} as const;

export const Radius = {
  pill: 999,
  card: 12,
  button: 8,
  chip: 4,
  inner: 8,
} as const;

export const Components = {
  buttonHeight: 52,
  inputHeight: 52,
  pillHeight: 36,
  chipHeight: 24,
  appbarHeight: 62,
  tabbarHeight: 76,
  bottomSheetR: 20,
  handleWidth: 36,
  handleHeight: 4,
  avatarBorder: 1,
  touchMin: 48,
  progressHeight: 2,
} as const;

export const Shadows = {
  accentFocusRing: "rgba(245, 166, 35, 0.08)",
  accentGlow: "rgba(245, 166, 35, 0.20)",
} as const;

export function chipVariants(C: ColorPalette) {
  return {
    default: {
      bg: C.background.elevated,
      border: C.background.divider,
      text: C.text.secondary,
    },
    amber: {
      bg: "rgba(245,166,35,0.10)",
      border: "rgba(245,166,35,0.25)",
      text: "#F5A623",
    },
    green: {
      bg: "rgba(0,200,83,0.10)",
      border: "rgba(0,200,83,0.25)",
      text: "#00C853",
    },
    red: {
      bg: "rgba(244,67,54,0.10)",
      border: "rgba(244,67,54,0.25)",
      text: "#F44336",
    },
    blue: {
      bg: "rgba(33,150,243,0.10)",
      border: "rgba(33,150,243,0.25)",
      text: "#2196F3",
    },
  } as const;
}

// Legacy — use chipVariants(C) in new/migrated code.
export const ChipVariants = chipVariants(darkColors);
