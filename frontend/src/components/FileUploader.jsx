import { useState, useRef, useCallback } from "react";
import { uploadAudio } from "../api/client.js";

const ALLOWED = [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"];


export default function FileUploader({ onUploaded, disabled, t }) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress,   setProgress]   = useState(null);   
  const [uploaded,   setUploaded]   = useState(null);   
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error,      setError]      = useState(null);
  const inputRef = useRef(null);


  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`${t.unsupportedFormat}: ${ALLOWED.join(", ")}`);
      return;
    }

    setError(null);
    setProgress(0);
    setUploaded(null);

    try {
      const result = await uploadAudio(file, setProgress);
      setUploaded({ name: file.name, duration: result.duration_seconds });
      setPreviewUrl(URL.createObjectURL(file));
      onUploaded(result.file_id, file.name, result.duration_seconds);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  }, [onUploaded, t]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFile(e.dataTransfer.files[0]);
  };

  const isUploading = progress !== null;

  return (
    <div
      className={[
        "uploader",
        isDragging ? "uploader--drag" : "",
        disabled   ? "uploader--off"  : "",
      ].join(" ")}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && !isUploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
      />

      {/* idle state */}
      {!isUploading && !uploaded && (
        <>
          <UploadIcon />
          <p className="uploader__label">
            {isDragging ? t.dropHere : t.uploadPrompt}
          </p>
          <p className="uploader__hint">WAV · MP3 · OGG · FLAC · M4A — max 25 MB</p>
        </>
      )}

      {/* uploading */}
      {isUploading && (
        <>
          <p className="uploader__label">{t.uploading} {progress}%</p>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
        </>
      )}


        {/* success */}
      {uploaded && !isUploading && (
        <>
          <div className="uploader__done">
            <CheckIcon />
            <div>
              <p className="uploader__label">{uploaded.name}</p>
              <p className="uploader__hint">{uploaded.duration.toFixed(1)}s · {t.ready}</p>
            </div>
            <button
              className="btn-ghost"
              onClick={(e) => { e.stopPropagation(); setUploaded(null); setPreviewUrl(null); }}
              disabled={disabled}
            >
              {t.change}
            </button>
          </div>

          {previewUrl && (
            <audio
              src={previewUrl}
              controls
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          )}
        </>
      )}

      {error && <p className="txt-error">{error}</p>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-hint)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
