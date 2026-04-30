import { useState, useRef } from "react";

/* ══ DEFAULTS & PALETTES ═════════════════════════════════════════════════════ */

export const DEFAULT_MOJI = {
  bg:               "#A7C7E7",
  skin:             "#F5CBA0",
  hairStyle:        "short",
  hairColor:        "#3B2314",
  eyeStyle:         "round",
  eyeColor:         "#3D2B1F",
  browStyle:        "natural",
  browColor:        "",
  noseStyle:        "button",
  mouthStyle:       "smile",
  facialHair:       "none",
  facialHairColor:  "",
  glasses:          "none",
  hat:              "none",
  hatColor:         "#6366F1",
  earrings:         "none",
  earringColor:     "#F5D27A",
  clothing:         "crew",
  clothingColor:    "#6366F1",
  freckles:         false,
  dimples:          false,
};

export const SKIN_TONES   = ["#FCEBD5","#F5CBA0","#E8A87C","#D4956A","#B8714E","#8B4A2B","#6B3420","#3D1C0D"];
export const HAIR_COLORS  = ["#0A0A0A","#2C1810","#5C3317","#8B4513","#C47A2D","#D4A850","#F5D67A","#FFFACD","#8B0000","#CC2222","#FF69B4","#C9B1FF","#3498DB","#27AE60","#95A5A6","#FFFFFF"];
export const EYE_COLORS   = ["#3D2B1F","#5C4033","#2E4A7A","#1B6B3A","#6B7280","#85C1E9","#8B6914","#555555"];
export const BG_COLORS    = ["#A7C7E7","#FFB3C6","#B5EAD7","#FFDAC1","#C9B1FF","#FFF3B0","#D4EAF7","#E8F5E9","#1E1B4B","#2D4739","#7B2D2D","#2C2C2C"];
export const ACCENT_COLORS= ["#F5D27A","#FFD700","#C0C0C0","#B87333","#FF69B4","#3498DB","#2ECC71","#E74C3C","#9B59B6","#FFFFFF","#0A0A0A","#FF6B35"];
export const CLOTH_COLORS = ["#6366F1","#2563EB","#16A34A","#DC2626","#EA580C","#7C3AED","#0891B2","#0F172A","#6B7280","#F59E0B","#EC4899","#F5F5F5"];

/* ══ SVG PART RENDERERS ══════════════════════════════════════════════════════ */

