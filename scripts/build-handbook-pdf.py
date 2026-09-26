from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "TECHNICAL_HANDBOOK.md"
OUTPUT = ROOT / "docs" / "pdf" / "membership-ops-technical-handbook.pdf"
W, H = 595, 842
INK = (0.259, 0.239, 0.22)
MUTED = (0.475, 0.439, 0.404)
OUTLINE = (0.89, 0.878, 0.867)
SURFACE = (0.95, 0.955, 0.965)
ORANGE = (0.996, 0.431, 0.0)
SHELL = (0.09, 0.086, 0.082)


def ascii_text(value):
    replacements = {
        "\u2013": "-", "\u2014": "-", "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
        "\u2192": "->", "\u2190": "<-", "\u2194": "<->", "\u00b7": " / ", "\u2022": "-", "\u2026": "...", "\u00a0": " "
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value.encode("latin-1", "replace").decode("latin-1")


def clean(value):
    value = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", value)
    return ascii_text(value.replace("**", "").replace("`", ""))


def esc(value):
    return clean(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class Page:
    def __init__(self, number, cover=False):
        self.number = number
        self.commands = []
        self.y = H - 62
        self.cover = cover

    def cmd(self, command):
        self.commands.append(command)

    def fill(self, color):
        self.cmd(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg")

    def stroke(self, color):
        self.cmd(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} RG")

    def rect(self, x, y, w, h, color):
        self.fill(color); self.cmd(f"{x:.1f} {y:.1f} {w:.1f} {h:.1f} re f")

    def line(self, x1, y1, x2, y2, color=OUTLINE, width=0.5):
        self.stroke(color); self.cmd(f"{width:.1f} w {x1:.1f} {y1:.1f} m {x2:.1f} {y2:.1f} l S")

    def text(self, x, y, value, size=9, font="F1", color=INK):
        self.fill(color); self.cmd(f"BT /{font} {size:.1f} Tf {x:.1f} {y:.1f} Td ({esc(value)}) Tj ET")

    def wrap(self, value, size=9, limit=92):
        value = clean(value)
        words = value.split()
        lines, current, width = [], [], 0
        for word in words:
            next_width = width + len(word) + (1 if current else 0)
            if current and next_width > limit:
                lines.append(" ".join(current)); current = [word]; width = len(word)
            else:
                current.append(word); width = next_width
        if current: lines.append(" ".join(current))
        return lines or [""]


class PdfBuilder:
    def __init__(self):
        self.pages = []
        self.page = None

    def new_page(self, cover=False):
        self.page = Page(len(self.pages) + 1, cover)
        self.pages.append(self.page)
        if not cover:
            self.page.line(54, 815, 541, 815)
            self.page.text(54, 826, "MEMBERSHIP OPS / TECHNICAL HANDBOOK", 6.5, "F2", MUTED)
            self.page.text(520, 826, f"{self.page.number:02d}", 6.5, "F2", MUTED)

    def need(self, height):
        if self.page.y - height < 49:
            self.new_page()

    def para(self, text, size=9, leading=13, limit=95, color=INK):
        lines = self.page.wrap(text, size, limit)
        self.need(len(lines) * leading + 8)
        for line in lines:
            self.page.text(54, self.page.y, line, size, "F1", color)
            self.page.y -= leading
        self.page.y -= 6

    def heading(self, text, level=2):
        if level == 1:
            size, leading = 21, 25
        elif level == 2:
            self.new_page(); size, leading = 17, 21
        else:
            size, leading = 12, 15
        self.need(leading + 10)
        self.page.text(54, self.page.y, text, size, "F2", INK)
        self.page.y -= leading + 8

    def bullet(self, text):
        self.need(14)
        lines = self.page.wrap(text, 9, 86)
        self.page.text(64, self.page.y, "- " + lines[0], 9, "F1", INK)
        self.page.y -= 13
        for line in lines[1:]:
            self.page.text(76, self.page.y, line, 9, "F1", INK); self.page.y -= 13
        self.page.y -= 3

    def code(self, text):
        raw_lines = [ascii_text(line) for line in text.splitlines()]
        lines = []
        for raw in raw_lines:
            if len(raw) <= 92: lines.append(raw)
            else:
                lines.extend([raw[i:i + 92] for i in range(0, len(raw), 92)])
        height = max(28, len(lines) * 10 + 18)
        self.need(height + 4)
        top = self.page.y
        self.page.rect(54, top - height + 4, 487, height, SHELL)
        yy = top - 11
        for line in lines:
            self.page.text(63, yy, line, 7.2, "F2", (0.90, 0.87, 0.83)); yy -= 10
        self.page.y = top - height - 5

    def quote(self, lines):
        all_lines = []
        for line in lines: all_lines.extend(self.page.wrap(line, 8.3, 88))
        height = len(all_lines) * 11 + 16
        self.need(height + 4)
        top = self.page.y
        self.page.rect(54, top - height + 4, 487, height, (1.0, 0.973, 0.937))
        self.page.rect(54, top - height + 4, 3, height, ORANGE)
        yy = top - 13
        for line in all_lines:
            self.page.text(65, yy, line, 8.3, "F1", (0.455, 0.333, 0.235)); yy -= 11
        self.page.y = top - height - 5

    def table(self, rows):
        parsed = []
        for row in rows:
            cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
            if all(set(cell) <= {"-", ":", " "} for cell in cells): continue
            parsed.append(cells)
        for index, row in enumerate(parsed):
            line = "  |  ".join(row)
            wrapped = self.page.wrap(line, 7.6, 104)
            height = len(wrapped) * 10 + 8
            self.need(height)
            self.page.rect(54, self.page.y - height + 3, 487, height, SHELL if index == 0 else (SURFACE if index % 2 == 0 else (1, 1, 1)))
            yy = self.page.y - 10
            for part in wrapped:
                self.page.text(61, yy, part, 7.6, "F2" if index == 0 else "F1", (1, 1, 1) if index == 0 else INK); yy -= 10
            self.page.y -= height + 2

    def cover(self):
        self.new_page(cover=True)
        self.page.rect(0, 0, W, H, SHELL)
        self.page.rect(19, 42, 10, 10, ORANGE)
        self.page.rect(19, H - 28, 50, 1.2, (1.0, 0.718, 0.302))
        self.page.text(54, 735, "ENGINEERING INTERVIEW SAMPLE / VERSION 1.0", 8, "F2", (1.0, 0.718, 0.302))
        self.page.text(54, 665, "Membership Ops", 36, "F2", (1, 1, 1))
        self.page.text(54, 625, "A readable path from UI action to an authenticated,", 11, "F1", (0.78, 0.75, 0.73))
        self.page.text(54, 608, "authorized, transactional renewal request.", 11, "F1", (0.78, 0.75, 0.73))
        self.page.text(54, 575, "NestJS  /  Prisma  /  PostgreSQL  /  Next.js", 8, "F2", (1.0, 0.718, 0.302))

    def build(self):
        self.cover(); self.new_page()
        self.page.text(54, self.page.y, "Contents", 21, "F2", INK); self.page.y -= 35
        self.para("A compact navigation map for the live code walkthrough.", 8, 12, 95, MUTED)
        items = ["1. Project purpose", "2. Scope and non-goals", "3. Architecture", "4. Repository structure", "5. Primary request lifecycle", "6. Login and authentication", "7. Authorization", "8. Input validation", "9. Membership business rules", "10. Pricing", "11. Payment boundary", "12. Database design", "13. Prisma access", "14. Transaction semantics", "15. Error handling", "16. Logging and request correlation", "17. Security decisions", "18. Testing strategy", "19. UI architecture", "20. Developer View architecture", "21. Deployment", "22. Known limitations", "23. Production evolution", "24. Interview walkthrough", "Appendix: exact source map"]
        for item in items: self.para(item, 9, 13, 95, INK)
        self.new_page()

        paragraph, code, quote, table, in_code = [], [], [], [], False
        lines = SOURCE.read_text().splitlines()
        def flush_para():
            nonlocal paragraph
            if paragraph: self.para(" ".join(x.strip() for x in paragraph)); paragraph = []
        def flush_quote():
            nonlocal quote
            if quote: self.quote(quote); quote = []
        def flush_table():
            nonlocal table
            if table: self.table(table); table = []
        for raw in lines:
            line = raw.rstrip()
            if line.startswith("```"):
                flush_para(); flush_quote(); flush_table()
                if in_code: self.code("\n".join(code)); code = []; in_code = False
                else: in_code = True
                continue
            if in_code: code.append(line); continue
            if line.startswith("> "):
                flush_para(); flush_table(); quote.append(line[2:]); continue
            if quote and not line.startswith("> "): flush_quote()
            if line.startswith("# "):
                flush_para(); flush_table(); self.heading(line[2:], 1); continue
            if line.startswith("## "):
                flush_para(); flush_table(); self.heading(line[3:], 2); continue
            if line.startswith("### "):
                flush_para(); flush_table(); self.heading(line[4:], 3); continue
            if line.startswith("|"):
                flush_para(); table.append(line); continue
            if line.startswith("- "):
                flush_para(); flush_table(); self.bullet(line[2:]); continue
            if not line.strip():
                flush_para(); flush_table(); continue
            paragraph.append(line)
        flush_para(); flush_quote(); flush_table()
        self.write()

    def write(self):
        objects = []
        def obj(data):
            objects.append(data); return len(objects)
        font1 = obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        font2 = obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
        page_ids, content_ids = [], []
        for page in self.pages:
            content = ("\n".join(page.commands)).encode("latin-1", "replace")
            content_id = obj(b"<< /Length %d >>\nstream\n" % len(content) + content + b"\nendstream")
            content_ids.append(content_id)
            page_ids.append(obj(None))
        pages_id = obj(None)
        catalog_id = obj(None)
        for page_id, content_id in zip(page_ids, content_ids):
            objects[page_id - 1] = (f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << /F1 {font1} 0 R /F2 {font2} 0 R >> >> /Contents {content_id} 0 R >>").encode()
        objects[pages_id - 1] = (f"<< /Type /Pages /Kids [{' '.join(f'{x} 0 R' for x in page_ids)}] /Count {len(page_ids)} >>").encode()
        objects[catalog_id - 1] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode()
        out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for number, data in enumerate(objects, start=1):
            offsets.append(len(out)); out.extend(f"{number} 0 obj\n".encode()); out.extend(data); out.extend(b"\nendobj\n")
        xref = len(out); out.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
        for offset in offsets[1:]: out.extend(f"{offset:010d} 00000 n \n".encode())
        out.extend(f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
        OUTPUT.parent.mkdir(parents=True, exist_ok=True); OUTPUT.write_bytes(out)
        print(f"Created {OUTPUT} ({len(self.pages)} pages)")


if __name__ == "__main__":
    PdfBuilder().build()
