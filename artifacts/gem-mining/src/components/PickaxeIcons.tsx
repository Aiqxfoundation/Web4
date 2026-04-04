/**
 * 7 Unique Animated SVG Pickaxes — fully transparent backgrounds
 * Each pickaxe has a distinct silhouette, color scheme, and animation personality.
 * Level 0 = Stone  | Level 1 = Iron/Fire | Level 2 = Crystal
 * Level 3 = Obsidian | Level 4 = Celestial | Level 5 = Astral | Level 6 = Eternal | Level 7 = Infinite
 */

import React from "react";
import { motion } from "framer-motion";

interface PickaxeProps {
  size?: number;
  animate?: boolean;
}

// ── Level 0: Stone Pickaxe — crude, chipped, grey-brown, slow wobble ──────────
export function StonePickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -6, 0, 6, 0] } : {}}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="stone-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="50%" stopColor="#57534e" />
          <stop offset="100%" stopColor="#3f3d3a" />
        </linearGradient>
        <linearGradient id="stone-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      {/* Handle */}
      <rect x="47" y="38" width="7" height="48" rx="3" fill="url(#stone-handle)" />
      {/* Head */}
      <path d="M18 28 L52 42 L46 55 L12 38 Z" fill="url(#stone-head)" />
      <path d="M52 42 L72 22 L78 30 L54 48 Z" fill="#a8a29e" />
      {/* Chips/cracks on stone */}
      <line x1="24" y1="34" x2="30" y2="40" stroke="#292524" strokeWidth="1.5" opacity="0.6" />
      <line x1="35" y1="37" x2="39" y2="44" stroke="#292524" strokeWidth="1" opacity="0.5" />
      {/* Tip */}
      <path d="M12 38 L4 50 L18 44 Z" fill="#6b7280" />
    </motion.svg>
  );
}

// ── Level 1: Ember Vanguard — iron pickaxe, fire-orange glow, rhythmic strike ─
export function EmberPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -10, 0] } : {}}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="ember-head" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="ember-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <filter id="ember-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="ember-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      {/* Glow */}
      <motion.ellipse
        cx="35" cy="38" rx="22" ry="14"
        fill="none" stroke="#f97316" strokeWidth="1"
        filter="url(#ember-glow)"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      />
      {/* Handle */}
      <rect x="47" y="38" width="6" height="50" rx="3" fill="url(#ember-handle)" />
      {/* Iron head body */}
      <path d="M14 30 L52 44 L46 56 L10 40 Z" fill="url(#ember-metal)" />
      {/* Fire-orange face */}
      <path d="M14 30 L52 44 L44 50 L16 38 Z" fill="url(#ember-head)" filter="url(#ember-glow)" />
      {/* Top spike */}
      <path d="M52 44 L76 20 L82 28 L56 48 Z" fill="url(#ember-metal)" />
      <path d="M76 20 L82 28 L80 24 Z" fill="#f97316" filter="url(#ember-glow)" />
      {/* Tip */}
      <path d="M10 40 L2 52 L16 46 Z" fill="#f97316" filter="url(#ember-glow)" />
      {/* Rivets */}
      <circle cx="34" cy="40" r="2.5" fill="#374151" />
      <circle cx="42" cy="43" r="2" fill="#374151" />
    </motion.svg>
  );
}