function renderHair(style, color) {
  switch (style) {
    case "bald":      return { back: null, top: null };
    case "buzz":      return {
      back: null,
      top:  <path d="M34,98 Q30,22 100,19 Q170,22 166,98 Q164,80 100,78 Q36,80 34,98 Z" fill={color} />,
    };
    case "short":     return {
      back: null,
      top: (<>
        <path d="M30,103 Q25,18 100,15 Q175,18 170,103 Q166,82 100,80 Q34,82 30,103 Z" fill={color} />
        <path d="M30,103 Q27,114 34,119" stroke={color} strokeWidth="11" fill="none" strokeLinecap="round"/>
        <path d="M170,103 Q173,114 166,119" stroke={color} strokeWidth="11" fill="none" strokeLinecap="round"/>
      </>),
    };
    case "side_part": return {
      back: null,
      top: (<>
        <path d="M30,105 Q24,18 100,15 Q176,18 170,105 Q164,82 100,80 Q36,82 30,105 Z" fill={color} />
        <path d="M30,85 Q52,74 70,80 Q58,68 70,60 Q88,54 100,57 Q94,48 100,42" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"/>
      </>),
    };
    case "medium":    return {
      back: <path d="M34,115 Q26,155 32,182 Q55,194 100,196 Q145,194 168,182 Q174,155 166,115 Q152,133 100,135 Q48,133 34,115 Z" fill={color} />,
      top:  <path d="M28,106 Q22,16 100,12 Q178,16 172,106 Q166,80 100,78 Q34,80 28,106 Z" fill={color} />,
    };
    case "long":      return {
      back: <path d="M34,113 Q12,162 16,206 Q50,218 100,220 Q150,218 184,206 Q188,162 166,113 Q148,138 100,140 Q52,138 34,113 Z" fill={color} />,
      top:  <path d="M28,105 Q20,14 100,10 Q180,14 172,105 Q166,78 100,76 Q34,78 28,105 Z" fill={color} />,
    };
    case "wavy":      return {
      back: <path d="M34,113 Q16,148 18,180 Q26,192 36,196 Q42,180 50,190 Q58,197 66,193 Q68,176 76,188 Q82,197 90,194 Q92,178 100,193 Q108,178 110,194 Q118,197 124,188 Q132,176 136,193 Q142,197 150,190 Q158,180 164,196 Q174,192 182,180 Q184,148 166,113 Q148,138 100,140 Q52,138 34,113 Z" fill={color} />,
      top:  <path d="M28,106 Q20,16 100,12 Q180,16 172,106 Q166,80 100,78 Q34,80 28,106 Z" fill={color} />,
    };
    case "curly":     return {
      back: null,
      top: (<>
        <ellipse cx="100" cy="46" rx="74" ry="44" fill={color} />
        <circle cx="38"  cy="80" r="24" fill={color} />
        <circle cx="162" cy="80" r="24" fill={color} />
        <circle cx="52"  cy="55" r="22" fill={color} />
        <circle cx="148" cy="55" r="22" fill={color} />
        <circle cx="78"  cy="38" r="18" fill={color} />
        <circle cx="122" cy="38" r="18" fill={color} />
      </>),
    };
    case "bun":       return {
      back: null,
      top: (<>
        <path d="M34,100 Q30,30 100,26 Q170,30 166,100 Q164,82 100,80 Q36,82 34,100 Z" fill={color} />
        <circle cx="100" cy="16" r="20" fill={color} />
        <ellipse cx="100" cy="32" rx="14" ry="8" fill={color} />
        <circle cx="100" cy="16" r="12" fill={color} opacity="0.65"/>
      </>),
    };
    case "ponytail":  return {
      back: (<>
        <rect x="85" y="72" width="30" height="106" rx="15" fill={color} />
        <ellipse cx="100" cy="180" rx="15" ry="8" fill={color} opacity="0.75"/>
      </>),
      top: (<>
        <path d="M34,100 Q30,26 100,22 Q170,26 166,100 Q164,82 100,80 Q36,82 34,100 Z" fill={color} />
        <rect x="87" y="78" width="26" height="18" rx="6" fill={color} />
      </>),
    };
    case "afro":      return {
      back: null,
      top: (<>
        <ellipse cx="100" cy="58" rx="80" ry="58" fill={color} />
        <circle cx="28"  cy="92" r="28" fill={color} />
        <circle cx="172" cy="92" r="28" fill={color} />
        <circle cx="42"  cy="60" r="26" fill={color} />
        <circle cx="158" cy="60" r="26" fill={color} />
        <circle cx="100" cy="28" r="22" fill={color} />
      </>),
    };
    case "pixie":     return {
      back: null,
      top: (<>
        <path d="M34,100 Q28,26 100,22 Q172,26 166,100 Q158,80 138,78 Q118,72 100,74 Q52,72 38,80 Q34,100 34,100 Z" fill={color} />
        <path d="M34,100 Q28,112 34,120" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round"/>
      </>),
    };
    case "braids":    return {
      back: (<>
        <rect x="78" y="76" width="14" height="108" rx="7" fill={color} />
        <rect x="108" y="76" width="14" height="108" rx="7" fill={color} />
        {[0,1,2,3,4,5,6].map(i => (
          <rect key={i} x="78" y={82+i*14} width="14" height="7" rx="3" fill={color} opacity="0.55"/>
        ))}
        {[0,1,2,3,4,5,6].map(i => (
          <rect key={i+7} x="108" y={82+i*14} width="14" height="7" rx="3" fill={color} opacity="0.55"/>
        ))}
      </>),
      top: (<>
        <path d="M30,103 Q25,18 100,15 Q175,18 170,103 Q166,82 100,80 Q34,82 30,103 Z" fill={color} />
        <ellipse cx="85"  cy="80" rx="8" ry="5" fill={color} />
        <ellipse cx="115" cy="80" rx="8" ry="5" fill={color} />
      </>),
    };
    default: return { back: null, top: null };
  }
}

function renderEye(style, eyeColor, cx, isLeft) {
  const f = isLeft ? 1 : -1;
  switch (style) {
    case "almond": return (<>
      <path d={`M${cx-14},100 Q${cx},91 ${cx+14},100 Q${cx},111 ${cx-14},100 Z`} fill="white" />
      <ellipse cx={cx} cy="101" rx="9" ry="7" fill={eyeColor} />
      <ellipse cx={cx} cy="101" rx="5.5" ry="5.5" fill="#111" />
      <circle cx={cx+f*2} cy="99" r="2" fill="white" />
    </>);
    case "wide": return (<>
      <circle cx={cx} cy="100" r="15" fill="white" />
      <circle cx={cx} cy="101" r="10" fill={eyeColor} />
      <circle cx={cx} cy="101" r="6.5" fill="#111" />
      <circle cx={cx+f*3} cy="98" r="3" fill="white" />
      <circle cx={cx-f*1.5} cy="104" r="1.5" fill="white" />
    </>);
    case "narrow": return (<>
      <path d={`M${cx-14},100 Q${cx},95 ${cx+14},100 Q${cx},106 ${cx-14},100 Z`} fill="white"/>
      <ellipse cx={cx} cy="100" rx="8" ry="5" fill={eyeColor} />
      <ellipse cx={cx} cy="100" rx="5" ry="4" fill="#111" />
      <circle cx={cx+f*2} cy="99" r="1.5" fill="white" />
    </>);
    case "closed": return (<>
      <path d={`M${cx-13},100 Q${cx},110 ${cx+13},100`} stroke="#444" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={`M${cx-13},100 Q${cx},95  ${cx+13},100`} stroke="#ccc" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>);
    case "stars": return (<>
      <circle cx={cx} cy="100" r="13" fill="white" />
      <text x={cx} y="105" textAnchor="middle" fontSize="16" fill={eyeColor}>✦</text>
    </>);
    case "sleepy": return (<>
      <path d={`M${cx-13},103 Q${cx},95 ${cx+13},103 Q${cx+13},108 ${cx},110 Q${cx-13},108 ${cx-13},103 Z`} fill="white"/>
      <ellipse cx={cx} cy="106" rx="6" ry="4.5" fill={eyeColor} />
      <ellipse cx={cx} cy="106" rx="4" ry="3.5" fill="#111" />
      <path d={`M${cx-13},103 Q${cx},97 ${cx+13},103`} stroke="#888" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>);
    case "round":
    default: return (<>
      <circle cx={cx} cy="100" r="13" fill="white" />
      <circle cx={cx} cy="101" r="8.5" fill={eyeColor} />
      <circle cx={cx} cy="101" r="5.5" fill="#111" />
      <circle cx={cx+f*2.5} cy="98" r="2.5" fill="white" />
      <circle cx={cx+f*4.5} cy="104" r="1.5" fill="white" />
    </>);
  }
}

