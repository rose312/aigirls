export type PromptPresetId =
  | "pageant_redcarpet"
  | "pageant_swimwear"
  | "pageant_national"
  | "pageant_interview"
  | "pageant_fitness"
  | "pageant_city";

export function isPromptPresetId(value: unknown): value is PromptPresetId {
  return (
    value === "pageant_redcarpet" ||
    value === "pageant_swimwear" ||
    value === "pageant_national" ||
    value === "pageant_interview" ||
    value === "pageant_fitness" ||
    value === "pageant_city"
  );
}

export const PROMPT_PRESETS: ReadonlyArray<{
  id: PromptPresetId;
  label: string;
  hint: string;
  exampleKeywords: string;
}> = [
  {
    id: "pageant_redcarpet",
    label: "红毯晚礼服",
    hint: "国际大赛级 · 高级定制",
    exampleKeywords: "晚礼服、红唇、钻石耳环、金色逆光、优雅微笑",
  },
  {
    id: "pageant_interview",
    label: "采访通勤",
    hint: "知性自信 · 干净高级",
    exampleKeywords: "西装套装、盘发、自然光、干净背景、自信眼神",
  },
  {
    id: "pageant_city",
    label: "都市街拍",
    hint: "时尚街头 · 电影感",
    exampleKeywords: "风衣、城市街头、霓虹、浅景深、冷暖对比",
  },
  {
    id: "pageant_fitness",
    label: "健康运动",
    hint: "阳光活力 · 健康肤感",
    exampleKeywords: "运动装、清爽马尾、晨光、健康微笑、活力姿态",
  },
  {
    id: "pageant_national",
    label: "民族风格",
    hint: "文化元素 · 华丽细节",
    exampleKeywords: "民族风、刺绣纹样、头饰、舞台灯光、庄重优雅",
  },
  {
    id: "pageant_swimwear",
    label: "泳装写真",
    hint: "全覆盖 · 克制性感",
    exampleKeywords: "泳装（完整覆盖）、海边日落、金色光晕、自信站姿、杂志封面",
  },
];

export function presetHintForOptimizer(presetId: PromptPresetId | null) {
  switch (presetId) {
    case "pageant_redcarpet":
      return "red carpet evening gown, premium styling, luxury vibe";
    case "pageant_swimwear":
      return "pageant swimwear photo, fully covered, tasteful, confident pose";
    case "pageant_national":
      return "national costume inspired fashion, cultural elegance, rich details";
    case "pageant_interview":
      return "interview look, smart business attire, warm confident smile";
    case "pageant_fitness":
      return "fitness / sporty lifestyle, healthy glow, athletic elegance";
    case "pageant_city":
      return "city editorial street style, modern, clean lines, premium look";
    default:
      return "high-end beauty portrait, tasteful, non-explicit";
  }
}

