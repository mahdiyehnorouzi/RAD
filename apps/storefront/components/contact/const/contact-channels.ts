export const RAD_INSTAGRAM = {
  handle: "rad.object",
  profileUrl: "https://www.instagram.com/rad.object/",
  /** Opens a direct-message thread instead of the profile grid. */
  directUrl: "https://ig.me/m/rad.object",
} as const;

/** Stays null until the inbox is live; the UI then says the address is coming. */
export const RAD_EMAIL: string | null = null;
