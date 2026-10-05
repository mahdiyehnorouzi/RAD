"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import { useLocale } from "@/components/i18n";

export function OrderVoice({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { locale } = useLocale();
  const fa = locale === "fa";
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    if (seconds >= 90 && recorder.current?.state === "recording")
      recorder.current.stop();
  }, [seconds]);
  async function start() {
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const r = new MediaRecorder(media, { audioBitsPerSecond: 32000 });
      recorder.current = r;
      const parts: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) parts.push(e.data);
      };
      r.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        if (!alive.current) return;
        setRecording(false);
        const blob = new Blob(parts, { type: r.mimeType });
        if (!blob.size) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (alive.current) onChange(String(reader.result));
        };
        reader.readAsDataURL(blob);
      };
      r.start();
      setSeconds(0);
      setRecording(true);
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        fa
          ? "برای ضبط صدا، دسترسی میکروفن را فعال کن."
          : "Allow microphone access to record your idea.",
      );
    }
  }
  return (
    <div className="order-flow-recorder">
      <button
        type="button"
        className="order-flow-mic"
        onClick={() => (recording ? recorder.current?.stop() : void start())}
        aria-label={
          recording
            ? fa
              ? "توقف ضبط"
              : "Stop recording"
            : fa
              ? "شروع ضبط"
              : "Start recording"
        }
        data-recording={recording}
      >
        <Mic />
      </button>
      <time>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </time>
      <b>
        {recording
          ? fa
            ? "در حال ضبط…"
            : "Recording…"
          : fa
            ? "ایده‌ات رو بگو"
            : "Tell us your idea"}
      </b>
      {recording ? (
        <button
          type="button"
          className="order-flow-stop"
          onClick={() => recorder.current?.stop()}
          aria-label={fa ? "توقف ضبط" : "Stop recording"}
        >
          <Square fill="currentColor" />
        </button>
      ) : value ? (
        <>
          <audio controls src={value} />
          <button
            type="button"
            className="order-flow-specific"
            onClick={() => void start()}
          >
            <RotateCcw />
            {fa ? "دوباره ضبط کن" : "Record again"}
          </button>
        </>
      ) : null}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
