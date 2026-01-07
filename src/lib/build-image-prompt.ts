import { STYLE_PRESETS, type StyleId } from "@/lib/presets";
import { promptFragmentForTagKey } from "@/lib/tags";

const BASE_GUARDRAILS = [
  "a beautiful adult woman (age 21+)",
  "tasteful, non-explicit, glamour fashion vibe",
  "no nudity, no explicit sexual content, no sex act",
  "no exposed nipples, no exposed genitals",
  "no see-through clothing",
  "high quality, detailed face, symmetrical features",
  "clean composition",
].join(", ");

export function buildFinalPrompt(userPrompt: string, styleId: StyleId) {
  const preset = STYLE_PRESETS.find((p) => p.id === styleId);
  const stylePrompt = preset?.prompt ?? STYLE_PRESETS[0]!.prompt;

  const user = userPrompt.trim();
  return [BASE_GUARDRAILS, stylePrompt, user].filter(Boolean).join(", ");
}

export function buildFinalPromptWithTags(
  userPrompt: string,
  styleId: StyleId,
  tagKeys: string[] | undefined,
) {
  const preset = STYLE_PRESETS.find((p) => p.id === styleId);
  const stylePrompt = preset?.prompt ?? STYLE_PRESETS[0]!.prompt;

  const user = userPrompt.trim();
  const tags = (tagKeys ?? [])
    .map((k) => promptFragmentForTagKey(k))
    .map((x) => x.trim())
    .filter(Boolean);

  return [BASE_GUARDRAILS, stylePrompt, ...tags, user].filter(Boolean).join(", ");
}