// ── Level 2: Crystal Ascendant — faceted crystal, cyan/teal, light refraction ─
export function CrystalPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -8, 0, 8, 0], y: [0, -3, 0] } : {}}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="crystal-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="crystal-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="crystal-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#164e63" />
          <stop offset="100%" stopColor="#083344" />
        </linearGradient>
        <filter id="crystal-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Glow aura */}
      <motion.ellipse cx="38" cy="38" rx="28" ry="18" fill="#0891b2" opacity="0.12"
        animate={{ opacity: [0.08, 0.25, 0.08], rx: [26, 32, 26] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      />
      {/* Handle */}
      <rect x="47" y="38" width="5" height="50" rx="2.5" fill="url(#crystal-handle)" />
      {/* Crystal head — faceted lower */}
      <path d="M14 32 L50 46 L44 60 L8 42 Z" fill="url(#crystal-a)" filter="url(#crystal-glow)" />
      {/* Crystal head — upper face (lighter) */}
      <path d="M14 32 L50 46 L46 50 L18 36 Z" fill="url(#crystal-b)" opacity="0.9" />
      {/* Top spike — long sharp crystal */}
      <path d="M50 46 L78 16 L82 22 L54 52 Z" fill="url(#crystal-a)" filter="url(#crystal-glow)" />
      <path d="M78 16 L84 20 L80 18 Z" fill="#e0f7fa" />
      {/* Crystal tip */}
      <path d="M8 42 L0 56 L14 50 Z" fill="url(#crystal-b)" filter="url(#crystal-glow)" />
      {/* Refraction sparkles */}
      {[
        { cx: 28, cy: 36 }, { cx: 38, cy: 40 }, { cx: 62, cy: 30 }
      ].map((p, i) => (
        <motion.circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="white" opacity="0.9"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.5 }}
        />
      ))}
    </motion.svg>
  );
}

// ── Level 3: Obsidian Raider — black blade, purple/violet edge glow, menacing ─
export function ObsidianPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -12, 2, -8, 0] } : {}}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="obs-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a0a2e" />
          <stop offset="60%" stopColor="#2d1b4e" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="obs-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="obs-glow">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="obs-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0f23" />
        </linearGradient>
      </defs>
      {/* Dark aura */}
      <motion.ellipse cx="36" cy="38" rx="26" ry="16" fill="#7c3aed" opacity="0.15"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      />
      {/* Handle */}
      <rect x="47" y="38" width="5" height="50" rx="2.5" fill="url(#obs-handle)" />
      {/* Blade body — wide angular obsidian */}
      <path d="M10 28 L52 44 L44 60 L6 40 Z" fill="url(#obs-blade)" />
      {/* Purple glowing edge */}
      <path d="M10 28 L52 44 L46 50 L14 32 Z" fill="url(#obs-edge)" opacity="0.7" filter="url(#obs-glow)" />
      {/* Top spike — very sharp */}
      <path d="M52 44 L80 14 L86 24 L56 50 Z" fill="url(#obs-blade)" />
      <path d="M80 14 L86 24 L84 18 Z" fill="url(#obs-edge)" filter="url(#obs-glow)" />
      {/* Jagged bottom tip */}
      <path d="M6 40 L-2 56 L10 49 L4 58 L18 48 Z" fill="url(#obs-blade)" />
      <path d="M6 40 L-2 56 L10 49 Z" stroke="#a855f7" strokeWidth="0.8" fill="none" filter="url(#obs-glow)" />
      {/* Cracks glowing purple */}
      <motion.line x1="22" y1="34" x2="36" y2="46" stroke="#a855f7" strokeWidth="1.5" opacity="0.6"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <line x1="30" y1="30" x2="38" y2="38" stroke="#7c3aed" strokeWidth="0.8" opacity="0.5" />
    </motion.svg>
  );
}

// ── Level 4: Celestial Digger — gold + sapphire, star orbit, divine glow ─────
export function CelestialPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -6, 0, 6, 0], y: [0, -4, 0] } : {}}
      transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="cel-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="cel-sapphire" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="cel-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="cel-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
      </defs>
      {/* Celestial aura */}
      <motion.ellipse cx="38" cy="38" rx="30" ry="20" fill="#f59e0b" opacity="0.1"
        animate={{ opacity: [0.06, 0.2, 0.06], rx: [28, 34, 28] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      {/* Orbiting stars */}
      {[0, 120, 240].map((deg, i) => (
        <motion.circle key={i} r="2.5" fill="#fbbf24" filter="url(#cel-glow)"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, delay: (i * 3) / 3, ease: "linear" }}
          style={{ transformOrigin: "38px 38px" }}
          cx={38 + 34 * Math.cos((deg * Math.PI) / 180)}
          cy={38 + 20 * Math.sin((deg * Math.PI) / 180)}
        />
      ))}
      {/* Handle */}
      <rect x="47" y="38" width="6" height="50" rx="3" fill="url(#cel-handle)" />
      {/* Gold head */}
      <path d="M12 30 L52 44 L44 58 L8 42 Z" fill="url(#cel-gold)" filter="url(#cel-glow)" />
      {/* Sapphire face */}
      <path d="M12 30 L52 44 L48 50 L16 34 Z" fill="url(#cel-sapphire)" opacity="0.85" />
      {/* Top spike — gold */}
      <path d="M52 44 L78 18 L84 26 L56 50 Z" fill="url(#cel-gold)" filter="url(#cel-glow)" />
      {/* Star tip */}
      <path d="M78 18 L82 14 L84 20 L88 18 L84 26 Z" fill="#fde68a" filter="url(#cel-glow)" />
      {/* Pointed tip */}
      <path d="M8 42 L0 56 L14 48 Z" fill="url(#cel-gold)" filter="url(#cel-glow)" />
      {/* Decorative gem on head */}
      <polygon points="32,36 36,30 40,36 36,42" fill="#93c5fd" opacity="0.9" filter="url(#cel-glow)" />
    </motion.svg>
  );
}

