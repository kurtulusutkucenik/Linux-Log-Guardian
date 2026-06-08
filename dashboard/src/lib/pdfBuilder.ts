/** Minimal cok sayfali PDF olusturucu (harici bagimlilik yok). */

type Rgb = [number, number, number];

export class SimplePdf {
  private streams: string[] = [];
  private ops: string[] = [];
  private y = 0;
  private readonly w = 595;
  private readonly h = 842;
  private readonly margin = 44;
  private readonly bottom = 48;

  constructor() {
    this.newPage();
  }

  private newPage() {
    if (this.ops.length) this.streams.push(this.ops.join("\n"));
    this.ops = [];
    this.y = this.h - this.margin;
  }

  ensure(min = 24) {
    if (this.y - min < this.bottom) this.newPage();
  }

  private esc(text: string): string {
    const tr: Record<string, string> = {
      ş: "s",
      Ş: "S",
      ı: "i",
      İ: "I",
      ğ: "g",
      Ğ: "G",
      ü: "u",
      Ü: "U",
      ö: "o",
      Ö: "O",
      ç: "c",
      Ç: "C",
      "—": "-",
      "–": "-",
    };
    return text
      .replace(/[şŞıİğĞüÜöÖçÇ—–]/g, (c) => tr[c] ?? c)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[^\x00-\xFF]/g, "?");
  }

  private emit(cmd: string) {
    this.ops.push(cmd);
  }

  fillRect(x: number, y: number, w: number, h: number, color: Rgb) {
    const [r, g, b] = color;
    this.emit("q");
    this.emit(`${r} ${g} ${b} rg`);
    this.emit(`${x} ${y} ${w} ${h} re f`);
    this.emit("Q");
  }

  strokeRect(x: number, y: number, w: number, h: number, width = 1) {
    this.emit(`${width} w`);
    this.emit(`${x} ${y} ${w} ${h} re S`);
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.5) {
    this.emit(`${width} w`);
    this.emit(`${x1} ${y1} m ${x2} ${y2} l S`);
  }

  text(
    x: number,
    y: number,
    text: string,
    opts: { size?: number; bold?: boolean; color?: Rgb } = {},
  ) {
    const size = opts.size ?? 10;
    const font = opts.bold ? "/F2" : "/F1";
    const [r, g, b] = opts.color ?? [0, 0, 0];
    this.emit("BT");
    this.emit(`${font} ${size} Tf`);
    this.emit(`${r} ${g} ${b} rg`);
    this.emit(`1 0 0 1 ${x} ${y} Tm`);
    this.emit(`(${this.esc(text)}) Tj`);
    this.emit("ET");
  }

  textBlock(
    x: number,
    text: string,
    opts: { size?: number; bold?: boolean; color?: Rgb; maxWidth?: number; lineHeight?: number } = {},
  ) {
    const size = opts.size ?? 10;
    const lh = opts.lineHeight ?? size + 4;
    const max = opts.maxWidth ?? this.w - this.margin * 2;
    const approxChars = Math.max(20, Math.floor(max / (size * 0.52)));
    const lines = wrapLines(text, approxChars);
    for (const line of lines) {
      this.ensure(lh);
      this.text(x, this.y, line, opts);
      this.y -= lh;
    }
  }

  gap(n = 12) {
    this.y -= n;
  }

  /** Metni imlecin bulundugu satira yazar; font boyutuna gore yeterli satir araligi birakir. */
  textLine(
    x: number,
    text: string,
    opts: { size?: number; bold?: boolean; color?: Rgb; lineHeight?: number } = {},
  ) {
    const size = opts.size ?? 10;
    const lh = opts.lineHeight ?? Math.max(size + 8, 14);
    this.ensure(lh);
    this.text(x, this.y, text, opts);
    this.y -= lh;
  }

  cursorY() {
    return this.y;
  }

  setY(y: number) {
    this.y = y;
  }

  build(): Buffer {
    if (this.ops.length) this.streams.push(this.ops.join("\n"));

    const pageCount = this.streams.length;
    const objects: string[] = [];
    const pageObjIds: number[] = [];

    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    const kids = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`);

    const fontRegularId = 3 + pageCount * 2;
    const fontBoldId = fontRegularId + 1;

    for (let i = 0; i < pageCount; i++) {
      const pageId = 3 + i * 2;
      const contentId = pageId + 1;
      pageObjIds.push(pageId);
      const stream = this.streams[i];
      const len = Buffer.byteLength(stream, "utf8");
      objects.push(
        `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.w} ${this.h}] ` +
          `/Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> >>\nendobj\n`,
      );
      objects.push(
        `${contentId} 0 obj\n<< /Length ${len} >>\nstream\n${stream}\nendstream\nendobj\n`,
      );
    }

    objects.push(
      `${fontRegularId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    );
    objects.push(
      `${fontBoldId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
    );

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(Buffer.byteLength(pdf, "utf8"));
      pdf += obj;
    }
    const xrefPos = Buffer.byteLength(pdf, "utf8");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    return Buffer.from(pdf, "utf8");
  }
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function formatReportDate(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
  }
}
