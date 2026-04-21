// Strips markdown code fences and leading/trailing prose from GPT JSON responses
// so JSON.parse succeeds even when the model wraps output in ```json ... ```.
export function cleanJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  const obj = trimmed.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
  return trimmed;
}
