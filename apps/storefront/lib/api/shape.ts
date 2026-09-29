import type { ShapeQuestion } from "@rad/types";
import { api } from "./client";

export async function fetchShapeQuestions() {
  return api<ShapeQuestion[]>("/shape/questions");
}
