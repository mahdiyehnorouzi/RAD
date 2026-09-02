export const colors = {
  primary: "#263d34",
  canvas: "#eee7dc",
  paper: "#f7f2e9",
  ink: "#18231f",
  clay: "#8a4938",
  sand: "#cbb892",
  moss: "#263d34",
  muted: "#6f726b",
  line: "#d6cfc3",
  film: "#191a17",
  white: "#ffffff",
} as const;

export const rounded = {
  control: "2px",
  card: "4px",
  artwork: "4px",
} as const;

export const spacing = {
  page: "clamp(1.25rem, 5vw, 5rem)",
  section: "clamp(5rem, 11vw, 11rem)",
} as const;

export const theme = {
  colors,
  rounded,
  spacing,
} as const;
