/* ==========================================================================
   YUL FC · générateur PDF minimal (sans dépendance)
   Polices TrueType intégrées (Anton, Inter), encodage WinAnsi, images JPEG.
   Sert à produire la copie signée des contrats, côté serveur, au moment de la signature.
   ========================================================================== */

/* Largeurs (1/1000 em) des caractères WinAnsi 32 à 255, extraites des polices du site */
export const METRICS = {"anton":{"w":[234,229,429,546,462,1057,520,214,291,291,452,355,236,311,229,405,494,331,494,494,494,494,494,494,494,494,242,245,321,311,321,492,864,485,479,474,493,412,399,485,499,227,466,472,397,746,498,486,472,494,477,461,396,474,469,712,484,446,410,318,405,318,474,365,317,483,501,491,498,488,280,504,505,243,263,491,248,758,499,497,501,498,347,475,305,499,461,696,459,461,386,340,216,340,493,0,525,0,236,0,467,708,0,0,474,0,0,296,649,0,0,0,0,235,232,464,463,352,311,563,496,925,0,296,739,0,0,0,234,227,481,474,488,463,222,449,477,675,392,578,404,293,675,356,389,358,307,309,317,490,498,234,281,212,397,578,814,726,854,493,485,485,485,485,485,485,640,474,412,412,412,412,227,227,227,227,493,498,486,486,486,486,486,347,486,474,474,474,474,446,462,492,483,483,483,483,483,483,731,491,488,488,488,488,235,235,235,235,503,499,497,497,497,497,497,334,497,499,499,499,499,461,492,461],"asc":1176,"desc":-329,"bbox":[-302,-326,1459,1403],"capH":859,"ps":"Anton-Regular"},"inter":{"w":[267,304,494,639,646,993,653,313,369,369,521,667,303,462,303,370,646,415,616,627,656,603,630,571,629,630,303,315,667,667,667,527,982,709,657,733,722,603,589,748,745,272,575,688,565,913,756,767,642,769,648,646,653,740,709,1003,701,696,641,369,370,369,477,463,337,568,618,577,618,587,379,620,602,252,252,559,252,888,602,604,618,618,387,539,340,602,575,829,557,575,559,440,346,440,667,0,672,0,257,0,451,910,0,0,429,0,0,400,1009,0,0,0,0,277,277,474,471,533,500,1000,504,621,0,400,996,0,0,0,267,304,577,620,737,557,293,568,602,914,457,608,667,0,665,465,457,667,448,455,337,600,601,303,300,314,485,608,817,858,895,527,709,709,709,709,709,709,1003,733,603,603,603,603,272,272,272,272,743,756,767,767,767,767,767,667,767,740,740,740,740,696,647,630,568,568,568,568,568,568,915,577,587,587,587,587,252,252,252,252,588,602,604,604,604,604,604,667,604,602,602,602,602,575,618,575],"asc":969,"desc":-241,"bbox":[-195,-234,2583,1105],"capH":728,"ps":"Inter-Medium"},"interb":{"w":[219,358,586,655,660,1029,683,354,382,382,583,686,353,471,353,400,692,441,638,657,688,634,662,588,664,662,353,360,686,686,686,579,1036,770,665,744,723,610,585,752,749,286,590,738,565,943,766,773,652,782,662,660,677,727,770,1059,761,752,679,382,400,382,493,484,382,588,638,595,638,601,410,639,635,283,283,593,283,927,635,619,638,638,420,573,382,635,615,863,594,618,581,486,388,486,686,0,692,0,308,0,546,1058,0,0,479,0,0,450,1023,0,0,0,0,331,331,581,569,438,500,1000,501,652,0,450,983,0,0,0,219,358,595,650,776,579,367,568,635,914,468,691,686,0,661,423,461,686,467,482,382,646,597,353,403,345,493,691,863,895,935,579,770,770,770,770,770,770,1035,744,610,610,610,610,286,286,286,286,770,766,773,773,773,773,773,686,773,727,727,727,727,752,683,674,588,588,588,588,588,588,907,595,601,601,601,601,283,283,283,283,606,635,619,619,619,619,619,686,619,635,635,635,635,618,638,618],"asc":969,"desc":-241,"bbox":[-195,-234,2583,1114],"capH":728,"ps":"Inter-ExtraBold"}};

/* ---------- encodage WinAnsi (cp1252) ---------- */
const CP1252 = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
  0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94,
  0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
