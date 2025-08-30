import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Track = {
  id: string;
  url: string;
};

export type AudioState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  isMetadataLoaded: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
};

export type AudioControls = {
  /** Single entry point to play/toggle/switch */
  play: (track: Track) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (timeSeconds: number) => void;
  setPlaybackRate: (rate: number) => void;
};

export const AudioContext = createContext<{ state: AudioState; controls: AudioControls } | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";  // don't fetch the whole file
    audioRef.current.crossOrigin = "anonymous"; // enable cors
  }

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- URL locking state ---
  // While a given track is current, we "lock" the URL used to start it.
  // Lock resets whenever we switch to a different track id.
  const lockedSrcRef = useRef<{ trackId: string | null; url: string | null }>({ trackId: null, url: null });

  useEffect(() => {
    const audio = audioRef.current!;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onProgress = () => setIsLoading(!audio.readyState || audio.readyState < 3);
    const onLoadedMetadata = () => setIsMetadataLoaded(true);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      const err = audio.error;
      const msg = err ? `${err.code}: ${err.message || "Audio error"}` : "Unknown audio error";
      setError(msg);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current!;
    try { audio.pause(); } catch {}
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current!;
    try {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } catch {}
  }, []);

  const seek = useCallback((timeSeconds: number) => {
    const audio = audioRef.current!;
    const t = Math.max(0, Math.min(timeSeconds, Number.isFinite(audio.duration) ? audio.duration : timeSeconds));
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current!;
    const r = Math.max(0.5, Math.min(4, rate));
    audio.playbackRate = r;
  }, []);

  /**
   * SINGLE ENTRY POINT:
   * - If same track id:
   *    - If playing: pause (toggle off)
   *    - If paused: resume (toggle on)
   *    - Ignore any URL changes while this track remains current (URL locked)
   * - If different track id:
   *    - Switch source to the *incoming* track's URL
   *    - Reset the URL lock to this new track+url
   */
  const play = useCallback(async (track: Track) => {
    const audio = audioRef.current!;
    setError(null);

    console.log('play', audio.src);
    const isSameTrack = currentTrack?.id === track.id;
    const lock = lockedSrcRef.current;

    // Switching to a different track id => reset lock and set new src from incoming url
    if (!isSameTrack) {
      // New track: set src to track.url and lock it
      setIsLoading(true);
      try { audio.pause(); } catch {}
      audio.src = track.url;
      lockedSrcRef.current = { trackId: track.id, url: track.url }; // lock to this url for this track session
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(0);
      try {
        await audio.play();
      } catch (e: any) {
        setIsLoading(false);
        setError(e?.message || "Failed to play audio");
        throw e;
      }
      return;
    }

    // Same track id currently selected
    // Ensure URL is locked: if someone passed a different URL, we IGNORE it until we switch away.
    if (lock.trackId === track.id) {
      // If playing -> pause (toggle)
      if (!audio.paused) {
        audio.pause();
        return;
      }
      // If paused -> resume using locked src
      try {
        // Make sure src is the locked one (defensive)
        if (lock.url && audio.src !== lock.url) {
          audio.src = lock.url;
        }
        await audio.play();
      } catch (e: any) {
        setIsLoading(false);
        setError(e?.message || "Failed to play audio");
        throw e;
      }
      return;
    }

    // Defensive: if for some reason we had no lock for same id (shouldn't happen), set and play
    setIsLoading(true);
    try { audio.pause(); } catch {}
    audio.src = track.url;
    lockedSrcRef.current = { trackId: track.id, url: track.url };
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    try {
      await audio.play();
    } catch (e: any) {
      setIsLoading(false);
      setError(e?.message || "Failed to play audio");
      throw e;
    }
  }, [currentTrack]);

  // When we truly leave the current track (switch to another), the lock is naturally replaced in the code above.
  // If you ever need to force-unlock (e.g., global stop), you could do:
  // lockedSrcRef.current = { trackId: null, url: null };

  const state = useMemo<AudioState>(() => ({
    currentTrack,
    isPlaying,
    isLoading,
    isMetadataLoaded,
    currentTime,
    duration,
    error,
  }), [currentTrack, isPlaying, isLoading, isMetadataLoaded, currentTime, duration, error]);

  const controls = useMemo<AudioControls>(() => ({
    play, // <- single entry point
    pause,
    stop,
    seek,
    setPlaybackRate,
  }), [play, pause, stop, seek, setPlaybackRate]);

  return (
    <AudioContext.Provider value={{ state, controls }}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Usage:
 * const { controls } = useAudio();
 * controls.play(trackA); // plays A (locks A's URL)
 * controls.play(trackA); // toggles pause/resume, ignores new URL changes for A
 * controls.play(trackB); // switches to B (locks B's URL)
 * controls.play(trackAUpdatedUrl); // coming back to A uses the *new* URL, because we switched away
 */
