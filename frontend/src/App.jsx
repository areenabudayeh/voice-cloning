import { useState } from "react";
import FileUploader  from "./components/FileUploader.jsx";
import AudioRecorder from "./components/AudioRecorder.jsx";
import AudioPlayer   from "./components/AudioPlayer.jsx";
import { cloneVoice, getAudioUrl, evaluateClone } from "./api/client.js";
import "./App.css"; 

const TRANSLATIONS = {
  en: {
    siteTitle:          "Voice Cloning",
    siteSubtitle:       "Turn text into any voice you want",
    referenceVoice:     "Reference Voice",
    referenceHint:      "Upload or record the voice you want to clone.",
    uploadTab:          "Upload Audio",
    recordTab:          "Record Audio",
    textLabel:          "Text to Synthesise",
    textPlaceholder:    "Type what you want to say in the cloned voice…",
    charCount:          (n) => `${n} / 2000`,
    cloneBtn:           "Clone Voice",
    cloningBtn:         "Cloning…",
    uploadPrompt:       "Click or drag an audio file here",
    dropHere:           "Drop your audio file here",
    uploading:          "Uploading",
    ready:              "ready",
    change:             "Change",
    unsupportedFormat:  "Unsupported format. Allowed",
    recordPrompt:       "Click the button below to record your voice",
    recordHint:         "Up to 30 seconds · speak clearly for best results",
    recording:          "Recording… speak now",
    startRecording:     "Start Recording",
    stopRecording:      "Stop",
    recordingUploaded:  "Recording uploaded",
    reRecord:           "Re-record",
    resultTitle:        "Cloned Voice",
    evaluating:         "Running evaluation…",
    speakerMatch:       "Voice Similarity",
    wordErrorRate:      "Word Error Rate",
    good:               "Good",
    checkText:          "Check text",
    whisperHeard:       "Text extracted from audio",
    errorEmpty:         "Please provide a reference voice and enter some text.",
    download:           "Download audio",
    speechLanguage:     "Speech Language",
    english:            "English",
    arabic:             "Arabic",


  },
  ar: {
    siteTitle:          "Voice Cloning",
    siteSubtitle:       "حوّل النص إلى أي صوت تريده",
    referenceVoice:     "الصوت المرجعي",
    referenceHint:      "ارفع أو سجّل الصوت الذي تريد استخدامه",
    uploadTab:          "رفع ملف صوتي",
    recordTab:          "تسجيل الصوت",
    textLabel:          "النص الذي سيتم تحويله إلى صوت",
    textPlaceholder:    "اكتب ما تريد قوله بالصوت المستنسخ…",
    charCount:          (n) => `${n} / 2000`,
    cloneBtn:           "استنسخ الصوت",
    cloningBtn:         "جارٍ الاستنساخ…",
    uploadPrompt:       "اضغط هنا أو اسحب ملفاً صوتياً",
    dropHere:           "أفلت الملف هنا",
    uploading:          "جارٍ الرفع",
    ready:              "جاهز",
    change:             "تغيير",
    unsupportedFormat:  "صيغة غير مدعومة. المسموح به",
    recordPrompt:       "اضغط على الزر أدناه لتسجيل صوتك",
    recordHint:         "حتى 30 ثانية · تكلّم بوضوح للحصول على أفضل النتائج",
    recording:          "جارٍ التسجيل… تكلّم الآن",
    startRecording:     "بدء التسجيل",
    stopRecording:      "إيقاف",
    recordingUploaded:  "تم رفع التسجيل",
    reRecord:           "إعادة التسجيل",
    resultTitle:        "الصوت المستنسخ",
    evaluating:         "جارٍ التقييم…",
    speakerMatch:       "تشابه الصوت",
    wordErrorRate:      "معدل خطأ الكلمات",
    good:               "جيد",
    whisperHeard:       "النص المُستخرج من الصوت",
    errorEmpty:         "يرجى توفير صوت مرجعي وكتابة نص.",
    download:           "تحميل الصوت",
    speechLanguage:     " لغة الصوت",
    english:            "الإنجليزية",
    arabic:             "العربية",
  },
};

