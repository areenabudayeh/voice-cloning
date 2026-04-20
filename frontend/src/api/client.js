const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";


export function uploadAudio(file, onProgress = null) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      const body = tryJson(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        reject(new Error(body?.detail || `Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload."))
    );

    xhr.open("POST", `${BASE}/upload`);
    xhr.send(form);
  });
}


export async function cloneVoice(text, language, fileIds) {
  const res = await fetch(`${BASE}/clone`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text, language, file_ids: fileIds }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.detail || `Clone failed (${res.status})`);
  return body;
}


export function getAudioUrl(cloneId) {
  return `${BASE}/audio/${cloneId}`;
}


export async function evaluateClone(cloneId, fileIds, targetText, language = "en") {
  const res = await fetch(`${BASE}/evaluate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      language:     language,
      clone_id:     cloneId,
      ref_file_ids: fileIds,
      target_text:  targetText,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.detail || `Evaluate failed (${res.status})`);
  return body;
}

function tryJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
