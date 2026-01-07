export type StyleId =
  | "photo"
  | "cinema"
  | "glamour"
  | "meizitu"
  | "anime"
  | "cyberpunk"
  | "guofeng"
  | "illustration";

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

export type ImageQuality = "auto" | "low" | "medium" | "high";

export const STYLE_PRESETS: ReadonlyArray<{
  id: StyleId;
  label: string;
  hint: string;
  prompt: string;
}> = [
  {
    id: "photo",
    label: "写真写实",
    hint: "棚拍人像、自然皮肤质感",
    prompt:
      "photorealistic studio portrait, 85mm lens, softbox lighting, natural skin texture, clean background",
  },
  {
    id: "cinema",
    label: "电影光影",
    hint: "故事感、胶片氛围",
    prompt:
      "cinematic portrait, film grain, rim light, moody lighting, shallow depth of field, color graded",
  },
  {
    id: "glamour",
    label: "魅惑写真",
    hint: "时尚大片、诱人但不露骨",
    prompt:
      "glamour fashion portrait, alluring gaze, glossy lips, soft skin highlights, elegant pose, editorial photography, tasteful, high-end magazine style",
  },
  {
    id: "meizitu",
    label: "妹子图",
    hint: "好看的美女、干净耐看",
    prompt:
      "beautiful young adult woman (age 21+), Instagram-style beauty portrait, flattering soft light, clean background, natural skin texture, delicate makeup, pretty face, high detail, tasteful, non-explicit",
  },
  {
    id: "anime",
    label: "二次元",
    hint: "清透线条、精致五官",
    prompt:
      "anime style illustration, clean lineart, high detail, expressive eyes, soft shading",
  },
  {
    id: "illustration",
    label: "插画",
    hint: "笔触感、氛围插画",
    prompt:
      "high quality illustration, painterly brush strokes, soft ambient light, detailed textures",
  },
  {
    id: "cyberpunk",
    label: "赛博霓虹",
    hint: "霓虹灯、城市雨夜",
    prompt:
      "cyberpunk portrait, neon lights, rainy night city, reflections, holograms, high contrast",
  },
  {
    id: "guofeng",
    label: "国风",
    hint: "汉服、古典雅致",
    prompt:
      "Chinese guofeng portrait, hanfu outfit, elegant, ink wash vibe, delicate patterns, warm light",
  },
];

export const SIZE_OPTIONS: ReadonlyArray<{
  id: ImageSize;
  label: string;
  hint: string;
}> = [
  { id: "1024x1536", label: "竖版 2:3", hint: "更适合人像" },
  { id: "1024x1024", label: "方形 1:1", hint: "头像/贴纸" },
  { id: "1536x1024", label: "横版 3:2", hint: "海报/场景" },
];

export function isStyleId(value: unknown): value is StyleId {
  return (
    value === "photo" ||
    value === "cinema" ||
    value === "glamour" ||
    value === "meizitu" ||
    value === "anime" ||
    value === "cyberpunk" ||
    value === "guofeng" ||
    value === "illustration"
  );
}

export function isImageSize(value: unknown): value is ImageSize {
  return value === "1024x1024" || value === "1024x1536" || value === "1536x1024";
}

export function isImageQuality(value: unknown): value is ImageQuality {
  return value === "auto" || value === "low" || value === "medium" || value === "high";
}