// ── Level 5: Astral Excavator — nebula purple, ethereal void energy ───────────
export function AstralPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -8, 0, 8, 0], scale: [1, 1.04, 1] } : {}}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="astral-void" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c026d3" />
          <stop offset="40%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="astral-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="astral-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="astral-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      {/* Nebula glow */}
      <motion.ellipse cx="38" cy="38" rx="32" ry="22"
        fill="none" stroke="#c026d3" strokeWidth="1.5"
        filter="url(#astral-glow)"
        animate={{ opacity: [0.2, 0.7, 0.2], ry: [20, 26, 20] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      />
      {/* Handle */}
      <rect x="47" y="38" width="5" height="50" rx="2.5" fill="url(#astral-handle)" />
      {/* Ethereal blade */}
      <path d="M10 28 L52 44 L42 62 L4 42 Z" fill="url(#astral-void)" filter="url(#astral-glow)" />
      <path d="M10 28 L52 44 L48 50 L16 32 Z" fill="url(#astral-light)" opacity="0.75" />
      {/* Long curving spike */}
      <path d="M52 44 L82 12 L88 22 L56 52 Z" fill="url(#astral-void)" filter="url(#astral-glow)" />
      <path d="M82 12 L90 18 L86 14 Z" fill="#f0abfc" filter="url(#astral-glow)" />
      {/* Void tip */}
      <path d="M4 42 L-4 58 L12 50 Z" fill="url(#astral-light)" filter="url(#astral-glow)" />
      {/* Energy orbs floating */}
      {[
        { cx: 28, cy: 28, r: 3 }, { cx: 55, cy: 25, r: 2 }, { cx: 18, cy: 45, r: 2.5 }
      ].map((o, i) => (
        <motion.circle key={i} cx={o.cx} cy={o.cy} r={o.r} fill="#e879f9"
          filter="url(#astral-glow)"
          animate={{ opacity: [0, 1, 0], y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 2, delay: i * 0.7 }}
        />
      ))}
    </motion.svg>
  );
}

// ── Level 6: Eternal Sovereign — royal gold, jewel-encrusted, divine radiance ─
export function EternalPickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -7, 0, 7, 0], y: [0, -5, 0] } : {}}
      transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="eter-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="eter-glow-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <filter id="eter-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="eter-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>
      {/* Divine radiance */}
      {[1, 0.6, 0.3].map((o, i) => (
        <motion.ellipse key={i} cx="38" cy="38" rx={24 + i * 8} ry={16 + i * 6}
          fill="#fbbf24" opacity={o * 0.12}
          animate={{ opacity: [o * 0.08, o * 0.25, o * 0.08] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.3 }}
        />
      ))}
      {/* Handle with gold bands */}
      <rect x="47" y="38" width="6" height="50" rx="3" fill="url(#eter-handle)" />
      <rect x="46" y="52" width="8" height="3" rx="1.5" fill="#fbbf24" />
      <rect x="46" y="64" width="8" height="3" rx="1.5" fill="#fbbf24" />
      {/* Ornate head */}
      <path d="M10 26 L52 42 L42 60 L4 40 Z" fill="url(#eter-gold)" filter="url(#eter-glow)" />
      <path d="M10 26 L52 42 L48 48 L14 30 Z" fill="#fef9c3" opacity="0.6" />
      {/* Crown-shaped top spike */}
      <path d="M52 42 L78 14 L86 24 L56 50 Z" fill="url(#eter-gold)" filter="url(#eter-glow)" />
      {/* Mini crown atop */}
      <path d="M76 14 L80 8 L84 14 L88 8 L92 14 L88 20 L80 20 Z" fill="#fbbf24" filter="url(#eter-glow)" />
      {/* Jewels */}
      {[
        { x: 26, y: 34, c: "#ef4444" },
        { x: 38, y: 40, c: "#3b82f6" },
        { x: 62, y: 28, c: "#22c55e" },
        { x: 84, y: 14, c: "#f97316" },
      ].map((j, i) => (
        <motion.circle key={i} cx={j.x} cy={j.y} r="3.5" fill={j.c}
          filter="url(#eter-glow)"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
        />
      ))}
      {/* Pointed tip */}
      <path d="M4 40 L-4 56 L12 48 Z" fill="url(#eter-gold)" filter="url(#eter-glow)" />
    </motion.svg>
  );
}

