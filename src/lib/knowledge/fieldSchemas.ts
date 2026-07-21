import type { FieldSchemaField } from "./types";

// Engineer-defined structured fields per module (Content Modules v1
// Section 1). Add a new export here + wire it into that module's route
// wrappers when a collection needs more than title/body — don't build a
// user-facing schema editor (explicitly rejected, same section).

export const CREATOR_PROFILE_FIELDS: FieldSchemaField[] = [
  { key: "photo_url", label: "Photo URL", type: "url" },
  { key: "handle", label: "Handle (e.g. @janedoe)", type: "text" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_phone", label: "Contact phone", type: "tel" },
  { key: "instagram", label: "Instagram", type: "url" },
  { key: "tiktok", label: "TikTok", type: "url" },
];
