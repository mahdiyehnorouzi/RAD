"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShapeQuestion } from "@rad/types";
import { fetchShapeQuestions } from "@/lib/api";
import type { ShapeQuestionsStatus } from "../type";

/** The quiz steps as staff arranged them in the admin. */
export function useShapeQuestions() {
  const [questions, setQuestions] = useState<ShapeQuestion[]>([]);
  const [status, setStatus] = useState<ShapeQuestionsStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchShapeQuestions()
      .then((payload) => {
        if (cancelled) return;
        setQuestions(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  return { questions, status, retry };
}
