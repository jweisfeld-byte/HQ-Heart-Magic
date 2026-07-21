"use client";

import { useEffect, useRef, useState } from "react";

export type ReferenceRow = { label: string; url: string; driveFileId?: string };

/**
 * Minimal shape of the bits of Google's Identity Services + Picker APIs
 * this component calls. Not typed by Google, so these are hand-written
 * rather than `any` scattered through the file.
 */
type GoogleTokenClient = { requestAccessToken: () => void };
type GoogleIdentity = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; error?: string }) => void;
      }) => GoogleTokenClient;
    };
  };
};
type PickerDoc = { id: string; name: string; url: string };
type PickerData = {
  action: string;
  docs?: PickerDoc[];
};
type PickerBuilderInstance = {
  addView: (view: unknown) => PickerBuilderInstance;
  setOAuthToken: (token: string) => PickerBuilderInstance;
  setDeveloperKey: (key: string) => PickerBuilderInstance;
  setCallback: (cb: (data: PickerData) => void) => PickerBuilderInstance;
  build: () => { setVisible: (visible: boolean) => void };
};
type GapiPicker = {
  picker: {
    PickerBuilder: new () => PickerBuilderInstance;
    ViewId: { DOCS: unknown };
    Action: { PICKED: string };
  };
};
type Gapi = {
  load: (api: string, callback: () => void) => void;
} & { picker?: GapiPicker["picker"] };

declare global {
  interface Window {
    google?: GoogleIdentity;
    gapi?: Gapi;
  }
}

const LOG_PREFIX = "[DrivePicker]";

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${label} (${ms}ms).`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

// Loads both Google scripts + the Picker module once, up front (on
// mount), rather than on click. This matters: browsers only let a
// popup open as a direct result of a user gesture (a click). If we
// `await` network requests for these scripts *inside* the click
// handler first, by the time `requestAccessToken()` finally runs, the
// browser no longer considers it part of the original click — and it
// silently blocks the sign-in popup (no error, no popup, just a
// permanently "Opening Drive…" button). Preloading here means the
// click handler can call `requestAccessToken()` immediately.
//
// Every step logs to the console (prefixed "[DrivePicker]") — this
// flow crosses three different Google scripts loaded async, and past
// failures here have been completely silent (no popup, no error, no
// console output), so logging is the only way to tell which step
// actually failed.
let googleReadyPromise: Promise<void> | null = null;
function ensureGoogleLoaded(): Promise<void> {
  if (!googleReadyPromise) {
    googleReadyPromise = (async () => {
      console.log(`${LOG_PREFIX} loading accounts.google.com/gsi/client...`);
      await loadScriptOnce("https://accounts.google.com/gsi/client");
      console.log(`${LOG_PREFIX} loading apis.google.com/js/api.js...`);
      await loadScriptOnce("https://apis.google.com/js/api.js");
      const gapi = window.gapi;
      if (!gapi) throw new Error("Google API script loaded but window.gapi is missing.");
      console.log(`${LOG_PREFIX} loading picker module via gapi.load...`);
      await withTimeout(
        new Promise<void>((resolve) => gapi.load("picker", resolve)),
        10000,
        "gapi.load('picker')",
      );
      console.log(
        `${LOG_PREFIX} ready. window.gapi.picker =`,
        !!window.gapi?.picker,
      );
    })();
  }
  return googleReadyPromise;
}

function buildAndShowPicker(
  accessToken: string,
  apiKey: string,
  onResult: (doc: PickerDoc | null, error?: string) => void,
) {
  const picker = window.gapi?.picker;
  if (!picker) {
    onResult(null, "Google Picker module never finished loading (window.gapi.picker missing).");
    return;
  }
  try {
    console.log(`${LOG_PREFIX} building picker with token + api key present`);
    const builder = new picker.PickerBuilder()
      .addView(picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((data: PickerData) => {
        console.log(`${LOG_PREFIX} picker callback fired, action:`, data.action);
        if (data.action === picker.Action.PICKED && data.docs?.[0]) {
          onResult(data.docs[0]);
        } else if (data.action === "cancel") {
          onResult(null);
        }
        // Ignore "loaded" and other transient picker lifecycle events.
      })
      .build();
    builder.setVisible(true);
    console.log(`${LOG_PREFIX} picker.setVisible(true) called`);
  } catch (err) {
    console.error(`${LOG_PREFIX} PickerBuilder threw:`, err);
    onResult(
      null,
      `Google Picker failed to open: ${err instanceof Error ? err.message : String(err)}. This usually means the "Google Picker API" itself hasn't been enabled in Google Cloud Console (separate from the OAuth client and API key) — check APIs & Services → Enabled APIs.`,
    );
  }
}

