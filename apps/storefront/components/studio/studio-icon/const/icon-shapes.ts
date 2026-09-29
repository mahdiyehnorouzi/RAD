type IconShape = ({ d: string } | { cx: number; cy: number; r: number }) & {
  /** `solid` fills with the icon colour; `knock` strokes in the surface colour on top of a solid shape. */
  paint?: "solid" | "knock";
  width?: number;
};

export type StudioIconShape = IconShape;

/** The studio line set: 24px grid, round caps, 1.6–1.8 strokes. */
export const STUDIO_ICONS = {
  arrow_left: { width: 1.8, shapes: [{ d: "M20 12H5m6-6-6 6 6 6" }] },
  arrow_right: { width: 1.8, shapes: [{ d: "M4 12h15m-6-6 6 6-6 6" }] },
  calendar: {
    width: 1.7,
    shapes: [
      { d: "M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" },
      { cx: 9, cy: 13, r: 1, paint: "solid" },
      { cx: 13, cy: 13, r: 1, paint: "solid" },
    ],
  },
  check: { width: 2.1, shapes: [{ d: "m5 12.5 4.5 4.5L19 7.5" }] },
  check_circle: {
    width: 1.8,
    shapes: [
      { cx: 12, cy: 12, r: 10, paint: "solid" },
      { d: "m7.5 12.2 3 3 6-6", paint: "knock" },
    ],
  },
  chevron_down: { width: 1.8, shapes: [{ d: "m6 9 6 6 6-6" }] },
  close: { width: 1.8, shapes: [{ d: "M6.5 6.5l11 11M17.5 6.5l-11 11" }] },
  document: {
    width: 1.7,
    shapes: [{ d: "M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" }],
  },
  edit: { width: 1.8, shapes: [{ d: "M4 20h4l11-11-4-4L4 16v4Zm9-13 4 4" }] },
  home: {
    width: 1.8,
    shapes: [{ d: "m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" }],
  },
  image: {
    width: 1.7,
    shapes: [
      { d: "M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" },
      { cx: 9, cy: 10, r: 1.4, width: 1.5 },
      { d: "m6 17 4-4 3 3 2-2 3 3" },
    ],
  },
  info: {
    width: 1.7,
    shapes: [{ cx: 12, cy: 12, r: 9 }, { d: "M12 10v6M12 7h.01", width: 1.9 }],
  },
  microphone: {
    width: 1.7,
    shapes: [
      { d: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" },
      { d: "M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" },
    ],
  },
  palette: {
    width: 1.6,
    shapes: [
      { d: "M12 3a9 9 0 1 0 0 18h1.5a1.8 1.8 0 0 0 0-3.6H12a2 2 0 0 1 0-4h3a6 6 0 0 0-3-10.4Z" },
      { cx: 7.5, cy: 10, r: 1, paint: "solid" },
      { cx: 9.5, cy: 6.8, r: 1, paint: "solid" },
      { cx: 13.3, cy: 6.5, r: 1, paint: "solid" },
    ],
  },
  play: {
    width: 1.7,
    shapes: [{ cx: 12, cy: 12, r: 9 }, { d: "m10 8 6 4-6 4z", paint: "solid" }],
  },
  plus: { width: 1.8, shapes: [{ d: "M12 5v14M5 12h14" }] },
  ruler: {
    width: 1.7,
    shapes: [{ d: "m5 17 12-12 3 3L8 20H5zM11 9l2 2M14 6l2 2M8 12l2 2" }],
  },
  search: {
    width: 1.8,
    shapes: [{ cx: 10.5, cy: 10.5, r: 5.5 }, { d: "m15 15 5 5" }],
  },
  sparkles: {
    width: 1.6,
    shapes: [
      { d: "m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" },
      {
        d: "m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14ZM5 14l.6 1.8L7.5 16l-1.9.6L5 18.5l-.6-1.9L2.5 16l1.9-.2L5 14Z",
      },
    ],
  },
  tools: {
    width: 1.7,
    shapes: [{ d: "m5 4 15 15M15 5l4 4M4 20l6-6M3.5 3.5l4 1 1 4-2 2-4-4 1-3Z" }],
  },
  truck: {
    width: 1.6,
    shapes: [
      {
        d: "M3 6h11v10H3zM14 10h4l3 3v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
      },
    ],
  },
  upload: { width: 1.8, shapes: [{ d: "M12 16V5m-4 4 4-4 4 4M5 14v5h14v-5" }] },
} satisfies Record<string, { width: number; shapes: IconShape[] }>;

export type StudioIconName = keyof typeof STUDIO_ICONS;
