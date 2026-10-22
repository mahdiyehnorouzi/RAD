export const journeyMedia = {
  ready: "/home/journey/ready.webp",
  custom: "/home/journey/custom.webp",
  /**
   * The approved Workshop scene: torn paper top/bottom baked in, a blank
   * panel on the reading end for the real HTML heading/CTA, the bench bowl
   * on the other. Replaces the old separately-masked sheet+photo pairing.
   * Mobile/tablet only (<1024px) - desktop uses workshopSceneDesktop.
   */
  workshopScene: "/home/journey/workshop-scene.webp",
  /**
   * The approved Custom Order scene: a blank torn panel on the reading end
   * for the real HTML text/CTA, the sketching-hand/vase/bowl photograph
   * filling the rest, and a narrow blank strip on the far edge for the real
   * HTML stepper. Mobile/tablet only (<1024px) - desktop uses
   * customSceneDesktop.
   */
  customScene: "/home/journey/custom-scene.webp",
  /**
   * Desktop-only (>=1024px) replacements for the three two-column/grid
   * compositions in journey-workshop/ready/custom.module.css: plain
   * standalone photos with no baked panel/stepper, since those are real
   * HTML elements at desktop now, not overlays painted into the photo.
   */
  workshopSceneDesktop: "/home/journey/workshop-scene-desktop.webp",
  readyDesktop: "/home/journey/ready-desktop.webp",
  customSceneDesktop: "/home/journey/custom-scene-desktop.webp",
} as const;
