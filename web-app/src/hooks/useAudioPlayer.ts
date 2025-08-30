import { useCallback, useContext } from "react";
import { AudioContext } from "../context/AudioContext";
import useResolvedAudioUrl from "./useResolvedAudioUrl";

export type UseAudioPlayerParams = {
  songId: string;
  urls: {
    streamAudioUrl?: string;
    audioUrl?: string;
    storageUrl?: string;
  }
  resolveUrlFn?: (url: string) => Promise<string>;
};

export default function useAudioPlayer(params: UseAudioPlayerParams) {
  const { songId, urls, resolveUrlFn } = params;

  const { state, controls } = useContext(AudioContext);
  const {url, error: resolveUrlError, isResolvingUrl} = useResolvedAudioUrl(params);

  const isActive = state.currentTrack?.id === songId; // is this the track currently loaded in the global player?
  const isPlaying = isActive && state.isPlaying;
  const isLoading = isActive && state.isLoading && state.isMetadataLoaded;

  const duration = isActive ? state.duration : 0;
  const currentTime = isActive ? state.currentTime : 0;

  const play = useCallback(async () => {
    if (!url) return;
    await controls.play({ id: songId, url });
  }, [controls, songId, url]);

  const pause = useCallback(() => {
    controls.pause();
  }, [controls]);

  const seek = useCallback(
    async (value: number) => {
      if (!isActive) {
        await play();
      }
      controls.seek(value);
    },
    [controls, isActive, play]
  );

  return {
    // Audio controller actions
    play,
    pause,
    seek,
    // Audio controller state
    audioError: state.error,
    isActive,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    // Audio URL state
    url,
    resolveUrlError,
    isResolvingUrl,
  };
  
}