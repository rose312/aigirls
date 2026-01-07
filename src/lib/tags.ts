export type TagCategory =
  | "hairColor"
  | "hairStyle"
  | "outfit"
  | "scene"
  | "mood"
  | "extra";

export type TagGroup = {
  category: Exclude<TagCategory, "extra">;
  label: string;
  options: ReadonlyArray<{ id: string; label: string }>;
};

export const TAG_GROUPS: ReadonlyArray<TagGroup> = [
  {
    category: "hairColor",
    label: "发色",
    options: [
      { id: "black", label: "黑发" },
      { id: "brown", label: "棕发" },
      { id: "blonde", label: "金发" },
      { id: "silver", label: "银发" },
      { id: "pink", label: "粉发" },
      { id: "blue", label: "蓝发" },
      { id: "red", label: "红发" },
      { id: "purple", label: "紫发" },
      { id: "gradient", label: "渐变发" },
    ],
  },
  {
    category: "hairStyle",
    label: "发型",
    options: [
      { id: "long", label: "长发" },
      { id: "short", label: "短发" },
      { id: "bob", label: "波波头" },
      { id: "wavy", label: "微卷" },
      { id: "straight", label: "直发" },
      { id: "ponytail", label: "马尾" },
      { id: "twinTails", label: "双马尾" },
      { id: "bun", label: "丸子头" },
      { id: "bangs", label: "刘海" },
    ],
  },
  {
    category: "outfit",
    label: "穿搭",
    options: [
      { id: "dress", label: "连衣裙" },
      { id: "casual", label: "休闲" },
      { id: "street", label: "街头风" },
      { id: "business", label: "通勤风" },
      { id: "sweater", label: "针织衫" },
      { id: "hoodie", label: "卫衣" },
      { id: "coat", label: "风衣/大衣" },
      { id: "hanfu", label: "汉服" },
      { id: "kimono", label: "和风浴衣" },
      { id: "sports", label: "运动风" },
      { id: "swimwear", label: "泳装（比基尼）" },
      { id: "lingerieAd", label: "内衣（广告风）" },
    ],
  },
  {
    category: "scene",
    label: "场景",
    options: [
      { id: "studio", label: "棚拍纯背景" },
      { id: "cafe", label: "咖啡馆" },
      { id: "street", label: "街头" },
      { id: "park", label: "公园" },
      { id: "library", label: "书店/图书馆" },
      { id: "rainyNeon", label: "雨夜霓虹" },
      { id: "sunset", label: "日落" },
      { id: "windowLight", label: "窗边自然光" },
      { id: "garden", label: "花园" },
      { id: "beach", label: "海边" },
    ],
  },
  {
    category: "mood",
    label: "气质",
    options: [
      { id: "gentleSmile", label: "温柔微笑" },
      { id: "cool", label: "清冷" },
      { id: "cute", label: "可爱" },
      { id: "elegant", label: "优雅" },
      { id: "confident", label: "自信" },
      { id: "mysterious", label: "神秘" },
      { id: "bright", label: "阳光" },
      { id: "serious", label: "克制" },
      { id: "alluring", label: "魅惑眼神" },
      { id: "lazy", label: "慵懒" },
    ],
  },
];

export function tagKey(category: TagCategory, id: string) {
  return `${category}:${id}`;
}

export function parseTagKey(key: string): { category: TagCategory; id: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  const category = key.slice(0, idx) as TagCategory;
  const id = key.slice(idx + 1);
  if (!id) return null;
  if (
    category !== "hairColor" &&
    category !== "hairStyle" &&
    category !== "outfit" &&
    category !== "scene" &&
    category !== "mood" &&
    category !== "extra"
  ) {
    return null;
  }
  return { category, id };
}

export function labelForTagKey(key: string) {
  const parsed = parseTagKey(key);
  if (!parsed) return key;
  if (parsed.category === "extra") return parsed.id;

  const group = TAG_GROUPS.find((g) => g.category === parsed.category);
  const opt = group?.options.find((o) => o.id === parsed.id);
  return opt?.label ?? parsed.id;
}

export function promptFragmentForTagKey(key: string) {
  const parsed = parseTagKey(key);
  if (!parsed) return "";
  if (parsed.category === "extra") return parsed.id;
  return labelForTagKey(key);
}

export function sanitizeTagKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.length > 80) return null;
  const parsed = parseTagKey(trimmed);
  if (!parsed) return null;

  if (parsed.category === "extra") {
    // keep freeform short tags, but strip newlines.
    const safeId = parsed.id.replace(/\s+/g, " ").trim();
    if (!safeId) return null;
    if (safeId.length > 40) return null;
    return tagKey("extra", safeId);
  }

  // Only allow known options for fixed categories.
  const group = TAG_GROUPS.find((g) => g.category === parsed.category);
  const ok = group?.options.some((o) => o.id === parsed.id) ?? false;
  return ok ? trimmed : null;
}