export default function App() {

  const [uiLang,    setUiLang]    = useState("en");  
  const [modelLang, setModelLang] = useState("en");  

  const [tab,      setTab]      = useState("upload");
  const [fileId,   setFileId]   = useState(null);
  const [text,     setText]     = useState("");

  const [status,    setStatus]    = useState("idle"); 
  const [cloneErr,  setCloneErr]  = useState(null);
  const [audioUrl,  setAudioUrl]  = useState(null);
  const [cloneId,   setCloneId]   = useState(null);

  const [metrics,      setMetrics]      = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const t     = TRANSLATIONS[uiLang];
  const isRtl = uiLang === "ar";
  const isCloning = status === "cloning";


  function handleUploaded(id) {
    setFileId(id);
    setAudioUrl(null);
    setCloneId(null);
    setMetrics(null);
    setStatus("idle");
  }

  async function handleClone() {
    if (!fileId || !text.trim()) {
      setCloneErr(t.errorEmpty);
      return;
    }

    setStatus("cloning");
    setCloneErr(null);
    setAudioUrl(null);
    setMetrics(null);

    try {
      const result = await cloneVoice(text.trim(), modelLang, [fileId]);
      setCloneId(result.clone_id);
      setAudioUrl(getAudioUrl(result.clone_id));
      setStatus("done");
      runEval(result.clone_id);
    } catch (err) {
      setCloneErr(err.message);
      setStatus("error");
    }
  }

  async function runEval(id) {
    setIsEvaluating(true);
    try {
      const result = await evaluateClone(id, [fileId], text.trim(), modelLang);
      setMetrics(result);
    } catch {
    } finally {
      setIsEvaluating(false);
    }
  }

  const canClone = !!fileId && text.trim().length > 0 && !isCloning;

  return (
    <>
      <div className="page" dir={isRtl ? "rtl" : "ltr"}>

        {/* top bar */}
        <header className="topbar">
          <div className="logo">
            <LogoIcon />
            <span className="logo-name">{t.siteTitle}</span>
          </div>

          {/* language toggle */}
        <div className="lang-pill">
          {["en", "ar"].map((l) => (
            <button
              key={l}
              className={`lang-opt ${uiLang === l ? "lang-opt--on" : ""}`}
              onClick={() => setUiLang(l)}
              disabled={isCloning}
            >
              {l === "en" ? "EN" : "عر"}
            </button>
          ))}
        </div>
        </header>

        {/* hero text */}
        <div className="hero">
          <h1 className="hero-title">{t.siteTitle}</h1>
          <p className="hero-sub">{t.siteSubtitle}</p>
        </div>

        {/* two-column layout */}
        <div className="columns">

          {/* LEFT — input card */}
          <div className="card">

            {/* reference voice */}
            <section className="section">
              <h2 className="section-label">{t.referenceVoice}</h2>
              <p className="section-hint">{t.referenceHint}</p>

              <div className="tab-bar">
                <button
                  className={`tab-btn ${tab === "upload" ? "tab-btn--on" : ""}`}
                  onClick={() => setTab("upload")}
                  disabled={isCloning}
                >
                  <UploadIcon /> {t.uploadTab}
                </button>
                <button
                  className={`tab-btn ${tab === "record" ? "tab-btn--on" : ""}`}
                  onClick={() => setTab("record")}
                  disabled={isCloning}
                >
                  <MicIcon /> {t.recordTab}
                </button>
              </div>

              {tab === "upload"
                ? <FileUploader  onUploaded={handleUploaded} disabled={isCloning} t={t} />
                : <AudioRecorder onUploaded={handleUploaded} disabled={isCloning} t={t} />
              }
            </section>

            {/* model language selector  */}
            <section className="section">
              <h2 className="section-label">{t.speechLanguage}</h2>
              <div className="tab-bar">
                <button
                  className={`tab-btn ${modelLang === "en" ? "tab-btn--on" : ""}`}
                  onClick={() => setModelLang("en")}
                  disabled={isCloning}
                >
                  🇬🇧 {t.english}
                </button>
                <button
                  className={`tab-btn ${modelLang === "ar" ? "tab-btn--on" : ""}`}
                  onClick={() => setModelLang("ar")}
                  disabled={isCloning}
                >
                  🇸🇦 {t.arabic}
                </button>
              </div>
            </section>

            {/* text input */}
            <section className="section">
              <h2 className="section-label">{t.textLabel}</h2>
              <textarea
                className="txt-area"
                placeholder={t.textPlaceholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={2000}
                disabled={isCloning}
                dir={isRtl ? "rtl" : "ltr"}
              />
              <p className="char-count">{t.charCount(text.length)}</p>
            </section>

            {/* clone button */}
            <button
              className={`clone-btn ${isCloning ? "clone-btn--loading" : ""}`}
              onClick={handleClone}
              disabled={!canClone}
            >
              {isCloning
                ? <><Spinner /> {t.cloningBtn}</>
                : <><WaveIcon /> {t.cloneBtn}</>
              }
            </button>

            {cloneErr && (
              <p className="txt-error" style={{ textAlign: "center" }}>{cloneErr}</p>
            )}
          </div>

          {/* RIGHT — output card */}
          <div className="output-col">
            {audioUrl ? (
              <AudioPlayer
                audioUrl={audioUrl}
                metrics={metrics}
                isEvaluating={isEvaluating}
                language={modelLang}  
                t={t}
              />
            ) : (
              <div className="output-empty">
                <WaveIconLarge />
                <p>{isRtl ? "النتيجة ستظهر هنا" : "Your result will appear here"}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

//icons 

function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="var(--accent)"/>
      <path d="M8 14c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"
        stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="2.5" fill="white"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2"/>
    </svg>
  );
}

function WaveIconLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

