const BLOCKLIST_MINOR = [
  "未成年",
  "未滿18",
  "未满18",
  "幼女",
  "幼男",
  "萝莉",
  "蘿莉",
  "小学生",
  "中学生",
];

const BLOCKLIST_EXPLICIT = [
  "裸体",
  "全裸",
  "半裸",
  "裸露",
  "nude",
  "nudity",
  "性交",
  "做爱",
  "口交",
  "强奸",
];

function includesAny(haystack: string, needles: readonly string[]) {
  const text = haystack.toLowerCase();
  return needles.some((needle) => text.includes(needle.toLowerCase()));
}

function matchesAny(text: string, patterns: readonly RegExp[]) {
  return patterns.some((re) => re.test(text));
}

export type SafetyLevel = "standard" | "strict";

export type PromptSafetyResult =
  | { ok: true }
  | { ok: false; reason: "minor" | "explicit"; message: string };

const BLOCKLIST_SUGGESTIVE_STRICT = [
  "内衣",
  "胸罩",
  "丁字裤",
  "比基尼",
  "lingerie",
  "underwear",
];

// Always block strong sexual-intent / high-risk terms even in "standard".
const BLOCKLIST_SUGGESTIVE_ALWAYS = [
  "情趣",
  "情趣内衣",
  "丁字裤",
  "透视",
  "透明",
  "see-through",
];

// Avoid false positives like "sexy" matching "sex".
const RE_EXPLICIT_EN: readonly RegExp[] = [
  /\bnude(s)?\b/i,
  /\bnudity\b/i,
  /\bporn(ography)?\b/i,
  /(^|[^a-z])sex([^a-z]|$)/i,
  /\brape\b/i,
  /\boral\s*sex\b/i,
];

const RE_MINOR_EN: readonly RegExp[] = [
  /\bunderage\b/i,
  /\bminor\b/i,
  /\bloli\b/i,
  /\bchild\b/i,
  /\bkid\b/i,
  /\bteen(age|ager)?\b/i,
];

export function isSafetyLevel(value: unknown): value is SafetyLevel {
  return value === "standard" || value === "strict";
}

export function checkPromptSafety(
  userPrompt: string,
  safetyLevel: SafetyLevel = "standard",
): PromptSafetyResult {
  const trimmed = userPrompt.trim();
  if (!trimmed) return { ok: false, reason: "explicit", message: "请输入提示词。" };

  if (trimmed.length > 1200) {
    return { ok: false, reason: "explicit", message: "提示词太长了（建议 ≤ 1200 字）。" };
  }

  // Allow harmless words that contain "裸" like "裸妆/裸色" (but still block real nudity terms).
  const normalized = trimmed.replaceAll("裸妆", " ").replaceAll("裸色", " ");
  const normalizedForSuggestive = normalized
    // Avoid false positives where user explicitly says "not see-through/transparent".
    .replaceAll("不透视", " ")
    .replaceAll("非透视", " ")
    .replaceAll("不透明", " ")
    .replaceAll("非透明", " ")
    .replace(/(?:no|not|non)\s*see-?through/gi, " ")
    .replace(/(?:no|not|non)\s*transparent/gi, " ");

  if (includesAny(normalized, BLOCKLIST_MINOR) || matchesAny(normalized, RE_MINOR_EN)) {
    return {
      ok: false,
      reason: "minor",
      message: "不支持生成未成年人相关内容。请仅描述成年人物（21+）。",
    };
  }

  if (
    includesAny(normalized, BLOCKLIST_EXPLICIT) ||
    matchesAny(normalized, RE_EXPLICIT_EN)
  ) {
    return {
      ok: false,
      reason: "explicit",
      message:
        "不支持露骨/裸体/色情内容。你可以描述“时尚、性感但衣着完整”的风格（例如写真/杂志风）。",
    };
  }

  if (includesAny(normalizedForSuggestive, BLOCKLIST_SUGGESTIVE_ALWAYS)) {
    return {
      ok: false,
      reason: "explicit",
      message:
        "不支持明显性暗示/高风险内容。你可以改成“时尚性感、衣着完整、非透视”的写真描述。",
    };
  }

  if (
    safetyLevel === "strict" &&
    includesAny(normalizedForSuggestive, BLOCKLIST_SUGGESTIVE_STRICT)
  ) {
    return {
      ok: false,
      reason: "explicit",
      message: "严格模式：不支持带明显性暗示的服装/描述。请改为更日常的穿搭描述。",
    };
  }

  return { ok: true };
}
