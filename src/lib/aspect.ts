import type { ImageSize } from "@/lib/presets";

export function aspectClassForSize(size: ImageSize) {
  if (size === "1024x1536") return "aspect-[2/3]";
  if (size === "1536x1024") return "aspect-[3/2]";
  return "aspect-square";
}

