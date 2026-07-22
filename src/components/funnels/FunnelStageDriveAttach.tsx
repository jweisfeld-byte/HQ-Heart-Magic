"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Single-file Google Drive attach control for one funnel stage —
 * same Google Identity Services + Picker flow as
 * components/knowledge/ReferencesEditor.tsx, trimmed down to attach
 * exactly one file per stage (rather than a repeatable list of
 * references) and auto-submitting immediately on pick instead of
 * waiting for a surrounding form's own submit button.
 */

type GoogleTokenClient = { requestAccessToken: () => void };
type PickerDoc = { id: string; name: string; url: string };
type PickerData = { action: string; docs?: PickerDoc[] };
type PickerBuilderInstance = {
  addView: (view: unknown) => PickerBuilderInstance;
  setOAuthToken: (token: string) => PickerBuilderInstance;
  setDeveloperKey: (key: string) => PickerBuilderInstance;
  setCallback: (cb: (data: PickerData) => void) => PickerBuilderInstance;
  build: () => { setVisible: (visible: boolean) => void };
};
type GooglePickerNamespace = {
  PickerBuilder: new () => PickerBuilderInstance;
  ViewId: { DOCS: unknown };
  Action: { PICKED: string };
};
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
  picker?: GooglePickerNamespace;
};
type Gapi = { load: (api: string, callback: () => void) => void };

declare global {
  interface Window {
    google?: GoogleIdentity;
    gapi?: Gapi;
  }
}

const LOG_PREFIX = "[FunnelDrivePicker]";

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
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), ms);
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

let googleReadyPromise: Promise<void> | null = null;
function ensureGoogleLoaded(): Promise<void> {
  if (!googleReadyPromise) {
    googleReadyPromise = (async () => {
      await loadScriptOnce("https://accounts.google.com/gsi/client");
      await loadScriptOnce("https://apis.google.com/js/api.js");
      const gapi = window.gapi;
      if (!gapi) throw new Error("Google API script loaded but window.gapi is missing.");
      await withTimeout(
        new Promise<void>((resolve) => gapi.load("picker", resolve)),
        10000,
        "gapi.load('picker')",
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
  const picker = window.google?.picker;
  if (!picker) {
    onResult(null, "Google Picker module never finished loading.");
    return;
  }
  try {
    const builder = new picker.PickerBuilder()
      .addView(picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setCallback((data: PickerData) => {
        if (data.action === picker.Action.PICKED && data.docs?.[0]) {
          onResult(data.docs[0]);
        } else if (data.action === "cancel") {
          onResult(null);
        }
      })
      .build();
    builder.setVisible(true);
  } catch (err) {
    console.error(`${LOG_PREFIX} PickerBuilder threw:`, err);
    onResult(null, err instanceof Error ? err.message : "Google Picker failed to open.");
  }
}

type DriveAttachable = {
  id: string;
  file_label: string | null;
  file_url: string | null;
  drive_file_id: string | null;
};

// Generic — used both for a funnel_stage row and a funnel_stage_asset
// row (each "format" within a stage), since both carry the same three
// file_label/file_url/drive_file_id columns.
export function FunnelStageDriveAttach({
  stage,
  funnelId,
  action,
  removeAction,
}: {
  stage: DriveAttachable;
  funnelId: string;
  action: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const resultHandlerRef = useRef<((doc: PickerDoc | null, error?: string) => void) | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;

  function initTokenClient() {
    const google = window.google;
    if (!google || !clientId || !apiKey) return null;
    return google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp) => {
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

  useEffect(() => {
    if (!clientId || !apiKey) return;
    ensureGoogleLoaded()
      .then(() => {
        tokenClientRef.current = initTokenClient();
      })
      .catch((err) => {
        console.error(`${LOG_PREFIX} preload failed:`, err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, apiKey]);

  function handlePickFromDrive() {
    setPickerError(null);

    if (!clientId || !apiKey) {
      setPickerError("Google Drive isn't connected yet — see Settings > Integrations.");
      return;
    }

    resultHandlerRef.current = (doc, error) => {
      setPicking(false);
      if (error) {
        setPickerError(error);
        return;
      }
      if (doc && formRef.current) {
        const form = formRef.current;
        (form.elements.namedItem("fileLabel") as HTMLInputElement).value = doc.name;
        (form.elements.namedItem("fileUrl") as HTMLInputElement).value = doc.url;
        (form.elements.namedItem("driveFileId") as HTMLInputElement).value = doc.id;
        form.requestSubmit();
      }
    };

    if (tokenClientRef.current) {
      setPicking(true);
      tokenClientRef.current.requestAccessToken();
      return;
    }

    setPicking(true);
    ensureGoogleLoaded()
      .then(() => {
        if (!tokenClientRef.current) tokenClientRef.current = initTokenClient();
        if (!tokenClientRef.current) throw new Error("Could not initialize Google sign-in.");
        setPicking(false);
        setPickerError("Drive just finished loading — click again.");
      })
      .catch((err) => {
        setPicking(false);
        setPickerError(err instanceof Error ? err.message : "Couldn't load Google Drive.");
      });
  }

  const hasFile = Boolean(stage.drive_file_id || stage.file_url);

  return (
    <div className="flex flex-col gap-1">
      <form ref={formRef} action={action} onClick={(e) => e.stopPropagation()}>
        <input type="hidden" name="id" value={stage.id} />
        <input type="hidden" name="funnelId" value={funnelId} />
        <input type="hidden" name="fileLabel" defaultValue={stage.file_label ?? ""} />
        <input type="hidden" name="fileUrl" defaultValue={stage.file_url ?? ""} />
        <input type="hidden" name="driveFileId" defaultValue={stage.drive_file_id ?? ""} />
      </form>

      {hasFile ? (
        <div className="flex items-center gap-2">
          {stage.file_url ? (
            <a
              href={stage.file_url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm text-accent hover:underline"
              title={stage.file_label ?? undefined}
            >
              📄 {stage.file_label ?? "Attached file"}
            </a>
          ) : (
            <span className="truncate text-sm text-foreground">
              📄 {stage.file_label ?? "Attached file"}
            </span>
          )}
          <button
            type="button"
            onClick={handlePickFromDrive}
            disabled={picking}
            className="text-xs text-muted hover:text-accent disabled:opacity-50"
          >
            {picking ? "Opening…" : "Change"}
          </button>
          <form action={removeAction} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={stage.id} />
            <input type="hidden" name="funnelId" value={funnelId} />
            <button type="submit" className="text-xs text-muted hover:text-red-600">
              Remove
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePickFromDrive}
          disabled={picking}
          className="text-left text-sm text-accent hover:underline disabled:opacity-50"
        >
          {picking ? "Opening Drive…" : "📎 Pick from Google Drive"}
        </button>
      )}
      {pickerError && <p className="text-xs text-red-600">{pickerError}</p>}
    </div>
  );
}