function renderBrow(style, color, cx) {
  switch (style) {
    case "arched":  return <path d={`M${cx-13},89 Q${cx-2},79 ${cx+13},88`} stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case "thick":   return <path d={`M${cx-13},88 Q${cx},81 ${cx+13},88`} stroke={color} strokeWidth="6.5" fill="none" strokeLinecap="round" />;
    case "thin":    return <path d={`M${cx-12},88 Q${cx},83 ${cx+12},88`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />;
    case "bushy":   return (<>
      <path d={`M${cx-13},88 Q${cx},80 ${cx+13},88`} stroke={color} strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d={`M${cx-10},86 Q${cx+2},83 ${cx+12},87`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
    </>);
    case "raised":  return <path d={`M${cx-13},85 Q${cx},76 ${cx+13},84`} stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
    case "worried": return (<>
      <path d={`M${cx-12},86 Q${cx},82 ${cx+12},88`} stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>);
    case "natural":
    default:        return <path d={`M${cx-12},88 Q${cx},81 ${cx+12},87`} stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
}

function renderNose(style, skin) {
  switch (style) {
    case "rounded": return <path d="M96,112 Q92,120 94,125 Q100,128 106,125 Q108,120 104,112" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" fill={skin+"44"} strokeLinecap="round" />;
    case "pointed": return <path d="M100,108 L94,124 Q100,127 106,124 Z" stroke="rgba(0,0,0,0.10)" strokeWidth="1" fill={skin+"33"} />;
    case "broad":   return (<>
      <ellipse cx="100" cy="120" rx="13" ry="8" fill={skin+"22"} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
      <circle cx="90" cy="119" r="5" fill={skin+"77"} />
      <circle cx="110" cy="119" r="5" fill={skin+"77"} />
    </>);
    case "none":    return null;
    case "button":
    default:        return (<>
      <circle cx="93" cy="120" r="4" fill={skin+"99"} />
      <circle cx="107" cy="120" r="4" fill={skin+"99"} />
      <path d="M93,120 Q100,125 107,120" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>);
  }
}

function renderMouth(style) {
  switch (style) {
    case "grin": return (<>
      <path d="M81,135 Q100,153 119,135 Q100,160 81,135 Z" fill="#E74C3C" />
      <path d="M81,135 Q100,152 119,135" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="87" y="136" width="26" height="7" rx="2.5" fill="white" />
      <rect x="87" y="148" width="26" height="6"   rx="2.5" fill="#C0392B" />
    </>);
    case "smirk": return (
      <path d="M88,138 Q96,142 118,135" stroke="#B03A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
    );
    case "open": return (<>
      <path d="M83,133 Q100,147 117,133 Q117,152 100,155 Q83,152 83,133 Z" fill="#E74C3C" />
      <path d="M83,133 Q100,146 117,133" stroke="#333" strokeWidth="2" fill="none"/>
      <ellipse cx="100" cy="150" rx="11" ry="7" fill="#C0392B" />
      <rect x="87" y="133" width="26" height="6" rx="2" fill="white" />
      <rect x="87" y="147" width="26" height="6" rx="2" fill="white" />
    </>);
    case "laugh": return (<>
      <path d="M79,132 Q100,157 121,132 Q100,164 79,132 Z" fill="#E74C3C" />
      <path d="M79,132 Q100,153 121,132" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="100" cy="152" rx="14" ry="9" fill="#C0392B" />
      <rect x="84" y="133" width="32" height="7" rx="3" fill="white" />
    </>);
    case "neutral": return (
      <path d="M84,138 L116,138" stroke="#B03A2E" strokeWidth="3" strokeLinecap="round" />
    );
    case "sad": return (
      <path d="M84,146 Q100,136 116,146" stroke="#B03A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
    );
    case "tongue": return (<>
      <path d="M83,135 Q100,150 117,135 Q100,157 83,135 Z" fill="#E74C3C" />
      <path d="M83,135 Q100,149 117,135" stroke="#333" strokeWidth="2" fill="none"/>
      <rect x="87" y="136" width="26" height="6" rx="2" fill="white" />
      <ellipse cx="100" cy="152" rx="9" ry="7" fill="#FF69B4" />
      <path d="M100,148 L100,158" stroke="#E91E63" strokeWidth="1.5" strokeLinecap="round" />
    </>);
    case "surprised": return (<>
      <ellipse cx="100" cy="142" rx="10" ry="12" fill="#E74C3C" />
      <ellipse cx="100" cy="142" rx="7" ry="9" fill="#C0392B" />
    </>);
    case "smile":
    default: return (
      <path d="M83,136 Q100,151 117,136" stroke="#B03A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
    );
  }
}

function renderFacialHair(style, color) {
  switch (style) {
    case "stubble": return (<>
      {[80,87,94,100,106,113,120].map((x,i) => (
        <circle key={i}   cx={x} cy={112+Math.abs(i-3)*2} r="1.8" fill={color+"99"} />
      ))}
      {[84,90,96,103,110,116].map((x,i) => (
        <circle key={i+7} cx={x} cy={120+Math.abs(i-2.5)*1.5} r="1.5" fill={color+"88"} />
      ))}
      {[88,93,100,107,112].map((x,i) => (
        <circle key={i+13} cx={x} cy={128} r="1.5" fill={color+"77"} />
      ))}
    </>);
    case "mustache": return (
      <path d="M83,130 Q92,125 100,127 Q108,125 117,130 Q110,136 100,134 Q90,136 83,130 Z" fill={color} />
    );
    case "goatee": return (<>
      <path d="M83,130 Q92,125 100,127 Q108,125 117,130 Q110,136 100,134 Q90,136 83,130 Z" fill={color} />
      <path d="M92,140 Q100,162 108,140 Q100,168 92,140 Z" fill={color} />
    </>);
    case "beard": return (<>
      <path d="M83,129 Q92,124 100,126 Q108,124 117,129 Q110,135 100,133 Q90,135 83,129 Z" fill={color} />
      <path d="M44,142 Q46,130 58,125 Q68,158 68,172 Q84,182 100,182 Q116,182 132,172 Q132,158 142,125 Q154,130 156,142 Q162,172 132,185 Q116,192 100,192 Q84,192 68,185 Q38,172 44,142 Z" fill={color} />
    </>);
    case "full_beard": return (<>
      <path d="M38,122 Q36,132 40,148 Q48,172 68,185 Q84,192 100,192 Q116,192 132,185 Q152,172 160,148 Q164,132 162,122 Q152,132 132,127 Q116,130 100,130 Q84,130 68,127 Q48,132 38,122 Z" fill={color} />
      <path d="M84,127 Q92,123 100,125 Q108,123 116,127 Q110,133 100,131 Q90,133 84,127 Z" fill={color} />
    </>);
    default: return null;
  }
}

function renderGlasses(style) {
  switch (style) {
    case "round": return (<>
      <circle cx="75" cy="100" r="17" stroke="#333" strokeWidth="3" fill="none" />
      <circle cx="125" cy="100" r="17" stroke="#333" strokeWidth="3" fill="none" />
      <line x1="92" y1="100" x2="108" y2="100" stroke="#333" strokeWidth="2.5" />
      <line x1="58" y1="97"  x2="44"  y2="94"  stroke="#333" strokeWidth="2.5" />
      <line x1="142" y1="97" x2="156" y2="94"  stroke="#333" strokeWidth="2.5" />
    </>);
    case "rectangle": return (<>
      <rect x="59" y="90" width="31" height="20" rx="4" stroke="#333" strokeWidth="3" fill="none" />
      <rect x="110" y="90" width="31" height="20" rx="4" stroke="#333" strokeWidth="3" fill="none" />
      <line x1="90" y1="100" x2="110" y2="100" stroke="#333" strokeWidth="2.5" />
      <line x1="59" y1="97"  x2="44"  y2="94"  stroke="#333" strokeWidth="2.5" />
      <line x1="141" y1="97" x2="156" y2="94"  stroke="#333" strokeWidth="2.5" />
    </>);
    case "cat_eye": return (<>
      <path d="M59,97 Q62,88 75,87 Q88,87 93,95 Q92,107 75,109 Q59,107 59,97 Z" stroke="#333" strokeWidth="2.5" fill="none" />
      <path d="M107,95 Q112,87 125,87 Q138,87 141,97 Q141,107 125,109 Q108,107 107,95 Z" stroke="#333" strokeWidth="2.5" fill="none" />
      <line x1="93"  y1="100" x2="107" y2="100" stroke="#333" strokeWidth="2.5" />
      <line x1="59"  y1="96"  x2="44"  y2="93"  stroke="#333" strokeWidth="2.5" />
      <line x1="141" y1="93"  x2="156" y2="96"  stroke="#333" strokeWidth="2.5" />
    </>);
    case "sunglasses": return (<>
      <rect x="58" y="89" width="34" height="22" rx="6" fill="#1a1a1a" opacity="0.92" />
      <rect x="108" y="89" width="34" height="22" rx="6" fill="#1a1a1a" opacity="0.92" />
      <line x1="92"  y1="100" x2="108" y2="100" stroke="#444" strokeWidth="2.5" />
      <line x1="58"  y1="97"  x2="44"  y2="94"  stroke="#444" strokeWidth="2.5" />
      <line x1="142" y1="97"  x2="156" y2="94"  stroke="#444" strokeWidth="2.5" />
    </>);
    default: return null;
  }
}

function renderHat(style, color) {
  switch (style) {
    case "baseball": return (<>
      <path d="M28,52 Q28,16 100,13 Q172,16 172,52 Z" fill={color} />
      <ellipse cx="100" cy="52" rx="72" ry="17" fill={color} />
      <ellipse cx="148" cy="58" rx="36" ry="10" fill={color} />
      <ellipse cx="100" cy="53" rx="68" ry="14" fill={color+"CC"} />
      <rect x="62" y="42" width="76" height="13" rx="5" fill={color+"99"} />
    </>);
    case "beanie": return (<>
      <path d="M28,94 Q24,28 100,22 Q176,28 172,94 Q160,72 100,70 Q40,72 28,94 Z" fill={color} />
      <rect x="26" y="84" width="148" height="18" rx="9" fill={color+"DD"} />
      <circle cx="100" cy="22" r="13" fill={color+"AA"} />
      {[35,55,75,95,115,135,155].map(x => (
        <line key={x} x1={x} y1="84" x2={x} y2="102" stroke="rgba(0,0,0,0.10)" strokeWidth="1.5"/>
      ))}
    </>);
    case "crown": return (<>
      <path d="M35,82 L50,46 L70,70 L100,36 L130,70 L150,46 L165,82 Z" fill="#F5D27A" />
      <rect x="33" y="80" width="134" height="18" rx="5" fill="#F5D27A" />
      <circle cx="100" cy="36" r="9" fill="#E74C3C" />
      <circle cx="52"  cy="50" r="7" fill="#3498DB" />
      <circle cx="148" cy="50" r="7" fill="#2ECC71" />
      <line x1="33" y1="80" x2="167" y2="80" stroke="#D4AC0D" strokeWidth="3" />
    </>);
    case "bow": return (<>
      <path d="M74,38 Q66,24 78,26 Q88,34 100,38 Q112,34 122,26 Q134,24 126,38 Q112,46 100,43 Q88,46 74,38 Z" fill={color} />
      <ellipse cx="100" cy="38" rx="8" ry="6" fill={color+"CC"} />
    </>);
    case "party": return (<>
      <path d="M100,4 L72,80 Q86,74 100,72 Q114,74 128,80 Z" fill={color} />
      <path d="M72,80 Q86,74 100,72 Q114,74 128,80 Q116,76 100,74 Q84,76 72,80 Z" fill="white" opacity="0.25"/>
      <circle cx="100" cy="5" r="6" fill="white" />
      {[[84,50],[94,30],[110,45],[106,62],[90,65]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="3" fill="white" opacity="0.6"/>
      ))}
    </>);
    default: return null;
  }
}

function renderEarrings(style, color) {
  switch (style) {
    case "studs":   return (<>
      <circle cx="34" cy="112" r="5.5" fill={color} />
      <circle cx="166" cy="112" r="5.5" fill={color} />
    </>);
    case "hoops":   return (<>
      <circle cx="34" cy="120" r="9" stroke={color} strokeWidth="3.5" fill="none" />
      <circle cx="166" cy="120" r="9" stroke={color} strokeWidth="3.5" fill="none" />
    </>);
    case "dangles": return (<>
      <circle cx="34" cy="111" r="4.5" fill={color} />
      <line x1="34" y1="115.5" x2="34" y2="130" stroke={color} strokeWidth="2" />
      <ellipse cx="34" cy="133" rx="5.5" ry="4" fill={color} />
      <circle cx="166" cy="111" r="4.5" fill={color} />
      <line x1="166" y1="115.5" x2="166" y2="130" stroke={color} strokeWidth="2" />
      <ellipse cx="166" cy="133" rx="5.5" ry="4" fill={color} />
    </>);
    default: return null;
  }
}

function renderClothing(style, color) {
  switch (style) {
    case "vneck": return (<>
      <path d="M18,202 Q12,180 24,164 Q38,154 64,149 Q82,172 100,174 Q118,172 136,149 Q162,154 176,164 Q188,180 182,202 Z" fill={color} />
      <path d="M82,164 L100,182 L118,164" stroke={color} strokeWidth="3" fill="none" opacity="0.4"/>
    </>);
    case "tshirt": return (<>
      <path d="M12,202 Q8,178 20,162 Q34,150 58,146 Q52,154 64,158 Q80,166 100,168 Q120,166 136,158 Q148,154 142,146 Q166,150 180,162 Q192,178 188,202 Z" fill={color} />
      <path d="M20,162 Q28,154 58,146 L52,154 L64,158 Z" fill={color+"BB"} />
      <path d="M180,162 Q172,154 142,146 L148,154 L136,158 Z" fill={color+"BB"} />
    </>);
    case "hoodie": return (<>
      <path d="M16,202 Q10,178 22,162 Q36,150 62,146 Q72,158 100,160 Q128,158 138,146 Q164,150 178,162 Q190,178 184,202 Z" fill={color} />
      <path d="M62,146 Q72,155 100,157 Q128,155 138,146 Q130,140 100,138 Q70,140 62,146 Z" fill={color+"BB"} />
      <path d="M88,157 Q94,170 100,175 Q106,170 112,157" stroke={color+"88"} strokeWidth="2" fill="none"/>
    </>);
    case "crew":
    default: return (<>
      <path d="M18,202 Q12,180 24,164 Q38,154 64,149 Q74,160 100,162 Q126,160 136,149 Q162,154 176,164 Q188,180 182,202 Z" fill={color} />
      <path d="M64,149 Q74,158 100,160 Q126,158 136,149 Q126,140 100,138 Q74,140 64,149 Z" fill={color+"CC"} />
    </>);
  }
}

/* ══ MOJI AVATAR COMPONENT ═══════════════════════════════════════════════════ */

export function MojiAvatar({ moji = {}, size = 80, className = "" }) {
  const m    = { ...DEFAULT_MOJI, ...moji };
  const cId  = useRef(`mc-${Math.random().toString(36).slice(2,9)}`).current;
  const brow = m.browColor || m.hairColor;
  const fh   = m.facialHairColor || m.hairColor;
  const hair = renderHair(m.hairStyle, m.hairColor);

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} style={{ display:"block", flexShrink:0 }}>
      <defs>
        <clipPath id={cId}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cId})`}>
        {/* BG */}
        <circle cx="100" cy="100" r="100" fill={m.bg} />

        {/* Clothing */}
        {renderClothing(m.clothing, m.clothingColor)}

        {/* Neck */}
        <rect x="82" y="172" width="36" height="30" rx="13" fill={m.skin} />

        {/* Ears */}
        <ellipse cx="34"  cy="113" rx="13" ry="16" fill={m.skin} />
        <ellipse cx="166" cy="113" rx="13" ry="16" fill={m.skin} />
        <ellipse cx="34"  cy="113" rx="7"  ry="10" fill="rgba(0,0,0,0.06)" />
        <ellipse cx="166" cy="113" rx="7"  ry="10" fill="rgba(0,0,0,0.06)" />

        {/* Earrings */}
        {renderEarrings(m.earrings, m.earringColor)}

        {/* Hair back */}
        {hair.back}

        {/* Face */}
        <ellipse cx="100" cy="108" rx="66" ry="72" fill={m.skin} />

        {/* Blush */}
        <ellipse cx="68"  cy="125" rx="15" ry="9" fill="rgba(255,140,140,0.20)" />
        <ellipse cx="132" cy="125" rx="15" ry="9" fill="rgba(255,140,140,0.20)" />

        {/* Hair front */}
        {hair.top}

        {/* Eyebrows */}
        {renderBrow(m.browStyle, brow, 75)}
        {renderBrow(m.browStyle, brow, 125)}

        {/* Eyes */}
        {renderEye(m.eyeStyle, m.eyeColor, 75,  true)}
        {renderEye(m.eyeStyle, m.eyeColor, 125, false)}

        {/* Nose */}
        {renderNose(m.noseStyle, m.skin)}

        {/* Freckles */}
        {m.freckles && (<>
          <circle cx="76"  cy="116" r="2.2" fill="#C47A2D" opacity="0.45" />
          <circle cx="84"  cy="119" r="1.8" fill="#C47A2D" opacity="0.45" />
          <circle cx="70"  cy="119" r="1.8" fill="#C47A2D" opacity="0.45" />
          <circle cx="124" cy="116" r="2.2" fill="#C47A2D" opacity="0.45" />
          <circle cx="116" cy="119" r="1.8" fill="#C47A2D" opacity="0.45" />
          <circle cx="130" cy="119" r="1.8" fill="#C47A2D" opacity="0.45" />
          <circle cx="97"  cy="118" r="1.8" fill="#C47A2D" opacity="0.45" />
          <circle cx="103" cy="118" r="1.8" fill="#C47A2D" opacity="0.45" />
        </>)}

        {/* Facial hair */}
        {renderFacialHair(m.facialHair, fh)}

        {/* Mouth */}
        {renderMouth(m.mouthStyle)}

        {/* Dimples */}
        {m.dimples && (<>
          <circle cx="78"  cy="142" r="3.5" fill="rgba(0,0,0,0.08)" />
          <circle cx="122" cy="142" r="3.5" fill="rgba(0,0,0,0.08)" />
        </>)}

        {/* Glasses */}
        {renderGlasses(m.glasses)}

        {/* Hat */}
        {renderHat(m.hat, m.hatColor)}
      </g>
    </svg>
  );
}

/* ══ CREATOR SUB-COMPONENTS ══════════════════════════════════════════════════ */

function ColorRow({ colors, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(c => (
        <button
          key={c} type="button" onClick={() => onChange(c)}
          className="w-8 h-8 rounded-full transition-all flex-shrink-0"
          style={{
            background: c,
            outline: value === c ? "3px solid #6366F1" : "3px solid transparent",
            outlineOffset: "2px",
            border: c === "#FFFFFF" || c === "#FFFACD" ? "1px solid #E5E7EB" : "none",
          }}
        />
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full relative transition-all cursor-pointer flex-shrink-0"
        style={{ background: value ? "#6366F1" : "#E5E7EB" }}
      >
        <span
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        />
      </div>
    </div>
  );
}

function OptionGrid({ options, value, onChange, cols = 3 }) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(opt => (
        <button
          key={opt.id} type="button" onClick={() => onChange(opt.id)}
          className={`py-2 px-1 rounded-xl border-2 text-center transition-all ${value === opt.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
        >
          <div className="text-lg leading-none mb-0.5">{opt.icon}</div>
          <div className="text-xs font-medium text-gray-600 leading-tight">{opt.label}</div>
        </button>
      ))}
    </div>
  );
}

