import { useState, useEffect } from "react";
import { uploadAudio } from "../api/client.js";
import { useAudioRecorder, MAX_SECONDS } from "../hooks/useAudioRecorder.js";

// Record a voice sample from the mic and auto-upload it.


export default function AudioRecorder({ onUploaded, disabled, t }) {
  const { isRecording, audioBlob, duration, error, start, stop, reset } = useAudioRecorder();

  const [uploadState, setUploadState] = useState("idle"); 
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);

  useEffect(() => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    doUpload(audioBlob);

    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  async function doUpload(blob) {
    setUploadState("uploading");
    setUploadError(null);

    const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });

    try {
      const result = await uploadAudio(file);
      setUploadState("done");
      onUploaded(result.file_id, file.name, result.duration_seconds);
    } catch (err) {
      setUploadState("error");
      setUploadError(err.message);
    }
  }

  function handleReset() {
    reset();
    setUploadState("idle");
    setUploadError(null);
    setPreviewUrl(null);
  }

  const anyError = error || uploadError;

  return (
    <div className={`recorder ${disabled ? "recorder--off" : ""}`}>

      {/* idle - show prompt */}
      {uploadState === "idle" && !isRecording && (
        <>
          <MicIcon />
          <p className="uploader__label">{t.recordPrompt}</p>
          <p className="uploader__hint">{t.recordHint}</p>
        </>
      )}

      {/* recording — live timer */}
      {isRecording && (
        <>
          <div className="rec-dot" />
          <span className="rec-timer">{fmt(duration)}</span>
          <p className="uploader__hint">
            {t.recording} · {MAX_SECONDS - duration}s remaining
          </p>
        </>
      )}

      {/* uploading the recording */}
      {uploadState === "uploading" && (
        <>
          <Spinner />
          <p className="uploader__label">{t.uploading}…</p>
        </>
      )}

      {/* done — show preview + re-record button */}
      {uploadState === "done" && previewUrl && (
        <div className="recorder__done">
          <div className="recorder__done-top">
            <CheckIcon />
            <p className="uploader__label">{t.recordingUploaded}</p>
            <button className="btn-ghost" onClick={handleReset} disabled={disabled}>
              {t.reRecord}
            </button>
          </div>
          <audio src={previewUrl} controls style={{ width: "100%", marginTop: "0.5rem" }} />
        </div>
      )}

      {anyError && <p className="txt-error">{anyError}</p>}

      {/* record / stop button */}
      {uploadState === "idle" && (
        <button
          className={`rec-btn ${isRecording ? "rec-btn--stop" : ""}`}
          onClick={isRecording ? stop : start}
          disabled={disabled}
        >
          {isRecording ? <StopIcon /> : <MicIcon size={16} />}
          {isRecording ? t.stopRecording : t.startRecording}
        </button>
      )}
    </div>
  );
}

// helpers 

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function MicIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="var(--text-hint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8"  y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