// ── Level 7: Infinite Emperor — prismatic myth, all-element, reality-warping ──
export function InfinitePickaxe({ size = 80, animate = true }: PickaxeProps) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      style={{ overflow: "visible" }}
      animate={animate ? { rotate: [0, -10, 0, 10, 0], scale: [1, 1.06, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="inf-rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="20%" stopColor="#f97316" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="80%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="inf-white" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.8" />
        </linearGradient>
        <filter id="inf-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="inf-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="33%" stopColor="#3b82f6" />
          <stop offset="66%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      {/* Multi-layer reality aura */}
      {["#f43f5e", "#3b82f6", "#a855f7"].map((c, i) => (
        <motion.ellipse key={i} cx="38" cy="38" rx={26 + i * 10} ry={18 + i * 6}
          fill="none" stroke={c} strokeWidth="1.5" opacity="0.4"
          filter="url(#inf-glow)"
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ repeat: Infinity, duration: 4 + i, ease: "linear" }}
          style={{ transformOrigin: "38px 38px" }}
        />
      ))}
      {/* Rainbow handle */}
      <rect x="47" y="38" width="6" height="50" rx="3" fill="url(#inf-handle)" filter="url(#inf-glow)" />
      {/* Prismatic blade */}
      <path d="M8 24 L52 42 L40 64 L2 42 Z" fill="url(#inf-rainbow)" filter="url(#inf-glow)" />
      <path d="M8 24 L52 42 L48 48 L12 28 Z" fill="url(#inf-white)" opacity="0.75" />
      {/* Long mythical spike */}
      <path d="M52 42 L84 8 L92 20 L58 54 Z" fill="url(#inf-rainbow)" filter="url(#inf-glow)" />
      <path d="M84 8 L94 16 L90 10 Z" fill="white" filter="url(#inf-glow)" />
      {/* Infinite symbol tip */}
      <path d="M2 42 L-6 60 L8 52 L2 64 L16 54 Z" fill="url(#inf-rainbow)" filter="url(#inf-glow)" />
      {/* Orbiting prismatic orbs */}
      {["#f43f5e", "#eab308", "#22c55e", "#3b82f6", "#a855f7"].map((c, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <motion.circle key={i} r="3" fill={c} filter="url(#inf-glow)"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
            style={{ transformOrigin: "38px 38px" }}
            cx={38 + 38 * Math.cos(angle)}
            cy={38 + 22 * Math.sin(angle)}
          />
        );
      })}
    </motion.svg>
  );
}

// ── Lookup by level ────────────────────────────────────────────────────────────
export const LEVEL_PICKAXES = [
  StonePickaxe,
  EmberPickaxe,
  CrystalPickaxe,
  ObsidianPickaxe,
  CelestialPickaxe,
  AstralPickaxe,
  EternalPickaxe,
  InfinitePickaxe,
] as const;

export function LevelPickaxe({ level, size, animate }: { level: number; size?: number; animate?: boolean }) {
  const Comp = LEVEL_PICKAXES[Math.min(level, 7)] ?? StonePickaxe;
  return <Comp size={size} animate={animate} />;
}
