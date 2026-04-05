import React from "react";

let _id = 0;

export function GemIcon({ size = 20 }: { size?: number }) {
  const uid = React.useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: "inline-block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`g-top-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`g-left-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`g-right-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id={`g-bottom-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2e1065" />
        </linearGradient>
      </defs>
      <polygon points="20,4 30,14 20,10"      fill={`url(#g-top-${uid})`} />
      <polygon points="20,4 10,14 20,10"      fill={`url(#g-top-${uid})`} opacity="0.85" />
      <polygon points="30,14 20,10 10,14"     fill={`url(#g-right-${uid})`} opacity="0.7" />
      <polygon points="10,14 20,10 20,34 6,22"   fill={`url(#g-left-${uid})`} />
      <polygon points="30,14 20,10 20,34 34,22"  fill={`url(#g-right-${uid})`} />
      <polygon points="20,34 6,22 34,22"      fill={`url(#g-bottom-${uid})`} />
      <polygon points="20,5 26,12 22,11"      fill="#f97316" opacity="0.85" />
    </svg>
  );
}
