/** Design tokens matching the Terracotta Hearth design system */
export const Colors = {
  primary: "#902d13",
  primaryContainer: "#b14529",
  primaryFixed: "#ffdbd2",
  onPrimary: "#ffffff",
  onPrimaryFixed: "#3c0800",

  secondary: "#795900",
  secondaryContainer: "#fcc340",
  secondaryFixed: "#ffdea0",
  secondaryFixedDim: "#f6be3b",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#6f5100",

  surface: "#fbf9f5",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f5f3ef",
  surfaceContainer: "#efeeea",
  surfaceContainerHigh: "#eae8e4",
  surfaceContainerHighest: "#e4e2de",
  surfaceDim: "#dbdad6",
  onSurface: "#1b1c1a",
  onSurfaceVariant: "#54433c",
  inverseSurface: "#30312e",
  inverseOnSurface: "#f2f0ed",

  outline: "#87736b",
  outlineVariant: "#dac1b8",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#93000a",
} as const;

/** Kiln gradient (primary CTA) */
export const kilnGradient = {
  colors: [Colors.primary, Colors.primaryContainer] as [string, string],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;
