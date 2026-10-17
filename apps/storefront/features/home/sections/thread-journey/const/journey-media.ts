export const journeyMedia = {
  ready: "/home/journey/ready.webp",
  custom: "/home/journey/custom.webp",
  /**
   * Shown when no product is currently marked `in_workshop`: a real bench
   * photo from an actual making journal (RAD-M-1405-17), not a stand-in from
   * an unrelated section. Keeps "today in the workshop" honest when nothing
   * is live without ever misrepresenting a sold/available piece as current.
   */
  workshopFallback: "/making/RAD-M-1405-17/cleaned.webp",
} as const;
