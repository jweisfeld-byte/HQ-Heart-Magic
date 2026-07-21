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

// Loads both Google scripts + the Picker module once, up front (on
// mount), rather than on click. This matters: browsers only let a
// popup open as a direct result of a user gesture (a click). If we
// `await` network requests for these scripts *inside* the click
// handler first, by the time `requestAccessToken()` finally runs, the
// browser no longer considers it part of the original click — and it
// silently blocks the sign-in popup (no error, no popup, just a
// permanently "Opening Drive…" button). Preloading here means the
// click handler can call `requestAccessToken()` immediately.
let googleReadyPromise: Promise<void> | null = null;
function ensureGoogleLoaded(): Promise<void> {
  if (!googleReadyPromise) {
    googleReadyPromise = (async () => {
      await loadScriptOnce("https://accounts.google.com/gsi/client");
      await loadScriptOnce("https://apis.google.com/js/api.js");
      const gapi = window.gapi;
      if (!gapi) throw new Error("Google API script failed to load.");
      await new Promise<void>((resolve) => gapi.load("picker", resolve));
    })();
  }
  return googleReadyPromise;
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

  // Kick off preloading as soon as the form renders, well before
  // anyone clicks — and initialize the token client exactly once, per
  // Google's own guidance for Identity Services (init once, call
  // requestAccessToken() per click).
  useEffect(() => {
    if (!clientId || !apiKey) return;
    ensureGoogleLoaded()
      .then(() => {
        const google = window.google;
        if (!google) return;
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          // drive.file: only files the user explicitly picks or that
          // this app creates — least-privilege, per Technical
          // Architecture v1 Section 6, not blanket read access to the
          // whole Drive.
          scope: "https://www.googleapis.com/auth/drive.file",
          callback: (resp) => {
            const handler = resultHandlerRef.current;
            if (!handler) return;

            if (resp.error || !resp.access_token) {
              handler(null, resp.error ?? "Google sign-in was cancelled.");
              return;
            }

            const picker = window.gapi?.picker;
            if (!picker) {
              handler(null, "Google Picker failed to load.");
              return;
            }

            new picker.PickerBuilder()
              .addView(picker.ViewId.DOCS)
              .setOAuthToken(resp.access_token as string)
              .setDeveloperKey(apiKey)
              .setCallback((data: PickerData) => {
                if (data.action === picker.Action.PICKED && data.docs?.[0]) {
                  handler(data.docs[0]);
                } else if (data.action === "cancel") {
                  handler(null);
                }
                // Ignore "loaded" and other transient picker lifecycle events.
              })
              .build()
              .setVisible(true);
          },
        });
      })
      .catch(() => {
        // Swallowed — handlePickFromDrive surfaces a fresh error if the
        // user actually clicks before/without this ever succeeding.
      });
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
        setPickerError(error);
        return;
      }
      if (doc) {
        addRow({ label: doc.name, url: doc.url, driveFileId: doc.id });
      }
    };

    if (tokenClientRef.current) {
      // Fast path: scripts + token client were already ready from the
      // mount-time preload, so this call happens synchronously inside
      // the click handler — the browser still sees it as a direct
      // result of the click, so the popup opens normally.
      setPicking(true);
      tokenClientRef.current.requestAccessToken();
      return;
    }

    // Slow path: the page was clicked on faster than the preload could
    // finish (rare). We still try, but a popup blocked here won't
    // surface as an error — if this happens, asking the user to click
    // once more (now that loading has caught up) resolves it.
    setPicking(true);
    ensureGoogleLoaded()
      .then(() => {
        const google = window.google;
        if (!google) throw new Error("Google Identity Services failed to load.");
        if (!tokenClientRef.current) {
          tokenClientRef.current = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "https://www.googleapis.com/auth/drive.file",
            callback: (resp) => {
              const handler = resultHandlerRef.current;
              if (!handler) return;
              if (resp.error || !resp.access_token) {
                handler(null, resp.error ?? "Google sign-in was cancelled.");
                return;
              }
              const picker = window.gapi?.picker;
              if (!picker) {
                handler(null, "Google Picker failed to load.");
                return;
              }
              new picker.PickerBuilder()
                .addView(picker.ViewId.DOCS)
                .setOAuthToken(resp.access_token as string)
                .setDeveloperKey(apiKey)
                .setCallback((data: PickerData) => {
                  if (data.action === picker.Action.PICKED && data.docs?.[0]) {
                    handler(data.docs[0]);
                  } else if (data.action === "cancel") {
                    handler(null);
                  }
                })
                .build()
                .setVisible(true);
            },
          });
        }
        setPicking(false);
        setPickerError(
          "Drive was still loading — click “Pick from Google Drive” once more.",
        );
      })
      .catch((err) => {
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
