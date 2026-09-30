"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/components/i18n";
import styles from "./spark-voice.module.css";
import shell from "../custom-designer.module.css";
import btn from "../../studio-btn.module.css";

export function SparkVoice({
  hasVoice,
  onChange,
}: {
  hasVoice: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useLocale();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        onChange(chunks.current.length > 0);
        setRecording(false);
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      setError(t("designerVoiceNeedMic"));
    }
  }

  function stop() {
    recorder.current?.stop();
    recorder.current = null;
  }

  return (
    <div className={styles.sparkVoice}>
      <button
        type="button"
        className={`${btn.csBtn} ${recording ? `${btn.csBtnPaper} ${styles.recording}` : btn.csBtnSolid}`}
        onClick={recording ? stop : start}
      >
        {recording ? t("designerVoiceStop") : t("designerVoiceStart")}
      </button>
      {hasVoice ? <p>{t("designerVoiceRecorded")}</p> : null}
      {error ? (
        <p className={shell.cdError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
