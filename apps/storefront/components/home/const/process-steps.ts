import type { MessageKey } from "@/components/i18n";
import { homeMedia } from "./home-media";

export const homeProcessSteps = [
  {
    index: "homeProcessIndex1",
    title: "homeProcessStep1",
    body: "homeProcessBody1",
    image: homeMedia.customOrder[0],
  },
  {
    index: "homeProcessIndex2",
    title: "homeProcessStep2",
    body: "homeProcessBody2",
    image: homeMedia.customOrder[1],
  },
  {
    index: "homeProcessIndex3",
    title: "homeProcessStep3",
    body: "homeProcessBody3",
    image: homeMedia.customOrder[2],
  },
] as const satisfies ReadonlyArray<{
  index: MessageKey;
  title: MessageKey;
  body: MessageKey;
  image: string;
}>;
