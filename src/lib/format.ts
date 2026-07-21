// Shared display-name helper: turns "jacob@heartmagiccacao.com" into
// "Jacob" wherever an assignee's email would otherwise be shown raw.
export function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "";
  const prefix = email.split("@")[0];
  if (!prefix) return "";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
