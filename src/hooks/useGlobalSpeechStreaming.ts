import { useEffect, useState, useCallback } from "react";
import { globalSpeechService } from "@/services/ai/globalSpeechService";

export function useGlobalSpeechStreaming() {
  const [isStreaming, setIsStreaming] = useState<boolean>(() =>
    globalSpeechService.getIsStreaming(),
  );

  useEffect(() => {
    return globalSpeechService.subscribe((streaming) => {
      setIsStreaming(streaming);
    });
  }, []);

  const toggle = useCallback(async () => {
    return await globalSpeechService.toggle();
  }, []);

  const start = useCallback(async () => {
    return await globalSpeechService.start();
  }, []);

  const stop = useCallback(async () => {
    await globalSpeechService.stop();
  }, []);

  return {
    isStreaming,
    toggle,
    start,
    stop,
  };
}
