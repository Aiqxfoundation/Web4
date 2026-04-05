import React from "react";
import { Gem } from "lucide-react";

export function GemIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Gem size={size} className={className} style={{ color: "#f97316", flexShrink: 0 }} />;
}
