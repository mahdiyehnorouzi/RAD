import type { HelpQuestion } from "@rad/types";
import { api } from "./client";

/** Server-side: staff edits reach the help page within a minute. */
export async function fetchHelpQuestions() {
  return api<HelpQuestion[]>("/help/questions", { next: { revalidate: 60 } });
}