const SECTIONS = [
  { id:"skin",     icon:"🫶", label:"Skin"     },
  { id:"hair",     icon:"💇", label:"Hair"     },
  { id:"eyes",     icon:"👁️",  label:"Eyes"     },
  { id:"brows",    icon:"〰️",  label:"Brows"    },
  { id:"nose",     icon:"👃", label:"Nose"     },
  { id:"mouth",    icon:"👄", label:"Mouth"    },
  { id:"facial",   icon:"🧔", label:"Facial"   },
  { id:"glasses",  icon:"👓", label:"Glasses"  },
  { id:"hat",      icon:"🎩", label:"Hat"      },
  { id:"earrings", icon:"💎", label:"Ears"     },
  { id:"clothing", icon:"👕", label:"Outfit"   },
  { id:"extras",   icon:"✨", label:"Extras"   },
];

/* ══ MOJI CREATOR COMPONENT ══════════════════════════════════════════════════ */

export function MojiCreator({ moji = {}, onChange, compact = false }) {
  const [section, setSection] = useState("skin");
  const m   = { ...DEFAULT_MOJI, ...moji };
  const set = (k, v) => onChange({ ...m, [k]: v });

  const panel = () => {
    switch (section) {
      case "skin": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Skin Tone</p>
            <ColorRow colors={SKIN_TONES} value={m.skin} onChange={v => set("skin", v)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Background</p>
            <ColorRow colors={BG_COLORS} value={m.bg} onChange={v => set("bg", v)} />
          </div>
        </div>
      );
      case "hair": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={3} value={m.hairStyle} onChange={v => set("hairStyle", v)} options={[
              {id:"bald",      icon:"🔵", label:"Bald"},
              {id:"buzz",      icon:"✂️",  label:"Buzz"},
              {id:"short",     icon:"💈", label:"Short"},
              {id:"side_part", icon:"📏", label:"Side Part"},
              {id:"medium",    icon:"〰", label:"Medium"},
              {id:"long",      icon:"📏", label:"Long"},
              {id:"wavy",      icon:"〜", label:"Wavy"},
              {id:"curly",     icon:"🌀", label:"Curly"},
              {id:"bun",       icon:"🎀", label:"Bun"},
              {id:"ponytail",  icon:"🐴", label:"Ponytail"},
              {id:"afro",      icon:"☁️",  label:"Afro"},
              {id:"pixie",     icon:"🧚", label:"Pixie"},
              {id:"braids",    icon:"🎗️",  label:"Braids"},
            ]} />
          </div>
          {m.hairStyle !== "bald" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
              <ColorRow colors={HAIR_COLORS} value={m.hairColor} onChange={v => set("hairColor", v)} />
            </div>
          )}
        </div>
      );
      case "eyes": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={3} value={m.eyeStyle} onChange={v => set("eyeStyle", v)} options={[
              {id:"round",   icon:"⭕", label:"Round"},
              {id:"almond",  icon:"🥚", label:"Almond"},
              {id:"wide",    icon:"😳", label:"Wide"},
              {id:"narrow",  icon:"😑", label:"Narrow"},
              {id:"closed",  icon:"😊", label:"Happy"},
              {id:"sleepy",  icon:"😴", label:"Sleepy"},
              {id:"stars",   icon:"🤩", label:"Stars"},
            ]} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
            <ColorRow colors={EYE_COLORS} value={m.eyeColor} onChange={v => set("eyeColor", v)} />
          </div>
        </div>
      );
      case "brows": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={3} value={m.browStyle} onChange={v => set("browStyle", v)} options={[
              {id:"natural", icon:"〰️", label:"Natural"},
              {id:"arched",  icon:"⌒",  label:"Arched"},
              {id:"thick",   icon:"━━", label:"Thick"},
              {id:"thin",    icon:"——", label:"Thin"},
              {id:"bushy",   icon:"〰〰",label:"Bushy"},
              {id:"raised",  icon:"↑〰",label:"Raised"},
              {id:"worried", icon:"↗〰",label:"Worried"},
            ]} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
            <ColorRow colors={HAIR_COLORS} value={m.browColor || m.hairColor} onChange={v => set("browColor", v)} />
          </div>
        </div>
      );
      case "nose": return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
          <OptionGrid cols={3} value={m.noseStyle} onChange={v => set("noseStyle", v)} options={[
            {id:"button",  icon:"👃", label:"Button"},
            {id:"rounded", icon:"🔵", label:"Rounded"},
            {id:"pointed", icon:"🔻", label:"Pointed"},
            {id:"broad",   icon:"⬛", label:"Broad"},
            {id:"none",    icon:"—",  label:"None"},
          ]} />
        </div>
      );
      case "mouth": return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
          <OptionGrid cols={4} value={m.mouthStyle} onChange={v => set("mouthStyle", v)} options={[
            {id:"smile",     icon:"🙂", label:"Smile"},
            {id:"grin",      icon:"😁", label:"Grin"},
            {id:"smirk",     icon:"😏", label:"Smirk"},
            {id:"open",      icon:"😮", label:"Open"},
            {id:"laugh",     icon:"😂", label:"Laugh"},
            {id:"neutral",   icon:"😐", label:"Neutral"},
            {id:"sad",       icon:"🙁", label:"Sad"},
            {id:"tongue",    icon:"😛", label:"Tongue"},
            {id:"surprised", icon:"😲", label:"Surprised"},
          ]} />
        </div>
      );
      case "facial": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={3} value={m.facialHair} onChange={v => set("facialHair", v)} options={[
              {id:"none",       icon:"🚫", label:"None"},
              {id:"stubble",    icon:"···", label:"Stubble"},
              {id:"mustache",   icon:"🥸",  label:"Mustache"},
              {id:"goatee",     icon:"🐐",  label:"Goatee"},
              {id:"beard",      icon:"🧔",  label:"Beard"},
              {id:"full_beard", icon:"🧔‍♂️", label:"Full"},
            ]} />
          </div>
          {m.facialHair !== "none" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
              <ColorRow colors={HAIR_COLORS} value={m.facialHairColor || m.hairColor} onChange={v => set("facialHairColor", v)} />
            </div>
          )}
        </div>
      );
      case "glasses": return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
          <OptionGrid cols={3} value={m.glasses} onChange={v => set("glasses", v)} options={[
            {id:"none",        icon:"🚫", label:"None"},
            {id:"round",       icon:"🕶",  label:"Round"},
            {id:"rectangle",   icon:"👓", label:"Rectangle"},
            {id:"cat_eye",     icon:"😺", label:"Cat Eye"},
            {id:"sunglasses",  icon:"🕶",  label:"Shades"},
          ]} />
        </div>
      );
      case "hat": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={3} value={m.hat} onChange={v => set("hat", v)} options={[
              {id:"none",     icon:"🚫", label:"None"},
              {id:"baseball", icon:"🧢", label:"Cap"},
              {id:"beanie",   icon:"🎿", label:"Beanie"},
              {id:"crown",    icon:"👑", label:"Crown"},
              {id:"bow",      icon:"🎀", label:"Bow"},
              {id:"party",    icon:"🎉", label:"Party"},
            ]} />
          </div>
          {m.hat !== "none" && m.hat !== "crown" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
              <ColorRow colors={CLOTH_COLORS} value={m.hatColor} onChange={v => set("hatColor", v)} />
            </div>
          )}
        </div>
      );
      case "earrings": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={4} value={m.earrings} onChange={v => set("earrings", v)} options={[
              {id:"none",    icon:"🚫", label:"None"},
              {id:"studs",   icon:"⭕", label:"Studs"},
              {id:"hoops",   icon:"💍", label:"Hoops"},
              {id:"dangles", icon:"💎", label:"Dangles"},
            ]} />
          </div>
          {m.earrings !== "none" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
              <ColorRow colors={ACCENT_COLORS} value={m.earringColor} onChange={v => set("earringColor", v)} />
            </div>
          )}
        </div>
      );
      case "clothing": return (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Style</p>
            <OptionGrid cols={4} value={m.clothing} onChange={v => set("clothing", v)} options={[
              {id:"crew",   icon:"👕", label:"Crew"},
              {id:"vneck",  icon:"🔽", label:"V-Neck"},
              {id:"tshirt", icon:"👕", label:"T-Shirt"},
              {id:"hoodie", icon:"🧥", label:"Hoodie"},
            ]} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Color</p>
            <ColorRow colors={CLOTH_COLORS} value={m.clothingColor} onChange={v => set("clothingColor", v)} />
          </div>
        </div>
      );
      case "extras": return (
        <div className="space-y-3">
          <Toggle value={m.freckles} onChange={v => set("freckles", v)} label="Freckles" hint="Dots across nose & cheeks" />
          <Toggle value={m.dimples}  onChange={v => set("dimples",  v)} label="Dimples"  hint="Subtle cheek dimples" />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className={compact ? "" : "bg-white rounded-3xl shadow-xl overflow-hidden"}>
      {/* Live preview */}
      <div className="flex items-center justify-center py-6"
        style={{ background: "linear-gradient(160deg,#EEF2FF 0%,#F8F7FF 100%)" }}>
        <div style={{ borderRadius:"50%", boxShadow:"0 0 0 4px rgba(99,102,241,0.18), 0 8px 32px rgba(0,0,0,0.12)" }}>
          <MojiAvatar moji={m} size={compact ? 120 : 160} />
        </div>
      </div>

      {/* Category tabs — horizontally scrollable */}
      <div className="overflow-x-auto border-b border-gray-100">
        <div className="flex gap-0.5 px-2 pt-2 pb-0 min-w-max">
          {SECTIONS.map(s => (
            <button
              key={s.id} type="button" onClick={() => setSection(s.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-t-xl transition-all flex-shrink-0 border-b-2 ${
                section === s.id
                  ? "bg-indigo-50 text-indigo-700 border-indigo-500"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent"
              }`}
            >
              <span className="text-lg leading-none">{s.icon}</span>
              <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className={`p-4 overflow-y-auto ${compact ? "max-h-52" : "max-h-72"}`}>
        {panel()}
      </div>
    </div>
  );
}
