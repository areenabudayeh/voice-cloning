import { useState, useRef, useCallback, useEffect } from "react";

export const MAX_SECONDS = 60;

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob,   setAudioBlob]   = useState(null);
  const [duration,    setDuration]    = useState(0);
  const [error,       setError]       = useState(null);

  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const streamRef   = useRef(null);

  // clean up mic and timers when component unmounts
  useEffect(() => () => cleanup(), []);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        setIsRecording(false);
      };

      recorder.start(100); 
      setIsRecording(true);

      // tick the timer every second, auto-stop at limit
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_SECONDS) {
            stop();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow it in your browser settings.");
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
    }
    cleanup();
  }, [isRecording]);

  const reset = useCallback(() => {
    cleanup();
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setIsRecording(false);
  }, []);

  function cleanup() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  return { isRecording, audioBlob, duration, error, start, stop, reset };
}
