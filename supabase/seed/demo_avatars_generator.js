// Semi-realistic illustrated couple portraits (SVG -> WebP)
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const W = 800, H = 600;
let uid = 0;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function person(o) {
  const id = "p" + (uid++);
  const { cx, cy, skin, hair, shirt } = o;
  const s = (o.scale ?? 1) * 1.32;
  const tilt = o.tilt ?? 0;
  const dk = shade(skin, -38), dk2 = shade(skin, -60), lt = shade(skin, 22);
  const hairDk = shade(hair, -25), hairLt = shade(hair, 30);
  const lip = o.lip ?? shade(skin, -55);
  const fw = o.female ? 64 : 70; // half face width
  const parts = [];

  parts.push(`<defs>
    <radialGradient id="${id}f" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${lt}"/><stop offset="70%" stop-color="${skin}"/><stop offset="100%" stop-color="${dk}"/>
    </radialGradient>
    <linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${dk2}"/><stop offset="60%" stop-color="${dk}"/>
    </linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${shade(shirt, 18)}"/><stop offset="100%" stop-color="${shade(shirt, -30)}"/>
    </linearGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hairLt}"/><stop offset="50%" stop-color="${hair}"/><stop offset="100%" stop-color="${hairDk}"/>
    </linearGradient>
  </defs>`);

  parts.push(`<g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${s})">`);

  // long hair back layer
  if (o.hairStyle === "long" || o.hairStyle === "wavy") {
    const len = o.hairStyle === "long" ? 230 : 150;
    parts.push(`<path d="M ${-fw - 26} -40 C ${-fw - 40} -150, ${fw + 40} -150, ${fw + 26} -40
      C ${fw + 34} ${len * 0.5}, ${fw + 44} ${len}, ${fw + 10} ${len + 10}
      C ${fw - 20} ${len + 20}, ${-fw + 20} ${len + 20}, ${-fw - 10} ${len + 10}
      C ${-fw - 44} ${len}, ${-fw - 34} ${len * 0.5}, ${-fw - 26} -40 Z" fill="url(#${id}h)"/>`);
  }

  // torso / clothing
  parts.push(`<path d="M -215 ${H} C -212 195, -150 150, -46 132 L 46 132 C 150 150, 212 195, 215 ${H} Z" fill="url(#${id}s)"/>`);
  // neck
  parts.push(`<path d="M -34 60 L -38 142 C -12 164, 12 164, 38 142 L 34 60 Z" fill="url(#${id}n)"/>`);
  // neckline
  if (o.neck === "v") {
    parts.push(`<path d="M -46 132 L 0 205 L 46 132 C 20 150, -20 150, -46 132 Z" fill="${dk}"/>`);
  } else if (o.neck === "collar") {
    parts.push(`<path d="M -48 130 L -8 187 L -30 204 L -68 150 Z" fill="${shade(shirt, 35)}"/>
                <path d="M 48 130 L 8 187 L 30 204 L 68 150 Z" fill="${shade(shirt, 35)}"/>`);
  } else {
    parts.push(`<path d="M -46 132 C -20 160, 20 160, 46 132 L 50 142 C 20 172, -20 172, -50 142 Z" fill="${shade(shirt, -20)}"/>`);
  }
  if (o.dupatta) {
    parts.push(`<path d="M 44 137 C 100 157, 180 222, 210 ${H} L 140 ${H} C 110 272, 80 192, 34 160 Z" fill="${o.dupatta}" opacity="0.9"/>`);
  }

  parts.push(`<path d="M -34 60 C -20 100, 20 100, 34 60 L 34 90 C 15 110, -15 110, -34 90 Z" fill="${dk2}" opacity="0.45"/>`);
  // ears
  parts.push(`<ellipse cx="${-fw}" cy="8" rx="12" ry="22" fill="${dk}"/><ellipse cx="${fw}" cy="8" rx="12" ry="22" fill="${dk}"/>`);
  if (o.earrings) {
    parts.push(`<circle cx="${-fw - 2}" cy="34" r="5" fill="${o.earrings}"/><circle cx="${fw + 2}" cy="34" r="5" fill="${o.earrings}"/>`);
  }

  // face
  const jaw = o.female ? 92 : 100;
  parts.push(`<path d="M ${-fw} -20 C ${-fw - 2} -105, ${fw + 2} -105, ${fw} -20
    C ${fw - 2} 45, ${fw * 0.5} ${jaw - 8}, 0 ${jaw}
    C ${-fw * 0.5} ${jaw - 8}, ${-fw + 2} 45, ${-fw} -20 Z" fill="url(#${id}f)"/>`);

  // beard / stubble
  if (o.beard) {
    const op = o.beard === "full" ? 0.92 : 0.32;
    parts.push(`<path d="M ${-fw + 2} 0 C ${-fw + 4} 50, ${-fw * 0.5} ${jaw + 6}, 0 ${jaw + 8}
      C ${fw * 0.5} ${jaw + 6}, ${fw - 4} 50, ${fw - 2} 0
      C ${fw - 14} 40, 30 50, 24 60 C 10 52, -10 52, -24 60 C -30 50, ${-fw + 14} 40, ${-fw + 2} 0 Z"
      fill="${hair}" opacity="${op}"/>`);
    if (o.beard === "full") {
      parts.push(`<path d="M -26 48 C -12 40, 12 40, 26 48 C 14 50, -14 50, -26 48 Z" fill="${hair}"/>`);
    }
  }

  // cheeks
  parts.push(`<ellipse cx="-38" cy="42" rx="16" ry="9" fill="#e07a6a" opacity="${o.female ? 0.22 : 0.1}"/>
              <ellipse cx="38" cy="42" rx="16" ry="9" fill="#e07a6a" opacity="${o.female ? 0.22 : 0.1}"/>`);

  // eyes
  const eye = (x) => `
    <path d="M ${x - 15} 6 C ${x - 8} -3, ${x + 8} -3, ${x + 15} 6 C ${x + 8} 12, ${x - 8} 12, ${x - 15} 6 Z" fill="#f7f1ea"/>
    <circle cx="${x}" cy="5.5" r="6.5" fill="${o.eye ?? "#3b2416"}"/>
    <circle cx="${x}" cy="5.5" r="3.2" fill="#120a06"/>
    <circle cx="${x + 2}" cy="3.5" r="1.6" fill="#fff"/>
    <path d="M ${x - 16} 5 C ${x - 8} -5, ${x + 8} -5, ${x + 16} 5" stroke="#1e130c" stroke-width="${o.female ? 3 : 2.2}" fill="none" stroke-linecap="round"/>
    <path d="M ${x - 12} 13 C ${x - 5} 16, ${x + 5} 16, ${x + 12} 13" stroke="${dk2}" stroke-width="1" fill="none" opacity="0.5"/>`;
  parts.push(eye(-27) + eye(27));

  // brows
  const bw = o.female ? 3.5 : 6;
  parts.push(`<path d="M -45 -17 C -35 -25, -20 -25, -10 -19" stroke="${hairDk}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>
              <path d="M 45 -17 C 35 -25, 20 -25, 10 -19" stroke="${hairDk}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`);

  // nose
  parts.push(`<path d="M -3 8 C -5 22, -9 32, -11 38 C -6 45, 6 45, 11 38" stroke="${dk2}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.75"/>
              <ellipse cx="-6" cy="40" rx="3" ry="2" fill="${dk2}" opacity="0.6"/><ellipse cx="6" cy="40" rx="3" ry="2" fill="${dk2}" opacity="0.6"/>
              <path d="M 2 0 C 4 15, 4 26, 5 34" stroke="${lt}" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round"/>`);

  // mouth (smile)
  if (o.smile === "open") {
    parts.push(`<path d="M -24 58 C -12 76, 12 76, 24 58 C 12 63, -12 63, -24 58 Z" fill="#5a1f1b"/>
                <path d="M -20 59.5 C -10 63.5, 10 63.5, 20 59.5 L 18 64 C 8 66, -8 66, -18 64 Z" fill="#fbf7f2"/>
                <path d="M -24 58 C -12 54, 12 54, 24 58" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  } else {
    parts.push(`<path d="M -20 60 C -10 70, 10 70, 20 60 C 10 64, -10 64, -20 60 Z" fill="${lip}"/>
                <path d="M -20 60 C -8 57, 8 57, 20 60" stroke="${shade(lip, -20)}" stroke-width="1.6" fill="none"/>`);
  }

  if (o.bindi) parts.push(`<circle cx="0" cy="-12" r="3.6" fill="${o.bindi}"/>`);

  // hair front
  const hs = o.hairStyle;
  if (hs === "short" || hs === "side") {
    const part = hs === "side" ? 20 : 0;
    parts.push(`<path d="M ${-fw - 6} 2 C ${-fw - 16} -120, ${fw + 16} -120, ${fw + 6} 2
      C ${fw + 2} -30, ${fw - 6} -50, ${fw - 20} -58
      C ${30 + part} -48, ${-20 + part} -66, ${-fw + 16} -52
      C ${-fw + 4} -42, ${-fw} -20, ${-fw - 6} 2 Z" fill="url(#${id}h)"/>`);
  } else if (hs === "curly") {
    let c = "";
    for (let a = 195; a <= 345; a += 10) {
      const r = (a * Math.PI) / 180;
      c += `<circle cx="${(fw + 2) * Math.cos(r)}" cy="${-34 + 62 * Math.sin(r)}" r="15" fill="url(#${id}h)"/>`;
    }
    parts.push(`<path d="M ${-fw - 4} 0 C ${-fw - 12} -110, ${fw + 12} -110, ${fw + 4} 0 C ${fw} -40, ${-fw} -40, ${-fw - 4} 0 Z" fill="url(#${id}h)"/>` + c);
  } else if (hs === "long" || hs === "wavy" || hs === "bun") {
    parts.push(`<path d="M ${-fw - 8} 30 C ${-fw - 20} -140, ${fw + 20} -140, ${fw + 8} 30
      C ${fw + 2} -10, ${fw - 2} -38, ${fw - 24} -52
      C 20 -60, 0 -66, -10 -56
      C ${-fw + 10} -36, ${-fw - 2} -10, ${-fw - 8} 30 Z" fill="url(#${id}h)"/>`);
    if (hs === "bun") parts.push(`<circle cx="0" cy="-112" r="34" fill="url(#${id}h)"/>`);
  }

  if (o.glasses) {
    parts.push(`<g fill="none" stroke="${o.glasses}" stroke-width="3.5">
      <rect x="-50" y="-10" width="42" height="30" rx="12"/><rect x="8" y="-10" width="42" height="30" rx="12"/>
      <path d="M -8 2 C -3 -2, 3 -2, 8 2"/><path d="M -50 0 L ${-fw} -4"/><path d="M 50 0 L ${fw} -4"/></g>`);
  }

  parts.push(`</g>`);
  return parts.join("\n");
}

function scene(bg1, bg2, a, b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity="0.35"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${person(a)}
  ${person(b)}
</svg>`;
}

const couples = {
  "arjun-kabir": scene("#e9d8c4", "#c9a98a",
    { cx: 285, cy: 230, skin: "#b07a4f", hair: "#1c130e", shirt: "#2f4858", hairStyle: "side", beard: "stubble", smile: "open", neck: "collar", tilt: 4 },
    { cx: 520, cy: 218, skin: "#8d5a36", hair: "#120c08", shirt: "#c8553d", hairStyle: "short", beard: "full", smile: "open", glasses: "#2a1e1a", neck: "round", tilt: -3, scale: 1.04 }),
  "ananya-riya": scene("#dbe4d5", "#9fb59a",
    { cx: 285, cy: 235, skin: "#8a5432", hair: "#150d09", shirt: "#e3b23c", hairStyle: "long", female: true, smile: "open", earrings: "#d4af37", bindi: "#a31d1d", neck: "round", tilt: 5, lip: "#7d3a2e" },
    { cx: 520, cy: 230, skin: "#c08a5c", hair: "#2a1a12", shirt: "#4a6b8a", hairStyle: "bun", female: true, smile: "open", glasses: "#6b4a36", earrings: "#c0c0c0", neck: "v", tilt: -4, lip: "#9a4a3c" }),
  "priya-rahul": scene("#f1dcc8", "#d59a7c",
    { cx: 285, cy: 242, skin: "#c99063", hair: "#1a110c", shirt: "#9c2f4a", hairStyle: "long", female: true, smile: "open", earrings: "#d4af37", bindi: "#b0123a", dupatta: "#e0a43a", neck: "round", tilt: 6, lip: "#8f3b3b" },
    { cx: 520, cy: 220, skin: "#a06a42", hair: "#16100b", shirt: "#f4efe6", hairStyle: "short", beard: "stubble", smile: "open", neck: "collar", tilt: -2, scale: 1.05 }),
  "meera-siddharth": scene("#d9dff0", "#a3aed6",
    { cx: 285, cy: 238, skin: "#b9805a", hair: "#2b1a12", shirt: "#3d405b", hairStyle: "wavy", female: true, smile: "open", earrings: "#e8e2d4", neck: "round", tilt: 5, lip: "#94463b" },
    { cx: 520, cy: 222, skin: "#9a6440", hair: "#110b07", shirt: "#5f8466", hairStyle: "curly", beard: "stubble", smile: "open", neck: "round", tilt: -3, scale: 1.03 }),
};

(async () => {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  for (const [name, svg] of Object.entries(couples)) {
    fs.writeFileSync(path.join(out, name + ".svg"), svg);
    await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(path.join(out, name + ".webp"));
    await sharp(Buffer.from(svg)).png().toFile(path.join(out, name + ".png"));
  }
  console.log("done");
})();