// Repeatable label+url rows, rendered as plain named inputs inside the
// surrounding <form>. No client-side submit logic here — the browser's
// native form submission carries every "referenceLabel"/"referenceUrl"/
// "referenceDriveFileId" input through as parallel arrays, read on the
// server with formData.getAll(). This is the Reference model (Knowledge
// Graph v1 Section 4) — one entry, many linked docs (Drive, articles,
// etc.). "Pick from Google Drive" uses Google's own Picker widget
// (Technical Architecture v1 Section 6 — a linked reference, never a
// copied file) to fill a row in automatically instead of pasting a URL
// by hand.
export function ReferencesEditor({ initial }: { initial: ReferenceRow[] }) {
  const [rows, setRows] = useState<ReferenceRow[]>(
    initial.length > 0 ? initial : [{ label: "", url: "" }],
  );
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const resultHandlerRef = useRef<
    ((doc: PickerDoc | null, error?: string) => void) | null
  >(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;

  function initTokenClient() {
    const google = window.google;
    if (!google || !clientId || !apiKey) return null;
    return google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      // drive.file: only files the user explicitly picks or that this
      // app creates — least-privilege, per Technical Architecture v1
      // Section 6, not blanket read access to the whole Drive.
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp) => {
        console.log(
          `${LOG_PREFIX} token callback fired. error=`,
          resp.error,
          "has token=",
          !!resp.access_token,
        );
        const handler = resultHandlerRef.current;
        if (!handler) return;

        if (resp.error || !resp.access_token) {
          handler(null, resp.error ?? "Google sign-in was cancelled.");
          return;
        }

        buildAndShowPicker(resp.access_token, apiKey, handler);
      },
    });
  }

  // Kick off preloading as soon as the form renders, well before
  // anyone clicks — and initialize the token client exactly once, per
  // Google's own guidance for Identity Services (init once, call
  // requestAccessToken() per click).
  useEffect(() => {
    if (!clientId || !apiKey) return;
    ensureGoogleLoaded()
      .then(() => {
        tokenClientRef.current = initTokenClient();
        console.log(
          `${LOG_PREFIX} token client initialized:`,
          !!tokenClientRef.current,
        );
      })
      .catch((err) => {
        console.error(`${LOG_PREFIX} preload failed:`, err);
        // Swallowed otherwise — handlePickFromDrive surfaces a fresh
        // error if the user actually clicks before/without this ever
        // succeeding.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, apiKey]);

  function update(index: number, field: "label" | "url", value: string) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value, driveFileId: undefined } : row,
      ),
    );
  }

  function addRow(row: ReferenceRow = { label: "", url: "" }) {
    setRows((prev) => {
      const withoutBlank = prev.filter((r) => r.label || r.url);
      return [...withoutBlank, row];
    });
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  function handlePickFromDrive() {
    setPickerError(null);
    console.log(`${LOG_PREFIX} button clicked`);

    if (!clientId || !apiKey) {
      const missing = [
        !clientId && "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
        !apiKey && "NEXT_PUBLIC_GOOGLE_PICKER_API_KEY",
      ].filter(Boolean);
      setPickerError(`Google Drive isn't connected yet — missing: ${missing.join(", ")}.`);
      return;
    }

    resultHandlerRef.current = (doc, error) => {
      setPicking(false);
      if (error) {
        console.error(`${LOG_PREFIX} result error:`, error);
        setPickerError(error);
        return;
      }
      if (doc) {
        console.log(`${LOG_PREFIX} file picked:`, doc.name);
        addRow({ label: doc.name, url: doc.url, driveFileId: doc.id });
      } else {
        console.log(`${LOG_PREFIX} picker cancelled, no file chosen`);
      }
    };

    if (tokenClientRef.current) {
      // Fast path: scripts + token client were already ready from the
      // mount-time preload, so this call happens synchronously inside
      // the click handler — the browser still sees it as a direct
      // result of the click, so the popup opens normally.
      console.log(`${LOG_PREFIX} fast path: requesting access token`);
      setPicking(true);
      tokenClientRef.current.requestAccessToken();
      return;
    }

    // Slow path: the page was clicked faster than the preload could
    // finish (rare), or preload failed earlier. Retry loading now and
    // surface whatever error actually occurs instead of hanging.
    console.log(`${LOG_PREFIX} slow path: (re)loading Google scripts`);
    setPicking(true);
    ensureGoogleLoaded()
      .then(() => {
        if (!tokenClientRef.current) {
          tokenClientRef.current = initTokenClient();
        }
        if (!tokenClientRef.current) {
          throw new Error("Could not initialize Google sign-in.");
        }
        setPicking(false);
        setPickerError(
          "Drive just finished loading — click “Pick from Google Drive” once more.",
        );
      })
      .catch((err) => {
        console.error(`${LOG_PREFIX} slow path failed:`, err);
        setPicking(false);
        setPickerError(
          err instanceof Error ? err.message : "Couldn't load Google Drive.",
        );
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Linked documents (optional)
        </label>
        <button
          type="button"
          onClick={handlePickFromDrive}
          disabled={picking}
          className="text-sm text-accent hover:underline disabled:opacity-50"
        >
          {picking ? "Opening Drive…" : "📎 Pick from Google Drive"}
        </button>
      </div>
      {pickerError && <p className="mt-1 text-xs text-red-600">{pickerError}</p>}

      <div className="mt-1 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              name="referenceLabel"
              value={row.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label, e.g. Ingredient Spec Sheet"
              className="w-2/5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <input
              name="referenceUrl"
              type="url"
              value={row.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="https://drive.google.com/..."
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <input
              type="hidden"
              name="referenceDriveFileId"
              value={row.driveFileId ?? ""}
            />
            {row.driveFileId && (
              <span className="text-xs text-muted" title="Linked via Google Drive">
                📄
              </span>
            )}
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-lg border border-border px-3 text-sm text-muted hover:bg-accent/5"
              aria-label="Remove document"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addRow()}
        className="mt-2 text-sm text-accent hover:underline"
      >
        + Add another document
      </button>
    </div>
  );
}
