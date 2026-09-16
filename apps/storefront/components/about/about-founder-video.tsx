"use client";

import { useEffect, useRef } from "react";
import { aboutMedia } from "./const";

type AboutFounderVideoProps = {
  label: string;
};

export function AboutFounderVideo({ label }: AboutFounderVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const keepPlaying = () => {
      if (video.paused) void video.play().catch(() => undefined);
    };

    keepPlaying();
    video.addEventListener("pause", keepPlaying);
    video.addEventListener("loadeddata", keepPlaying);
    return () => {
      video.removeEventListener("pause", keepPlaying);
      video.removeEventListener("loadeddata", keepPlaying);
    };
  }, []);

  return (
    <figure className="about-founder-media">
      <video
        ref={videoRef}
        className="about-founder-video"
        autoPlay
        disablePictureInPicture
        loop
        muted
        playsInline
        poster={aboutMedia.founder}
        preload="auto"
        aria-label={label}
      >
        <source src={aboutMedia.workshopVideo} type="video/mp4" />
      </video>
    </figure>
  );
}
