// Shows the cloned audio player + evaluation results (cosine similarity & WER).

export default function AudioPlayer({ audioUrl, metrics, isEvaluating, language, t }) {
  if (!audioUrl) return null;

  async function handleDownload(url) {
  try {
    const response = await fetch(url);
    const blob     = await response.blob();
    const blobUrl  = URL.createObjectURL(blob);

    // auto download
    const link     = document.createElement("a");
    link.href      = blobUrl;
    link.download  = "cloned_voice.wav";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
}


  return (
    <div className="player-card" style={{ animation: "fadeUp 0.4s ease" }}>

      {/* header */}
      <div className="player-header">
        <WaveIcon />
        <span className="player-title">{t.resultTitle}</span>
        <span className="lang-badge">{language === "ar" ? "عربي" : "English"}</span>
      </div>

      {/* audio element */}
      <audio
        src={audioUrl}
        controls
        autoPlay
        style={{ width: "100%", marginTop: "0.75rem" }}
      />

      {/* download button */}
      <button
        onClick={() => handleDownload(audioUrl)}
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          "0.4rem",
          marginTop:    "0.6rem",
          padding:      "0.45rem 1rem",
          border:       "1.5px solid var(--border)",
          borderRadius: "99px",
          fontSize:     "0.8rem",
          fontWeight:   "500",
          color:        "var(--text-secondary)",
          background:   "transparent",
          cursor:       "pointer",
          transition:   "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        <DownloadIcon /> {t.download}
      </button>

      {/* loading metrics */}
      {isEvaluating && (
        <div className="metrics-loading">
          <Spinner />
          <span>{t.evaluating}</span>
        </div>
      )}

      {/* metric results */}
      {metrics && !isEvaluating && (
        <>
          <div className="metrics-grid">
            <MetricBox
              label={t.speakerMatch}
              value={
                metrics.cosine_similarity !== null
                  ? `${(metrics.cosine_similarity * 100).toFixed(1)}%`
                  : "—"
              }
              sub={metrics.quality_label}
              good={metrics.cosine_similarity >= 0.70}
            />
            <MetricBox
              label={t.wordErrorRate}
              value={
                metrics.word_error_rate !== null
                  ? `${(metrics.word_error_rate * 100).toFixed(1)}%`
                  : "—"
              }
              sub={metrics.word_error_rate <= 0.10 ? t.good : t.checkText}
              good={metrics.word_error_rate !== null && metrics.word_error_rate <= 0.10}
            />
          </div>

          {/* whisper transcription */}
          {metrics.transcription && (
            <div className="transcription" dir={language === "ar" ? "rtl" : "ltr"}>
              <p className="transcription__label">{t.whisperHeard}</p>
              <p className="transcription__text">"{metrics.transcription}"</p>
            </div>
          )}

          {metrics.error && (
            <p className="txt-error" style={{ marginTop: "0.75rem" }}>{metrics.error}</p>
          )}
        </>
      )}
    </div>
  );
}

function MetricBox({ label, value, sub, good }) {
  return (
    <div className={`metric-box ${good ? "metric-box--good" : ""}`}>
      <span className="metric-val">{value}</span>
      <span className="metric-label">{label}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  );
}

function WaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );

}

  function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}