const SUBST = { 0x202F: 0x20, 0x00A0: 0x20, 0x2009: 0x20, 0x2011: 0x2D, 0x2212: 0x2D };
function code(ch){
  const c = ch.codePointAt(0);
  if(c >= 0x20 && c < 0x7F) return c;
  if(c >= 0xA0 && c <= 0xFF) return c === 0xAD ? 0x2D : c;
  if(CP1252[c]) return CP1252[c];
  if(SUBST[c]) return SUBST[c];
  return 0x3F; // ?
}
const codes = s => [...String(s)].map(code);
export function width(s, font, size){
  const w = METRICS[font].w;
  return codes(s).reduce((t, c) => t + (w[c - 32] || 0), 0) * size / 1000;
}
function pdfStr(s){
  let out = '(';
  for(const c of codes(s)){
    if(c === 0x28 || c === 0x29 || c === 0x5C) out += '\\' + String.fromCharCode(c);
    else if(c < 0x20 || c > 0x7E) out += '\\' + c.toString(8).padStart(3, '0');
    else out += String.fromCharCode(c);
  }
  return out + ')';
}
/* Coupe un texte en lignes de largeur maximale */
export function wrap(s, font, size, maxW){
  const words = String(s).split(/\s+/).filter(Boolean);
  const lines = []; let cur = '';
  for(const w of words){
    const t = cur ? cur + ' ' + w : w;
    if(width(t, font, size) <= maxW || !cur){ cur = t; }
    else { lines.push(cur); cur = w; }
  }
  if(cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/* ---------- JPEG : dimensions et composantes ---------- */
export function jpegInfo(b){
  if(!b || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while(i < b.length){
    if(b[i] !== 0xFF){ i++; continue; }
    const m = b[i + 1];
    if(m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC){
      return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8], comps: b[i + 9] };
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    i += 2 + len;
  }
  return null;
}

/* ---------- assemblage du fichier ---------- */
const te = new TextEncoder();
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(x => +x.toFixed(3)).join(' '); };

export class Doc {
  constructor(){ this.W = 612; this.H = 792; this.pages = []; this.images = {}; this.page(); }
  page(){ this.cur = []; this.pages.push(this.cur); return this.cur; }
  fill(hex){ this.cur.push(rgb(hex) + ' rg'); }
  rect(x, y, w, h, hex){ this.cur.push(`${rgb(hex)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); }
  line(x1, y1, x2, y2, hex, lw = .5){ this.cur.push(`${rgb(hex)} RG ${lw} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`); }
  text(x, y, s, font, size, hex, spacing = 0){
    const f = { anton: 'F1', inter: 'F2', interb: 'F3' }[font];
    this.cur.push(`BT ${rgb(hex)} rg /${f} ${size} Tf ${spacing ? spacing + ' Tc ' : ''}1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${pdfStr(s)} Tj ${spacing ? '0 Tc ' : ''}ET`);
  }
  image(name, bytes, x, y, w, h){
    const info = jpegInfo(bytes); if(!info) return;
    this.images[name] = { bytes, info };
    this.cur.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /${name} Do Q`);
  }

  /* fonts : { anton, inter, interb } octets TTF */
  build(fonts, info = {}){
    const objs = []; // [bytes]
    const add = parts => { objs.push(parts); return objs.length; };
    const fontIds = {};
    for(const [key, ref] of [['anton', 'F1'], ['inter', 'F2'], ['interb', 'F3']]){
      const m = METRICS[key], bytes = fonts[key];
      const name = String(m.ps || key).replace(/[^A-Za-z0-9-]/g, '');
      const ff = add([te.encode(`<< /Length ${bytes.length} /Length1 ${bytes.length} >>\nstream\n`), bytes, te.encode('\nendstream')]);
      const fd = add([te.encode(`<< /Type /FontDescriptor /FontName /${name} /Flags 32 /FontBBox [${m.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${m.asc} /Descent ${m.desc} /CapHeight ${m.capH} /StemV 80 /FontFile2 ${ff} 0 R >>`)]);
      fontIds[ref] = add([te.encode(`<< /Type /Font /Subtype /TrueType /BaseFont /${name} /FirstChar 32 /LastChar 255 /Widths [${m.w.join(' ')}] /FontDescriptor ${fd} 0 R /Encoding /WinAnsiEncoding >>`)]);
    }
    const imgIds = {};
    for(const [name, { bytes, info: ji }] of Object.entries(this.images)){
      imgIds[name] = add([te.encode(`<< /Type /XObject /Subtype /Image /Width ${ji.w} /Height ${ji.h} /ColorSpace /${ji.comps === 1 ? 'DeviceGray' : ji.comps === 4 ? 'DeviceCMYK' : 'DeviceRGB'} /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`), bytes, te.encode('\nendstream')]);
    }
    const res = `<< /Font << ${Object.entries(fontIds).map(([k, v]) => `/${k} ${v} 0 R`).join(' ')} >> /XObject << ${Object.entries(imgIds).map(([k, v]) => `/${k} ${v} 0 R`).join(' ')} >> >>`;
    const pagesId = objs.length + 1 + this.pages.length * 2; // réservé après les pages
    const kids = [];
    for(const ops of this.pages){
      const content = te.encode(ops.join('\n'));
      const cid = add([te.encode(`<< /Length ${content.length} >>\nstream\n`), content, te.encode('\nendstream')]);
      kids.push(add([te.encode(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources ${res} /Contents ${cid} 0 R >>`)]));
    }
    const pid = add([te.encode(`<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`)]);
    if(pid !== pagesId) throw new Error('pdf: numérotation');
    const catalog = add([te.encode(`<< /Type /Catalog /Pages ${pid} 0 R >>`)]);
    const esc = s => pdfStr(s);
    const infoId = add([te.encode(`<< ${Object.entries(info).map(([k, v]) => `/${k} ${esc(v)}`).join(' ')} /Producer (YUL FC) >>`)]);

    const chunks = [te.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
    let off = chunks[0].length; const xref = [];
    objs.forEach((parts, i) => {
      xref.push(off);
      const head = te.encode(`${i + 1} 0 obj\n`), tail = te.encode('\nendobj\n');
      chunks.push(head, ...parts, tail);
      off += head.length + parts.reduce((t, p) => t + p.length, 0) + tail.length;
    });
    const xr = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${xref.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${infoId} 0 R >>\nstartxref\n${off}\n%%EOF\n`;
    chunks.push(te.encode(xr));
    const total = chunks.reduce((t, c) => t + c.length, 0);
    const out = new Uint8Array(total); let p = 0;
    for(const c of chunks){ out.set(c, p); p += c.length; }
    return out;
  }
}
