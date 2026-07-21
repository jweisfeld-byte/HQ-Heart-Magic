"use client";

import { useState } from "react";

export type ReferenceRow = { label: string; url: string; driveFileId?: string };

/**
 * Minimal shape of the bits of Google's Identity Services + Picker APIs
 * this component calls. Loaded lazily (only if "Pick from Google Drive"
 * is actually clicked), not typed by Google, so these are hand-written
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

async function openDrivePicker(): Promise<PickerDoc | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error(
      "Google Drive isn't connected yet — NEXT_PUBLIC_GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_PICKER_API_KEY aren't set.",
    );
  }

  await loadScriptOnce("https://accounts.google.com/gsi/client");
  await loadScriptOnce("https://apis.google.com/js/api.js");

  const gapi = window.gapi;
  if (!gapi) throw new Error("Google API script failed to load.");

  await new Promise<void>((resolve) => gapi.load("picker", resolve));

  const google = window.google;
  if (!google) throw new Error("Google Identity Services script failed to load.");

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      // drive.file: only files the user explicitly picks or that this
      // app creates — least-privilege, per Technical Architecture v1
      // Section 6, not blanket read access to the whole Drive.
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? "Google sign-in was cancelled."));
          return;
        }

        const picker = gapi.picker;
        if (!picker) {
          reject(new Error("Google Picker failed to load."));
          return;
        }

        new picker.PickerBuilder()
          .addView(picker.ViewId.DOCS)
          .setOAuthToken(resp.access_token as string)
          .setDeveloperKey(apiKey)
          .setCallback((data: PickerData) => {
            if (data.action === picker.Action.PICKED && data.docs?.[0]) {
              resolve(data.docs[0]);
            } else if (data.action === "cancel") {
              resolve(null);
            }
            // Ignore "loaded" and other transient picker lifecycle events.
          })
          .build()
          .setVisible(true);
      },
    });

    tokenClient.requestAccessToken();
  });
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

  async function handlePickFromDrive() {
    setPickerError(null);
    setPicking(true);
    try {
      const doc = await openDrivePicker();
      if (doc) {
        addRow({ label: doc.name, url: doc.url, driveFileId: doc.id });
      }
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Couldn't open Google Drive.");
    } finally {
      setPicking(false);
    }
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
