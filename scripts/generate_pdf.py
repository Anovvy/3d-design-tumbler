#!/usr/bin/env python3
"""
Technical Blueprint & Crochet Pattern Guide Generator
Reads master specifications from `src/data/project_specs.json` and multi-angle 3D
renders from `assets/renders/`, applies smart in-memory background cropping via
Pillow, and outputs `output/Pokemon_Tumbler_Case_Guide.pdf`.
"""

from __future__ import annotations

import io
import json
from html import escape
from pathlib import Path
from typing import Any

from PIL import Image as PILImage
from PIL import ImageChops
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    Flowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Paths & Layout Constants
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
SPECS_PATH = BASE_DIR / "src" / "data" / "project_specs.json"
RENDERS_DIR = BASE_DIR / "assets" / "renders"
OUTPUT_PDF = BASE_DIR / "output" / "Pokemon_Tumbler_Case_Guide.pdf"

PAGE_W, PAGE_H = A4
MARGIN_L = 15 * mm
MARGIN_R = 15 * mm
MARGIN_T = 16 * mm
MARGIN_B = 15 * mm
CONTENT_W = 510.0  # Exact printable width inside A4 (~510.23 pt)

# Design Palette
INK_DARK = colors.HexColor("#0F172A")
INK_BODY = colors.HexColor("#1E293B")
INK_MUTED = colors.HexColor("#475569")
STUDIO_BG = colors.HexColor("#0C1118")
BORDER_SLATE = colors.HexColor("#CBD5E1")
SURFACE_ALT = colors.HexColor("#F8FAFC")

EMERALD_ACCENT = colors.HexColor("#15803D")
EMERALD_BG = colors.HexColor("#ECFDF5")
AMBER_ACCENT = colors.HexColor("#C2410C")
AMBER_BG = colors.HexColor("#FFF7ED")
BLUE_ACCENT = colors.HexColor("#0369A1")
BLUE_BG = colors.HexColor("#F0F9FF")
LINK_BLUE = colors.HexColor("#0B5CAD")
SHOPEE_CORAL = colors.HexColor("#D9381E")


# ---------------------------------------------------------------------------
# Font Setup
# ---------------------------------------------------------------------------
def register_fonts() -> tuple[str, str]:
    """Register Unicode-capable Segoe UI + Consolas fonts on Windows with safe fallback."""
    font_candidates = {
        "SegoeUI": Path("C:/Windows/Fonts/segoeui.ttf"),
        "SegoeUI-Bold": Path("C:/Windows/Fonts/segoeuib.ttf"),
        "SegoeUI-Italic": Path("C:/Windows/Fonts/segoeuii.ttf"),
        "SegoeUI-BoldItalic": Path("C:/Windows/Fonts/segoeuiz.ttf"),
        "Consolas": Path("C:/Windows/Fonts/consola.ttf"),
    }
    if all(p.exists() for k, p in font_candidates.items() if k != "Consolas"):
        for name, path in font_candidates.items():
            if path.exists():
                pdfmetrics.registerFont(TTFont(name, str(path)))
        registerFontFamily(
            "SegoeUI",
            normal="SegoeUI",
            bold="SegoeUI-Bold",
            italic="SegoeUI-Italic",
            boldItalic="SegoeUI-BoldItalic",
        )
        mono = "Consolas" if font_candidates["Consolas"].exists() else "Courier"
        return "SegoeUI", mono
    return "Helvetica", "Courier"


FONT_FAMILY, FONT_MONO = register_fonts()
FONT_REGULAR = FONT_FAMILY
FONT_BOLD = f"{FONT_FAMILY}-Bold" if FONT_FAMILY == "SegoeUI" else "Helvetica-Bold"


def arrow_ne() -> str:
    """Return northeast arrow in regular font where the Unicode glyph exists."""
    if FONT_FAMILY == "SegoeUI":
        return f'<font name="{FONT_REGULAR}">&#8599;</font>'
    return "-&gt;"


def make_styles() -> dict[str, ParagraphStyle]:
    """Create typography styles used consistently across the blueprint."""
    return {
        "banner_eyebrow": ParagraphStyle(
            "banner_eyebrow",
            fontName=FONT_BOLD,
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#6EE7B7"),
        ),
        "banner_title": ParagraphStyle(
            "banner_title",
            fontName=FONT_BOLD,
            fontSize=19,
            leading=23,
            textColor=colors.white,
        ),
        "banner_subtitle": ParagraphStyle(
            "banner_subtitle",
            fontName=FONT_REGULAR,
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor("#CBD5E1"),
        ),
        "kpi_label": ParagraphStyle(
            "kpi_label",
            fontName=FONT_BOLD,
            fontSize=7,
            leading=9.5,
            textColor=INK_MUTED,
        ),
        "kpi_value": ParagraphStyle(
            "kpi_value",
            fontName=FONT_BOLD,
            fontSize=10,
            leading=13,
            textColor=INK_DARK,
        ),
        "kpi_sub": ParagraphStyle(
            "kpi_sub",
            fontName=FONT_REGULAR,
            fontSize=7.2,
            leading=9.5,
            textColor=INK_MUTED,
        ),
        "sec_kicker": ParagraphStyle(
            "sec_kicker",
            fontName=FONT_BOLD,
            fontSize=7.5,
            leading=9.5,
            textColor=colors.white,
        ),
        "sec_title": ParagraphStyle(
            "sec_title",
            fontName=FONT_BOLD,
            fontSize=13,
            leading=16.5,
            textColor=INK_DARK,
        ),
        "sec_sub": ParagraphStyle(
            "sec_sub",
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=11.5,
            textColor=INK_MUTED,
        ),
        "h3": ParagraphStyle(
            "h3",
            fontName=FONT_BOLD,
            fontSize=10.5,
            leading=14,
            textColor=INK_DARK,
            spaceBefore=4,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=12.2,
            textColor=INK_BODY,
        ),
        "body_sm": ParagraphStyle(
            "body_sm",
            fontName=FONT_REGULAR,
            fontSize=7.8,
            leading=10.8,
            textColor=INK_BODY,
        ),
        "caption": ParagraphStyle(
            "caption",
            fontName=FONT_REGULAR,
            fontSize=7.5,
            leading=10.0,
            textColor=INK_BODY,
            alignment=TA_LEFT,
        ),
        "th": ParagraphStyle(
            "th",
            fontName=FONT_BOLD,
            fontSize=7.7,
            leading=10.0,
            textColor=colors.white,
        ),
        "th_center": ParagraphStyle(
            "th_center",
            fontName=FONT_BOLD,
            fontSize=7.7,
            leading=10.0,
            textColor=colors.white,
            alignment=TA_CENTER,
        ),
        "th_right": ParagraphStyle(
            "th_right",
            fontName=FONT_BOLD,
            fontSize=7.7,
            leading=10.0,
            textColor=colors.white,
            alignment=TA_RIGHT,
        ),
        "td": ParagraphStyle(
            "td",
            fontName=FONT_REGULAR,
            fontSize=7.5,
            leading=10.0,
            textColor=INK_BODY,
        ),
        "td_bold": ParagraphStyle(
            "td_bold",
            fontName=FONT_BOLD,
            fontSize=7.5,
            leading=10.0,
            textColor=INK_DARK,
        ),
        "td_center": ParagraphStyle(
            "td_center",
            fontName=FONT_REGULAR,
            fontSize=7.5,
            leading=10.0,
            textColor=INK_BODY,
            alignment=TA_CENTER,
        ),
        "td_right": ParagraphStyle(
            "td_right",
            fontName=FONT_BOLD,
            fontSize=7.5,
            leading=10.0,
            textColor=INK_DARK,
            alignment=TA_RIGHT,
        ),
        "cat_row": ParagraphStyle(
            "cat_row",
            fontName=FONT_BOLD,
            fontSize=7.7,
            leading=10.2,
            textColor=INK_DARK,
        ),
        "link": ParagraphStyle(
            "link",
            fontName=FONT_REGULAR,
            fontSize=6.9,
            leading=9.6,
            textColor=LINK_BLUE,
            alignment=TA_CENTER,
        ),
        "callout_title": ParagraphStyle(
            "callout_title",
            fontName=FONT_BOLD,
            fontSize=8.8,
            leading=11.8,
            textColor=INK_DARK,
        ),
        "callout_body": ParagraphStyle(
            "callout_body",
            fontName=FONT_REGULAR,
            fontSize=7.9,
            leading=11.2,
            textColor=INK_BODY,
        ),
        "zone_title": ParagraphStyle(
            "zone_title",
            fontName=FONT_BOLD,
            fontSize=9.1,
            leading=12.0,
            textColor=colors.white,
        ),
        "zone_meta": ParagraphStyle(
            "zone_meta",
            fontName=FONT_REGULAR,
            fontSize=7.6,
            leading=10.4,
            textColor=INK_BODY,
        ),
        "zone_note": ParagraphStyle(
            "zone_note",
            fontName=FONT_REGULAR,
            fontSize=7.7,
            leading=10.6,
            textColor=INK_DARK,
        ),
        "zone_step": ParagraphStyle(
            "zone_step",
            fontName=FONT_REGULAR,
            fontSize=7.8,
            leading=11.0,
            textColor=INK_BODY,
            leftIndent=8,
            firstLineIndent=-8,
        ),
    }


# ---------------------------------------------------------------------------
# Numbered Canvas for Crisp Running Headers & Footers
# ---------------------------------------------------------------------------
class NumberedBlueprintCanvas(pdfcanvas.Canvas):
    """Canvas subclass that stamps page numbers and running technical chrome."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._saved_page_states: list[dict[str, Any]] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_chrome(total_pages)
            super().showPage()
        super().save()

    def _draw_chrome(self, total_pages: int) -> None:
        page_num = self._pageNumber
        self.saveState()

        if page_num > 1:
            self.setStrokeColor(BORDER_SLATE)
            self.setLineWidth(0.5)
            self.line(MARGIN_L, PAGE_H - 11.5 * mm, PAGE_W - MARGIN_R, PAGE_H - 11.5 * mm)
            self.setFont(FONT_BOLD, 7.2)
            self.setFillColor(INK_MUTED)
            self.drawString(MARGIN_L, PAGE_H - 10 * mm, "POKEMON 3D CROCHET TUMBLER CASE  |  BLUEPRINT TEKNIS & PANDUAN PERAJUT")
            self.setFont(FONT_REGULAR, 7.2)
            self.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 10 * mm, "Cuculemon 1L (Ø 8.0 × 32.0 cm) • Beban 1.3 kg")

        self.setStrokeColor(BORDER_SLATE)
        self.setLineWidth(0.5)
        self.line(MARGIN_L, 11 * mm, PAGE_W - MARGIN_R, 11 * mm)
        self.setFont(FONT_REGULAR, 7.2)
        self.setFillColor(INK_MUTED)
        self.drawString(MARGIN_L, 7.5 * mm, "Sceptile (Jukain) & Dragonite (Kairyu) • Polycherry D27 • Tali Pendek 30 cm & Tali Panjang 100 cm")
        self.setFont(FONT_BOLD, 7.4)
        self.setFillColor(INK_DARK)
        self.drawRightString(PAGE_W - MARGIN_R, 7.5 * mm, f"Halaman {page_num} dari {total_pages}")

        self.restoreState()


# ---------------------------------------------------------------------------
# Smart In-Memory Image Cropping & Studio Card Rendering
# ---------------------------------------------------------------------------
def crop_render_to_bytes(image_path: Path) -> tuple[io.BytesIO, int, int]:
    """
    Detect bounding box of subject + straps + dimension overlays while ignoring
    the dark studio sky (#0c1118) and muted outer turntable grid, add ~10% padding,
    and return an in-memory PNG BytesIO buffer along with pixel dimensions.
    """
    with PILImage.open(image_path) as src:
        rgb = src.convert("RGB")
        w, h = rgb.size
        r, g, b = rgb.split()

        mr = r.point(lambda v: 255 if v > 74 else 0)
        mg = g.point(lambda v: 255 if v > 84 else 0)
        mb = b.point(lambda v: 255 if v > 92 else 0)
        mask = ImageChops.lighter(ImageChops.lighter(mr, mg), mb)
        bbox = mask.getbbox()

        if bbox:
            cw = bbox[2] - bbox[0]
            ch = bbox[3] - bbox[1]
            pad_x = max(32, int(cw * 0.10))
            pad_y_top = max(52, int(ch * 0.11))
            pad_y_bot = max(32, int(ch * 0.10))
            x0 = max(0, bbox[0] - pad_x)
            y0 = max(0, bbox[1] - pad_y_top)
            x1 = min(w, bbox[2] + pad_x)
            y1 = min(h, bbox[3] + pad_y_bot)
            cropped = rgb.crop((x0, y0, x1, y1))
        else:
            cropped = rgb

        buf = io.BytesIO()
        cropped.save(buf, format="PNG", optimize=True)
        buf.seek(0)
        return buf, cropped.width, cropped.height


def make_studio_card(
    filename: str,
    card_w: float,
    img_box_h: float,
    caption_html: str,
    styles: dict[str, ParagraphStyle],
    image_buffers: list[io.BytesIO],
    border_color: colors.Color = BORDER_SLATE,
) -> Table:
    """Wrap a smart-cropped 3D render inside a seamless dark studio frame with caption."""
    buf, px_w, px_h = crop_render_to_bytes(RENDERS_DIR / filename)
    image_buffers.append(buf)

    inner_w = card_w - 10.0
    inner_h = img_box_h - 8.0
    scale = min(inner_w / px_w, inner_h / px_h)
    draw_w = px_w * scale
    draw_h = px_h * scale

    img_flow = Image(buf, width=draw_w, height=draw_h)
    cap_para = Paragraph(caption_html, styles["caption"])

    card = Table(
        [[img_flow], [cap_para]],
        colWidths=[card_w],
        rowHeights=[img_box_h, None],
    )
    card.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ("BOX", (0, 0), (-1, -1), 0.75, border_color),
                ("BACKGROUND", (0, 0), (0, 0), STUDIO_BG),
                ("BACKGROUND", (0, 1), (0, 1), SURFACE_ALT),
                ("LINEABOVE", (0, 1), (0, 1), 0.5, border_color),
                ("ALIGN", (0, 0), (0, 0), "CENTER"),
                ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (0, 0), 5),
                ("RIGHTPADDING", (0, 0), (0, 0), 5),
                ("TOPPADDING", (0, 0), (0, 0), 4),
                ("BOTTOMPADDING", (0, 0), (0, 0), 4),
                ("LEFTPADDING", (0, 1), (0, 1), 7),
                ("RIGHTPADDING", (0, 1), (0, 1), 7),
                ("TOPPADDING", (0, 1), (0, 1), 5),
                ("BOTTOMPADDING", (0, 1), (0, 1), 5),
            ]
        )
    )
    return card


# ---------------------------------------------------------------------------
# Custom Flowables & UI Helpers
# ---------------------------------------------------------------------------
def _hex_luminance(hex_str: str) -> float:
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0
    return 0.299 * r + 0.587 * g + 0.114 * b


class SwatchRowFlowable(Flowable):
    """Draw 5 crisp yarn color swatch cards with exact hex fill, name, grams & rolls."""

    def __init__(
        self,
        swatches: list[dict[str, Any]],
        total_width: float = CONTENT_W,
        height: float = 54.0,
    ) -> None:
        super().__init__()
        self.swatches = swatches
        self.total_width = total_width
        self.height = height
        self.width = total_width

    def draw(self) -> None:
        c = self.canv
        n = len(self.swatches)
        gap = 6.0
        card_w = (self.total_width - gap * (n - 1)) / n

        for idx, sw in enumerate(self.swatches):
            x = idx * (card_w + gap)
            y = 0.0

            c.setFillColor(colors.white)
            c.setStrokeColor(BORDER_SLATE)
            c.setLineWidth(0.7)
            c.roundRect(x, y, card_w, self.height, 4, fill=1, stroke=1)

            band_h = 18.0
            hex_code = sw["hex"]
            c.setFillColor(colors.HexColor(hex_code))
            c.setStrokeColor(colors.HexColor("#94A3B8"))
            c.setLineWidth(0.4)
            c.roundRect(x + 4, y + self.height - band_h - 4, card_w - 8, band_h, 3, fill=1, stroke=1)

            c.setFont(FONT_MONO, 6.8)
            lum = _hex_luminance(hex_code)
            c.setFillColor(colors.white if lum < 0.45 else INK_DARK)
            c.drawCentredString(x + card_w / 2.0, y + self.height - band_h + 1.5, hex_code.upper())

            c.setFont(FONT_BOLD, 7.1)
            c.setFillColor(INK_DARK)
            c.drawCentredString(x + card_w / 2.0, y + 18.5, sw["label"])

            c.setFont(FONT_REGULAR, 6.8)
            c.setFillColor(INK_MUTED)
            c.drawCentredString(x + card_w / 2.0, y + 7.0, f"{sw['grams']} g  •  {sw['rolls']} gulung")


def format_idr(amount: int) -> str:
    return f"Rp {amount:,.0f}".replace(",", ".")


def section_banner(
    badge: str,
    title: str,
    subtitle: str,
    accent: colors.Color,
    bg_tint: colors.Color,
    styles: dict[str, ParagraphStyle],
) -> Table:
    """Create a full-width section header bar with solid badge pill and accent border."""
    badge_tbl = Table([[Paragraph(escape(badge), styles["sec_kicker"])]], colWidths=[64])
    badge_tbl.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
                ("BACKGROUND", (0, 0), (0, 0), accent),
                ("ALIGN", (0, 0), (0, 0), "CENTER"),
                ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
                ("TOPPADDING", (0, 0), (0, 0), 3),
                ("BOTTOMPADDING", (0, 0), (0, 0), 3),
                ("LEFTPADDING", (0, 0), (0, 0), 5),
                ("RIGHTPADDING", (0, 0), (0, 0), 5),
            ]
        )
    )
    text_block = [
        badge_tbl,
        Spacer(1, 3),
        Paragraph(escape(title), styles["sec_title"]),
        Paragraph(escape(subtitle), styles["sec_sub"]),
    ]
    tbl = Table([[text_block]], colWidths=[CONTENT_W])
    tbl.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [5, 5, 5, 5]),
                ("BACKGROUND", (0, 0), (0, 0), bg_tint),
                ("BOX", (0, 0), (0, 0), 0.75, BORDER_SLATE),
                ("LINEBEFORE", (0, 0), (0, 0), 4.0, accent),
                ("LEFTPADDING", (0, 0), (0, 0), 11),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 0), (0, 0), 7),
                ("BOTTOMPADDING", (0, 0), (0, 0), 7),
            ]
        )
    )
    return tbl


def callout_box(
    title_html: str,
    body_html: str,
    accent: colors.Color,
    bg_color: colors.Color,
    styles: dict[str, ParagraphStyle],
) -> Table:
    """Create a clean highlighted callout box with left accent bar."""
    content = [
        Paragraph(title_html, styles["callout_title"]),
        Spacer(1, 2.5),
        Paragraph(body_html, styles["callout_body"]),
    ]
    tbl = Table([[content]], colWidths=[CONTENT_W])
    tbl.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [5, 5, 5, 5]),
                ("BACKGROUND", (0, 0), (0, 0), bg_color),
                ("BOX", (0, 0), (0, 0), 0.75, accent),
                ("LINEBEFORE", (0, 0), (0, 0), 3.8, accent),
                ("LEFTPADDING", (0, 0), (0, 0), 10),
                ("RIGHTPADDING", (0, 0), (0, 0), 10),
                ("TOPPADDING", (0, 0), (0, 0), 7),
                ("BOTTOMPADDING", (0, 0), (0, 0), 7),
            ]
        )
    )
    return tbl


# ---------------------------------------------------------------------------
# Indonesian Localization Maps (Preserving 100% JSON Metrics & Stitch Counts)
# ---------------------------------------------------------------------------
YARN_USAGE_ID: dict[tuple[str, str], dict[str, str]] = {
    ("sceptile", "#68C481"): {
        "short_name": "Hijau Mint / Emerald",
        "usage": "Silinder bodi utama Ø 8.0 cm, alas, kerah leher Ø 5.8 cm, lengan/kaki, bilah daun bawah, & jambul kepala",
    },
    ("sceptile", "#438D5A"): {
        "short_name": "Hijau Tua Forest",
        "usage": "Bingkai kerah V dada, garis tulang punggung, sirip daun ekor atas, & daun pergelangan tangan",
    },
    ("sceptile", "#D6615D"): {
        "short_name": "Merah Bata / Coral",
        "usage": "Sabuk perut (belly belt), aksen rahang bawah, garis kelopak mata bawah, & selongsong ujung strap",
    },
    ("sceptile", "#E4D17C"): {
        "short_name": "Kuning Muda Emas",
        "usage": "6 biji punggung 3D (2×3) & iris mata Sceptile",
    },
    ("sceptile", "#1F2421"): {
        "short_name": "Hitam Pekat",
        "usage": "Pupil celah vertikal mata, lubang hidung, & aksen alis",
    },
    ("dragonite", "#EC9D41"): {
        "short_name": "Oranye Emas",
        "usage": "Bodi belakang/samping Ø 8.0 cm, alas, kerah leher, ekor gemuk, kaki/tangan, rangka sayap, & tanduk",
    },
    ("dragonite", "#EAD8B3"): {
        "short_name": "Krem / Ivory",
        "usage": "Panel perut bergaris 11 rusuk, panel bawah ekor bergaris, & 2 antena lengkung-S di dahi",
    },
    ("dragonite", "#167B75"): {
        "short_name": "Hijau Tosca Tua",
        "usage": "Membran dalam sayap 2-warna (kiri & kanan), iris mata Dragonite, & aksen selongsong strap",
    },
    ("dragonite", "#DCE0E5"): {
        "short_name": "Putih Tulang",
        "usage": "12 cakar kerucut kecil (6 cakar tangan + 6 cakar kaki) & kilau putih mata",
    },
    ("dragonite", "#1F2421"): {
        "short_name": "Hitam Pekat",
        "usage": "Pupil mata vertikal, kontur luar mata, & lubang hidung halus",
    },
}

ZONE_ID_CONTENT: dict[tuple[str, str], dict[str, Any]] = {
    ("sceptile", "zone-1"): {
        "title": "Zona 1: Alas Ganda Sandwich EVA 4 mm & Jangkar Kaki Belakang",
        "badge": "Tinggi 0.0–0.8 cm  |  Ø 0.0–8.0 cm",
        "stitches": "1 Helai: MR 6 → R10 = 60 sc  |  2 Helai: MR 8 → R5 = 40 sc",
        "rows": "1 Helai: 10 putaran luar + 10 putaran dalam + 1 BLO  |  2 Helai: 5 + 5 + 1 BLO",
        "colors": "Hijau Mint / Emerald (#68C481)",
        "load_note": (
            "Menjepit cakram Busa EVA (Spon Ati) Ø 7.8 cm × 4 mm di antara cakram rajut luar dan dalam "
            "sebelum putaran tegak BLO. Mencegah beban botol 1.3 kg menarik tusukan dasar atau penyok saat diletakkan."
        ),
        "steps": [
            "Opsi 1 Helai (Hakpen 3.0 mm): R1 MR 6 sc (6); R2 inc ×6 (12); R3 (sc, inc) ×6 (18); lanjutkan pola peningkatan hingga R10 (8 sc, inc) ×6 (60 sc). Buat 1 cakram dalam identik 10 putaran (60 sc).",
            "Opsi 2 Helai (Hakpen 4.5 mm): R1 MR 8 sc (8); R2 inc ×8 (16); R3 (sc, inc) ×8 (24); R4 (2 sc, inc) ×8 (32); R5 (3 sc, inc) ×8 (40 sc). Buat 1 cakram dalam identik 5 putaran (40 sc).",
            "Sisipkan cakram Busa EVA Ø 7.8 cm × 4 mm di tengah kedua cakram rajut, lalu kerjakan putaran pengunci BLO (R11 pada 1 helai / R6 pada 2 helai) dengan mengait loop luar + loop dalam sekaligus (60 sc atau 40 sc) agar membentuk sudut dasar 90° yang kaku.",
        ],
    },
    ("sceptile", "zone-2"): {
        "title": "Zona 2: Silinder Bodi Lurus, Sabuk Perut Coral & Pangkal Ekor",
        "badge": "Tinggi 0.0–20.0 cm  |  Ø 8.0 cm (Keliling 25.13 cm)",
        "stitches": "1 Helai: 60 sc keliling  |  2 Helai: 40 sc keliling",
        "rows": "1 Helai: 52 baris  |  2 Helai: 36 baris",
        "colors": "Hijau Mint (#68C481), Merah Coral (#D6615D), Hijau Tua (#438D5A)",
        "load_note": (
            "Tusukan Yarn-Under SC (YU-SC) rapat menjaga keliling tepat 25.13 cm memeluk dinding stainless steel Ø 8.0 cm. "
            "Area atas Zona 2 (tinggi 19.5–20.0 cm) menjadi titik jahit ujung bawah 2 tab Webbing Nylon 1.5 cm."
        ),
        "steps": [
            "Kerjakan silinder lurus dengan YU-SC rapat: Baris 1–11 (1 helai) atau Baris 1–7 (2 helai) memakai Hijau Mint (#68C481).",
            "Sabuk Perut Merah Coral (tinggi ~4.5–7.8 cm): Pada Baris 12–19 (1 helai) atau Baris 8–13 (2 helai), ganti 38 st bagian depan/samping (25 st pada 2 helai) menjadi Merah Coral (#D6615D) dan biarkan 22 st belakang Hijau Mint (atau buat pita melingkar penuh sesuai selera).",
            "Baris 20–52 (1 helai) / Baris 14–36 (2 helai): Lanjutkan Hijau Mint lurus hingga tinggi 20.0 cm. Tambahkan garis tulang punggung vertikal 3 st dengan Hijau Tua (#438D5A) di tengah belakang (st 29–31) via surface slip stitch atau intarsia.",
            "Awal Kerah V Dada (17.5–20.0 cm): Pada Baris 46–52 di tengah depan, mulai garis V Hijau Tua (#438D5A) yang mengerucut ke titik tengah dada.",
        ],
    },
    ("sceptile", "zone-3"): {
        "title": "Zona 3: Bahu Tirus, Puncak Kerah V & Jembatan Webbing Penahan Beban",
        "badge": "Tinggi 20.0–25.5 cm  |  Ø 8.0 → 5.8 cm",
        "stitches": "1 Helai: 60 sc → 44 sc  |  2 Helai: 40 sc → 28 sc",
        "rows": "1 Helai: 14 baris  |  2 Helai: 10 baris",
        "colors": "Hijau Mint (#68C481), Hijau Tua Forest (#438D5A)",
        "load_note": (
            "KRITIS: Jangan mengandalkan tusuk pengurangan rajutan saja untuk menahan beban 1.3 kg. Sebelum menutup Zona 4, "
            "jahit ujung ekor vertikal 6.0 cm dari dua pita Webbing Nylon 1.5 cm di dinding dalam sisi kiri (jam 9) & kanan (jam 3) "
            "dari tinggi 25.5 cm turun hingga 19.5 cm di bodi Ø 8.0 cm menggunakan jahitan X-box benang nylon tas."
        ),
        "steps": [
            "Jadwal Pengurangan 1 Helai (14 baris, 60 → 44 sc): R1–2 sc 60; R3 (13 sc, dec)×4 (56); R4–5 sc 56; R6 (12 sc, dec)×4 (52); R7–8 sc 52; R9 (11 sc, dec)×4 (48); R10–11 sc 48; R12 (10 sc, dec)×4 (44); R13–14 sc 44.",
            "Jadwal Pengurangan 2 Helai (10 baris, 40 → 28 sc): R1 sc 40; R2 (8 sc, dec)×4 (36); R3–4 sc 36; R5 (7 sc, dec)×4 (32); R6–7 sc 32; R8 (6 sc, dec)×4 (28); R9–10 sc 28.",
            "Selesaikan bingkai kerah V Hijau Tua (#438D5A) membungkus bahu kiri/kanan menuju ujung lancip V di tengah depan tinggi ~19.5 cm.",
            "Uji pasang (test-fit) pada botol Cuculemon 1L sebelum masuk Zona 4: bahu rajut harus menempel rata pada lengkung bahu 20.0–25.5 cm tanpa celah longgar.",
        ],
    },
    ("sceptile", "zone-4"): {
        "title": "Zona 4: Kerah Leher, Kanal Serut Paracord 550 & Hub Ring D 1.5 cm",
        "badge": "Tinggi 25.5–28.0 cm  |  Ø 5.6–5.8 cm",
        "stitches": "1 Helai: 44 sc keliling  |  2 Helai: 28 sc keliling",
        "rows": "1 Helai: 7 baris  |  2 Helai: 5 baris",
        "colors": "Hijau Mint (#68C481), Hijau Tua Forest (#438D5A)",
        "load_note": (
            "Hub suspensi utama: Pita Webbing Nylon 1.5 cm × 20 cm dijahit jadi cincin dalam lingkar 18.0 cm (Ø 5.73 cm) di balik kerah rajut "
            "untuk mencegah rajutan melar. Dua Ring D Besi 1.5 cm (kawat 3.0 mm) terpasang di sisi kiri/kanan pada tab webbing 6 cm. "
            "Tutup & pegangan botol 28.0–32.0 cm dibiarkan 100% terbuka."
        ),
        "steps": [
            "Baris 1–2: Kerjakan 44 sc (atau 28 sc pada 2 helai) merata pada diameter Ø 5.8 cm.",
            "Baris 3 (Putaran Lubang Serut / Eyelet): Pada 1 helai: [sc 2, ch 1, sk 1] ×14, sc 2 (membentuk 14 lubang eyelet keliling; posisikan 2 lubang di tengah belakang/depan untuk keluar ujung stopper). Pada 2 helai: [sc 1, ch 1, sk 1] ×14.",
            "Baris 4–7 (atau Baris 4–5 pada 2 helai): Kerjakan 44 sc (28 sc) rapat pada manset atas, akhiri Baris terakhir dengan tusuk mundur (crab stitch) atau slip stitch rapi tepat di tinggi 28.0 cm.",
            "Instalasi Hardware & Fit Leher: (1) Jahit pita Webbing Nylon 1.5 cm × 20 cm di sisi dalam Baris 4–6; (2) Masukkan 2 Ring D 1.5 cm ke tab webbing 15 cm lalu jahit X-box 6 cm ke bawah di sisi kiri & kanan; (3) Sulam 65 cm Paracord 550 4 mm lewat lubang Baris 3 dan pasang stopper pegas 2 lubang; (4) Pasang opsional Ring Silikon Wide-Mouth Ø 5.5–6.0 cm di alur leher 26–27.5 cm di bawah tutup ~6.5 cm.",
        ],
    },
    ("sceptile", "zone-5"): {
        "title": "Zona 5: Relief Kepala Sceptile di Kerah Depan, Jambul & Mata Celah",
        "badge": "Tinggi 21.5–28.0 cm  |  Relief Depan ~7.5×6.5 cm",
        "stitches": "Kubah moncong: MR 6 → 30 sc (half-shell) + 2 jambul runcing (MR 4 → 14 sc)",
        "rows": "Moncong/wajah 12 baris + 2 jambul × 8 baris + rahang bawah 4 baris",
        "colors": "Hijau Mint (#68C481), Merah Coral (#D6615D), Kuning (#E4D17C), Hitam (#1F2421)",
        "load_note": (
            "Dipasang khusus pada dinding depan Zona 3–4 di bawah bibir 28.0 cm (menghindari Ring D kiri/kanan dan jalur tali serut), "
            "sehingga tutup tumbler 28.0–32.0 cm tetap bebas diputar buka-tutup."
        ),
        "steps": [
            "Moncong & Alis Relief: Rajut kubah moncong oval pipih dengan Hijau Mint (#68C481) (MR 6 → 30 sc, 12 baris), isi Dakron padat secukupnya, tambahkan lengkung rahang bawah sabit Merah Coral (#D6615D) di bawah moncong.",
            "Jambul Kepala Runcing Kembar (2 pcs): MR 4 sc, naikkan bertahap ke 14 sc selama 8 baris dalam Hijau Mint; pipihkan ringan lalu jahit miring ke atas-luar di kanan/kiri kerah depan (berhenti sejajar tinggi leher 28 cm agar tidak menghalangi tutup botol).",
            "Sepasang Mata Tajam (2 pcs): Buat bentuk almond Kuning Muda (#E4D17C) (ch 5, sc/hdc/sc berkeliling), sulam pupil celah vertikal Hitam (#1F2421) + titik kilau, beri bingkai kelopak bawah Merah Coral (#D6615D) dan alis Hijau Tua, lalu jahit simetris di sisi atas moncong.",
        ],
    },
    ("sceptile", "zone-6"): {
        "title": "Zona 6: 6 Biji Punggung 3D, Ekor Daun, Bilah Lengan, Kaki & Tali 30/100 cm",
        "badge": "Zona 1–3 + Tali 30 cm & 100 cm",
        "stitches": "Biji: MR 6 → 18 sc; Pangkal ekor: MR 6 → 24 sc; Strap Thermal 100 cm: lebar 8 st",
        "rows": "6 Biji × 7 baris; Ekor 26 baris + 12 bilah daun; Tali 30 cm; Tali 100 cm ~470 baris",
        "colors": "Hijau Mint (#68C481), Hijau Tua (#438D5A), Kuning (#E4D17C), Coral (#D6615D)",
        "load_note": (
            "Seluruh komponen amigurumi 3D dijahit HANYA pada rajutan luar (jangan menembus pita webbing dalam) dan wajib diisi Dakron padat. "
            "Tali Pendek 30 cm & Tali Panjang 100 cm bertumpu 100% pada tulang inti Paracord 550 4 mm yang mengait ke Kait Udang 1.5 cm."
        ),
        "steps": [
            "6 Biji Punggung Kuning (6 pcs): MR 6 → 12 → 18 → 18 → 18 → 12 → 6 sc dengan Kuning Muda (#E4D17C), isi Dakron padat; jahit membentuk 2 kolom vertikal isi 3 biji di punggung tengah-atas (tinggi 13–23 cm).",
            "Ekor Daun Berlapis: Rajut kerucut pangkal ekor Hijau Mint (#68C481) (MR 6 → 24 sc selama 26 baris, melengkung ke atas ±30°, isi Dakron sangat padat); buat sirip daun bergerigi (pasangan atas Hijau Tua #438D5A, pasangan bawah Hijau Mint #68C481 dengan picot ch+sc/hdc/dc) lalu jahit lebar pangkal ekor di tinggi 3.0–9.0 cm belakang.",
            "Lengan & Bilah Daun Pergelangan (2 set): Tabung lengan MR 6 → 12 sc × 14 baris berujung 3 cakar kecil; pada tiap pergelangan jahit 2 helai daun pipih mengarah ke atas (1 bilah tinggi 6 cm Hijau Mint + 1 bilah 4.5 cm Hijau Tua); pasang di sisi tinggi 18.5–20.5 cm.",
            "Kaki Belakang Berotot & 3 Jari (2 pcs): MR 6 → 24 sc paha tirus × 10 baris + bantalan kaki 3 jari, jahit simetris di sudut depan bawah Zona 1–2 (0–6 cm) agar sarung tumbler stabil berdiri rata di meja.",
            "Sepasang Tali Gantungan Lepas-Pasang: (A) Tali Pendek 30 cm = inti Paracord 550 4 mm dipilin/kepang mengait ke 2 Kait Udang 1.5 cm dengan selongsong rajut Polycherry ketat 3.5–4.0 cm warna Emerald/Coral/Kuning; (B) Tali Panjang 100 cm = strap datar Thermal Stitch selebar 8 st (~1.9 cm, ~470 baris) motif Emerald + garis tepi Coral membungkus inti Paracord 550 4 mm utuh hingga kedua Kait Udang 1.5 cm.",
        ],
    },
    ("dragonite", "zone-1"): {
        "title": "Zona 1: Alas Ganda Sandwich EVA 4 mm & Jangkar Kaki Kokoh",
        "badge": "Tinggi 0.0–0.8 cm  |  Ø 0.0–8.0 cm",
        "stitches": "1 Helai: MR 6 → R10 = 60 sc  |  2 Helai: MR 8 → R5 = 40 sc",
        "rows": "1 Helai: 10 putaran luar + 10 putaran dalam + 1 BLO  |  2 Helai: 5 + 5 + 1 BLO",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3)",
        "load_note": (
            "Identik dengan Sceptile: cakram Busa EVA Ø 7.8 cm × 4 mm dijepit antara cakram rajut luar & dalam lalu dikunci putaran BLO. "
            "Menahan beban vertikal penuh 1.3 kg tanpa melengkung ke bawah."
        ),
        "steps": [
            "Opsi 1 Helai (Hakpen 3.0 mm): Kerjakan R1–R10 warna Oranye Emas (#EC9D41) (MR 6 → 60 sc). Buat 1 cakram dalam identik 60 sc.",
            "Opsi 2 Helai (Hakpen 4.5 mm): Kerjakan R1–R5 warna Oranye Emas (#EC9D41) (MR 8 → 40 sc) + cakram dalam identik 40 sc.",
            "Sisipkan cakram Busa EVA Ø 7.8 cm × 4 mm di antara kedua cakram, lalu kerjakan putaran pengunci BLO mengait kedua lapisan sekaligus (60 sc / 40 sc) untuk menghasilkan alas datar anti-melorot.",
        ],
    },
    ("dragonite", "zone-2"): {
        "title": "Zona 2: Silinder Bodi Lurus & Panel Perut Krem Bergaris (Ribbed Belly)",
        "badge": "Tinggi 0.0–20.0 cm  |  Ø 8.0 cm (Keliling 25.13 cm)",
        "stitches": "1 Helai: 60 sc keliling  |  2 Helai: 40 sc keliling",
        "rows": "1 Helai: 52 baris  |  2 Helai: 36 baris",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3)",
        "load_note": (
            "Silinder YU-SC rapat mempertahankan keliling tepat 25.13 cm. Panel perut Krem bergaris membentuk lapisan depan ganda "
            "yang memberi tekstur ikonik tanpa mengubah diameter ruang dalam Ø 8.0 cm."
        ),
        "steps": [
            "Kerjakan silinder lurus warna Oranye Emas (#EC9D41) sebanyak 52 baris (1 helai) atau 36 baris (2 helai) hingga tinggi 20.0 cm.",
            "Panel Perut Krem Bergaris (tinggi depan 1.0–20.0 cm): Rajut terpisah sebagai panel oval tirus warna Krem (#EAD8B3) menggunakan tusuk BLO bergantian tiap 2 baris untuk membentuk ±11 rusuk horizontal tajam (terlebar ~18 st / 7.5 cm di perut tengah, menirus halus ke 12 st / 5.0 cm di dada atas).",
            "Alternatif terintegrasi: kerjakan tapestry/intarsia Krem pada 18 st depan (12 st pada 2 helai) lalu tambahkan rusuk horizontal via surface slip stitch tiap 4 baris; pastikan jahitan panel tetap rata sehingga botol masuk mulus.",
        ],
    },
    ("dragonite", "zone-3"): {
        "title": "Zona 3: Bahu Tirus, Lanjutan Rusuk Leher, Sayap & Jembatan Webbing",
        "badge": "Tinggi 20.0–25.5 cm  |  Ø 8.0 → 5.8 cm",
        "stitches": "1 Helai: 60 sc → 44 sc  |  2 Helai: 40 sc → 28 sc",
        "rows": "1 Helai: 14 baris  |  2 Helai: 10 baris",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3)",
        "load_note": (
            "KRITIS: Dua tab vertikal Webbing Nylon 1.5 cm dari Ring D Zona 4 menjulur turun 6.0 cm melintasi Zona 3 ke atas Zona 2 "
            "(25.5 → 19.5 cm) dan dikunci jahitan X-box benang nylon. Sayap dipasang sedikit ke bahu belakang (posisi jam 10 & jam 2) "
            "agar tidak berbenturan dengan Ring D di sisi jam 9 & jam 3."
        ),
        "steps": [
            "Jadwal Pengurangan 1 Helai (14 baris, 60 → 44 sc): R1–2 sc 60; R3 (13 sc, dec)×4 (56); R4–5 sc 56; R6 (12 sc, dec)×4 (52); R7–8 sc 52; R9 (11 sc, dec)×4 (48); R10–11 sc 48; R12 (10 sc, dec)×4 (44); R13–14 sc 44.",
            "Jadwal Pengurangan 2 Helai (10 baris, 40 → 28 sc): R1 sc 40; R2 (8 sc, dec)×4 (36); R3–4 sc 36; R5 (7 sc, dec)×4 (32); R6–7 sc 32; R8 (6 sc, dec)×4 (28); R9–10 sc 28.",
            "Teruskan penyempitan panel Krem bergaris pada tenggorokan depan hingga tinggi ~22.5–25.5 cm (lebar ~10 st / 4.0 cm) tepat di bawah dagu/moncong Dragonite.",
        ],
    },
    ("dragonite", "zone-4"): {
        "title": "Zona 4: Kerah Leher, Kanal Serut Paracord 550 & Hub Ring D 1.5 cm",
        "badge": "Tinggi 25.5–28.0 cm  |  Ø 5.6–5.8 cm",
        "stitches": "1 Helai: 44 sc keliling  |  2 Helai: 28 sc keliling",
        "rows": "1 Helai: 7 baris  |  2 Helai: 5 baris",
        "colors": "Oranye Emas (#EC9D41)",
        "load_note": (
            "Pita Webbing Nylon 1.5 cm × 20 cm dijahit di balik Baris 4–6 membentuk cincin anti-melar 18.0 cm (Ø 5.73 cm) yang menyalurkan "
            "beban 1.3 kg ke dua Ring D 1.5 cm (kawat 3.0 mm). Tutup & pegangan botol 28.0–32.0 cm dibiarkan 100% terbuka."
        ),
        "steps": [
            "Baris 1–2: 44 sc (atau 28 sc pada 2 helai) melingkar pada leher Ø 5.8 cm dalam Oranye Emas (#EC9D41).",
            "Baris 3 (Putaran Lubang Serut / Eyelet): Pada 1 helai: [sc 2, ch 1, sk 1] ×14, sc 2. Pada 2 helai: [sc 1, ch 1, sk 1] ×14.",
            "Baris 4–7 (atau Baris 4–5 pada 2 helai): 44 sc (28 sc) rapat untuk manset kerah atas, akhiri dengan slip stitch rapi tepat pada tinggi 28.0 cm.",
            "Pasang pita Webbing Nylon 1.5 cm × 20 cm di dalam kerah, lipat 2 tab webbing 15 cm melewati Ring D 1.5 cm lalu jahit X-box 6 cm ke bawah di sisi kiri & kanan, sulam 65 cm Paracord 550 4 mm + stopper 2 lubang, dan pasang opsional Ring Silikon Ø 5.5–6.0 cm di bawah bibir tutup ~6.5 cm.",
        ],
    },
    ("dragonite", "zone-5"): {
        "title": "Zona 5: Moncong Bulat Dragonite, Mata Oval, Tanduk & 2 Antena Lengkung-S",
        "badge": "Tinggi 22.0–28.0 cm  |  Relief Depan ~7.5×6.0 cm",
        "stitches": "Kubah moncong: MR 6 → 30 sc; Tanduk: MR 4 → 10 sc; Antena: tabung spiral 4–5 sc",
        "rows": "Moncong 10 baris; Tanduk 5 baris; 2 Antena × 16 baris",
        "colors": "Oranye Emas (#EC9D41), Krem (#EAD8B3), Tosca (#167B75), Putih Tulang (#DCE0E5), Hitam (#1F2421)",
        "load_note": (
            "Dipasang pada dinding depan dada/kerah (22.0–28.0 cm). Tanduk kecil & 2 antena Krem diarahkan miring lembut ke depan-atas "
            "dari bibir 27.5 cm agar tutup botol 28.0–32.0 cm mudah diputar tanpa tersangkut."
        ),
        "steps": [
            "Moncong Bulat & Pipi: Rajut moncong tebal Oranye Emas (#EC9D41) (MR 6 → 30 sc, 10 baris, isi Dakron padat), sulam 2 lubang hidung kecil dan senyum lembut warna Hitam (#1F2421), jahit terpusat di tinggi 22.5–26.5 cm.",
            "Sepasang Mata Oval (2 pcs): Buat dasar putih oval (#DCE0E5) + iris Hijau Tosca Tua (#167B75) + pupil vertikal Hitam (#1F2421) + kilau putih halus, jahit simetris di kanan-kiri atas moncong.",
            "Tanduk Dahi Tengah: Kerucut mini Oranye Emas (MR 4 → 6 → 8 → 10 sc dalam 5 baris) dijahit tepat di tengah bibir depan tinggi 27.5 cm.",
            "Dua Antena Lengkung-S (2 pcs): Kerjakan tabung spiral rapat 4–5 sc warna Krem (#EAD8B3) sepanjang 16 baris (~6.5 cm); selipkan sisa benang Polycherry pilin di dalamnya agar kaku lalu bentuk kurva huruf S mengapit tanduk dahi.",
        ],
    },
    ("dragonite", "zone-6"): {
        "title": "Zona 6: Sayap 2-Warna, Ekor Gemuk Bergaris, Kaki/Lengan Bercakar & Tali",
        "badge": "Zona 1–3 + Tali 30 cm & 100 cm",
        "stitches": "Ekor: MR 6 → 34 sc; Sayap 2-warna bergerigi 3 titik; Strap Thermal 100 cm: lebar 8 st",
        "rows": "Ekor 32 baris; Sayap 14 baris/sisi; 12 Cakar × 4 baris; Tali 30 cm; Tali 100 cm ~470 baris",
        "colors": "Oranye Emas (#EC9D41), Krem (#EAD8B3), Hijau Tosca (#167B75), Putih Tulang (#DCE0E5)",
        "load_note": (
            "Ekor gemuk & sayap 2-warna dijahit hanya ke dinding luar rajutan (tidak menembus pita webbing) dan diseimbangkan kanan-kiri "
            "agar tumbler 1.3 kg tergantung tegak lurus tanpa miring ke belakang."
        ),
        "steps": [
            "Sepasang Sayap Dragonite 2-Warna (2 pcs, Kiri & Kanan): Rajut membran dalam bentuk sayap kelelawar bergerigi 3 ujung bawah dengan Hijau Tosca Tua (#167B75, 14 baris); buat panel belakang + tulang rangka atas Oranye Emas (#EC9D41); satukan kedua lapisan dengan tusuk sc keliling berwarna Oranye Emas (opsional sisipkan strip tipis EVA 2 mm di tepi tulang atas agar sayap mekar tegas). Jahit di punggung bahu atas tinggi 18.0–24.5 cm sedikit miring ke belakang.",
            "Ekor Gemuk dengan Bagian Bawah Bergaris Krem: Rajut kerucut ekor besar Oranye Emas (MR 6 → 34 sc selama 32 baris, isi Dakron sangat padat melengkung ke atas sepanjang 17 cm agar tidak menyentuh lantai); jahitkan panel Krem (#EAD8B3) bergaris 8 rusuk BLO sepanjang lekukan bawah ekor; pasang pangkal ekor lebar di punggung bawah 2.0–9.5 cm.",
            "Lengan & Kaki Bercakar 12 Cakar (2 lengan + 2 kaki): Lengan pendek gemuk Oranye Emas (MR 6 → 16 sc × 13 baris) dan kaki bulat kokoh (MR 6 → 22 sc × 12 baris); buat 12 kerucut cakar kecil Putih Tulang (#DCE0E5, MR 4 → 6 sc, 4 baris) — 3 per tangan, 3 per kaki — jahit rapi ke ujung jari. Pasang kaki di sudut depan bawah Zona 1–2 (0–6 cm) dan lengan di 17.5–20.5 cm.",
            "Sepasang Tali Gantungan Lepas-Pasang: (A) Tali Pendek 30 cm = inti Paracord 550 4 mm dipilin/kepang ke 2 Kait Udang 1.5 cm dengan selongsong rajut Oranye/Krem/Tosca 4 cm; (B) Tali Panjang 100 cm = strap datar Thermal Stitch 8 st (~1.9 cm, ~470 baris) warna Oranye Emas + strip tengah Krem + tepi Tosca membungkus inti Paracord 550 4 mm utuh hingga kedua Kait Udang 1.5 cm.",
        ],
    },
}


# ---------------------------------------------------------------------------
# Section Builders
# ---------------------------------------------------------------------------
def build_section_1(
    specs: dict[str, Any],
    styles: dict[str, ParagraphStyle],
    image_buffers: list[io.BytesIO],
) -> list[Any]:
    """Section 1: Cover Banner, Executive Summary, Cuculemon 1L Specs & 1.3 kg Engineering."""
    ps = specs["projectSpecs"]
    td = ps["tumblerDimensions"]
    le = ps["loadEngineering"]
    hf = ps["hangerFitSystem"]
    story: list[Any] = []

    # 1. Cover Header Banner
    banner_content = [
        Paragraph(
            "TECHNICAL BLUEPRINT &amp; PANDUAN PERAJUT  •  SKALA PRODUKSI 1:1",
            styles["banner_eyebrow"],
        ),
        Spacer(1, 3),
        Paragraph("Pokemon 3D Crochet Tumbler Case", styles["banner_title"]),
        Spacer(1, 2),
        Paragraph(
            "Panduan Pola Rajut Amigurumi &amp; Konstruksi Beban Berat 1.3 kg untuk Tumbler "
            "<b>Cuculemon 1L Stainless Steel</b> (Desain Sceptile / Jukain &amp; Dragonite / Kairyu)",
            styles["banner_subtitle"],
        ),
    ]
    banner = Table([[banner_content]], colWidths=[CONTENT_W])
    banner.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [7, 7, 7, 7]),
                ("BACKGROUND", (0, 0), (0, 0), INK_DARK),
                ("LINEABOVE", (0, 0), (0, 0), 3.5, EMERALD_ACCENT),
                ("LINEBELOW", (0, 0), (0, 0), 3.0, AMBER_ACCENT),
                ("LEFTPADDING", (0, 0), (0, 0), 14),
                ("RIGHTPADDING", (0, 0), (0, 0), 14),
                ("TOPPADDING", (0, 0), (0, 0), 11),
                ("BOTTOMPADDING", (0, 0), (0, 0), 11),
            ]
        )
    )
    story.append(banner)
    story.append(Spacer(1, 8))

    # 2. 4-Column Executive KPI Strip
    kpis = [
        ("TUMBLER TARGET", f"Ø {td['bodyDiameterCm']} × {td['totalHeightWithLidCm']} cm", f"Cuculemon {td['capacityLiters']:.0f}L Stainless SUS 304"),
        ("TINGGI SARUNG RAJUT", f"{td['crochetCaseHeightCm']} cm", f"Tutup/Handle {td['exposedLidHandleRangeCm']} cm terbuka"),
        ("KAPASITAS BEBAN PENUH", f"{le['designFullWeightKg']} kg ({le['designStaticForceN']} N)", f"Safety Factor 16.9× (min {le['systemWeakestLinkRatingKg']:.0f} kg)"),
        ("SISTEM TALI GANDA", "30 cm &amp; 100 cm", "Core Paracord 550 4mm (0% mulur)"),
    ]
    kpi_cells = [
        [
            Paragraph(lbl, styles["kpi_label"]),
            Paragraph(val, styles["kpi_value"]),
            Paragraph(sub, styles["kpi_sub"]),
        ]
        for lbl, val, sub in kpis
    ]
    kpi_w = (CONTENT_W - 18) / 4.0
    kpi_tbl = Table(
        [[kpi_cells[0], "", kpi_cells[1], "", kpi_cells[2], "", kpi_cells[3]]],
        colWidths=[kpi_w, 6, kpi_w, 6, kpi_w, 6, kpi_w],
    )
    kpi_styles: list[tuple[Any, ...]] = [
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    for col_idx in (0, 2, 4, 6):
        kpi_styles.extend(
            [
                ("BACKGROUND", (col_idx, 0), (col_idx, 0), SURFACE_ALT),
                ("BOX", (col_idx, 0), (col_idx, 0), 0.75, BORDER_SLATE),
                ("LEFTPADDING", (col_idx, 0), (col_idx, 0), 7),
                ("RIGHTPADDING", (col_idx, 0), (col_idx, 0), 7),
                ("TOPPADDING", (col_idx, 0), (col_idx, 0), 6),
                ("BOTTOMPADDING", (col_idx, 0), (col_idx, 0), 6),
            ]
        )
    kpi_tbl.setStyle(TableStyle(kpi_styles))
    story.append(kpi_tbl)
    story.append(Spacer(1, 9))

    # 3. Hero Duo 3D Studio Renders (Side-by-Side)
    left_card = make_studio_card(
        "overview_both_30cm_dims.png",
        card_w=286,
        img_box_h=296,
        caption_html=(
            "<b>Gambar 1.1 — Perbandingan Skala 1:1 (Tali Pendek 30 cm):</b> Sceptile (kiri) &amp; Dragonite (kanan) "
            f"terpasang presisi pada Cuculemon 1L (bodi Ø {td['bodyDiameterCm']} cm, tinggi sarung {td['crochetCaseHeightCm']} cm, "
            f"leher Ø {td['neckDiameterMaxCm']} cm, total botol {td['totalHeightWithLidCm']} cm)."
        ),
        styles=styles,
        image_buffers=image_buffers,
    )
    right_card = make_studio_card(
        "xray_bottle_engineering.png",
        card_w=214,
        img_box_h=296,
        caption_html=(
            "<b>Gambar 1.2 — Tampak X-Ray Engineering:</b> Profil botol baja di dalam dinding YU-SC "
            "memperlihatkan kesesuaian bahu tirus 20.0–25.5 cm, tutup bebas 28.0–32.0 cm, &amp; jalur beban D-Ring 1.5 cm."
        ),
        styles=styles,
        image_buffers=image_buffers,
    )
    hero_row = Table([[left_card, "", right_card]], colWidths=[286, 10, 214])
    hero_row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(hero_row)
    story.append(Spacer(1, 9))

    story.append(
        callout_box(
            "Ringkasan Konsep Produk: Mengapa Desain Ini Berbeda dari Sarung Botol Rajut Biasa?",
            "Mayoritas sarung botol rajut melar di bahu atau tergelincir ke atas saat menanggung botol stainless steel penuh air (±1.3 kg). "
            "Desain ini memisahkan <b>lapisan estetika rajut Polycherry D27</b> dari <b>rangka struktur non-melar</b>: cakram EVA 4 mm di alas, "
            "pita kerah + 2 tab vertikal Webbing Nylon 1.5 cm berjahitan X-box yang memintas pengurangan bahu, tali serut Paracord 550 4 mm di alur leher Ø 5.6–5.8 cm, "
            "serta dua opsi tali (<b>Tali Pendek 30 cm</b> &amp; <b>Tali Panjang 100 cm</b>) berinti Paracord 550 utuh.",
            accent=BLUE_ACCENT,
            bg_color=BLUE_BG,
            styles=styles,
        )
    )

    # Page 2: Detailed Mechanical Spec & Load Engineering
    story.append(PageBreak())

    story.append(
        section_banner(
            "BAGIAN 1",
            "Spesifikasi Dimensi Tumbler & Rekayasa Beban 1.3 kg",
            "Parameter fisik Cuculemon 1L Stainless Steel, faktor keamanan 16.9×, dan arsitektur hanger anti-melorot",
            BLUE_ACCENT,
            BLUE_BG,
            styles,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("Tabel 1.1 — Dimensi Profil Cuculemon 1L Stainless Steel &amp; Kesesuaian Sarung Rajut", styles["h3"]))
    zone_notes_id = {
        "Base": "Dasar datar diperkuat internal dengan cakram Busa EVA 4 mm (rentang 3–5 mm) Ø 7.8 cm.",
        "Straight Body": f"Silinder konstan keliling {td['bodyCircumferenceCm']} cm memeluk dinding stainless steel tanpa celah.",
        "Tapered Shoulder": "Kemiringan tirus 5.5 cm mengikuti bahu botol persis agar rajutan tidak menggembung.",
        "Neck Collar": f"Mengunci rapat tepat di bawah bibir tutup ~{td['capFlangeDiameterCm']} cm agar sarung tidak melorot naik.",
        "Exposed Cap & Carry Handle": "Dibiarkan 100% terbuka demi higienitas minum, buka-tutup ulir, &amp; akses pegangan tutup.",
    }
    zone_names_id = {
        "Base": "Dasar &amp; Bantalan",
        "Straight Body": "Bodi Silinder Lurus",
        "Tapered Shoulder": "Bahu Tirus (Taper)",
        "Neck Collar": "Kerah Leher Pengunci",
        "Exposed Cap & Carry Handle": "Tutup &amp; Handle Terbuka",
    }

    dim_rows = [
        [
            Paragraph("Zona Profil", styles["th"]),
            Paragraph("Rentang Tinggi", styles["th_center"]),
            Paragraph("Diameter", styles["th_center"]),
            Paragraph("Fungsi Teknis &amp; Kesesuaian Fisik Botol", styles["th"]),
        ]
    ]
    for pz in td["profileZones"]:
        zname = zone_names_id.get(pz["zone"], escape(pz["zone"]))
        znote = zone_notes_id.get(pz["zone"], escape(pz["note"]))
        dim_rows.append(
            [
                Paragraph(zname, styles["td_bold"]),
                Paragraph(f"{escape(pz['heightCm'])} cm", styles["td_center"]),
                Paragraph(f"Ø {escape(pz['diameterCm'])} cm", styles["td_center"]),
                Paragraph(znote, styles["td"]),
            ]
        )

    dim_rows.append(
        [
            Paragraph("Ringkasan Keseluruhan", styles["td_bold"]),
            Paragraph(f"Case {td['crochetCaseHeightCm']} cm<br/>Total {td['totalHeightWithLidCm']} cm", styles["td_center"]),
            Paragraph(f"Bodi Ø {td['bodyDiameterCm']} cm<br/>Leher Ø {td['neckDiameterMinCm']}–{td['neckDiameterMaxCm']} cm", styles["td_center"]),
            Paragraph(
                f"Keliling bodi <b>{td['bodyCircumferenceCm']} cm</b> → keliling leher <b>{td['neckCircumferenceRangeCm']} cm</b>; "
                f"flensa tutup <b>Ø ~{td['capFlangeDiameterCm']} cm</b>; area tutup/handle terbuka <b>{td['exposedLidHandleRangeCm']} cm</b>.",
                styles["td"],
            ),
        ]
    )

    dim_tbl = Table(dim_rows, colWidths=[96, 78, 84, 252])
    dim_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]
    for r_idx in range(1, len(dim_rows)):
        bg = BLUE_BG if r_idx == len(dim_rows) - 1 else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        dim_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    dim_tbl.setStyle(TableStyle(dim_style))
    story.append(KeepTogether([dim_tbl]))
    story.append(Spacer(1, 8))

    # Table 1.2: Load Engineering Analysis (Clean Indonesian Labels)
    story.append(Paragraph("Tabel 1.2 — Rekayasa Beban Penuh 1.3 kg &amp; Kekuatan Tarik Komponen", styles["h3"]))
    load_rows = [
        [
            Paragraph("Parameter / Komponen Struktural", styles["th"]),
            Paragraph("Nilai / Kapasitas Uji", styles["th_center"]),
            Paragraph("Peran dalam Jalur Beban 1.3 kg", styles["th"]),
        ],
        [
            Paragraph("Beban Desain Penuh (Tumbler + Air)", styles["td_bold"]),
            Paragraph(f"{le['designFullWeightKg']} kg ({le['designStaticForceN']} N)", styles["td_center"]),
            Paragraph(
                f"Botol SUS 304 kosong ({le['emptyTumblerWeightKg']} kg) + cairan 1L ({le['liquidLoadWeightKg']} kg). "
                f"Target aman min. {le['minimumSafetyFactor']:.0f}× = ≥ {le['minimumRequiredTensileRatingKg']:.1f} kg.",
                styles["td"],
            ),
        ],
        [
            Paragraph("Titik Terlemah &amp; Safety Factor Sistem", styles["td_bold"]),
            Paragraph(f"Tautan Terlemah &gt; {le['systemWeakestLinkRatingKg']:.0f} kg<br/><b>Safety Factor: 16.9×</b>", styles["td_center"]),
            Paragraph(
                "Melebihi standar minimum 3× (4.0 kg) dengan margin lebih dari 5× lipat untuk ayunan jalan &amp; hentakan ringan.",
                styles["td"],
            ),
        ],
        [
            Paragraph("Tali Paracord 550 Tipe III (Ø 4 mm)", styles["td_bold"]),
            Paragraph("Kekuatan putus 249 kg (550 lbs)<br/>Beban kerja aman ~50 kg", styles["td_center"]),
            Paragraph("Inti struktural 3 titik: drawstring leher Ø 5.8 cm, core Tali Pendek 30 cm, &amp; spine Tali Panjang 100 cm.", styles["td"]),
        ],
        [
            Paragraph("Ring D Besi Las (1.5 cm × kawat 3.0 mm)", styles["td_bold"]),
            Paragraph("Beban statis &gt; 35 kg<br/>tanpa deformasi", styles["td_center"]),
            Paragraph("Lebar 1.5 cm hanya 8.2% dari keliling leher 18.2 cm per sisi sehingga tidak menyembul/kedodoran.", styles["td"]),
        ],
        [
            Paragraph("Kait Udang Putar (Swivel Clasp 1.5 cm)", styles["td_bold"]),
            Paragraph("Beban statis &gt; 22 kg<br/>(zinc alloy / besi tebal)", styles["td_center"]),
            Paragraph("4 pcs (2 di Tali Pendek 30 cm, 2 di Tali Panjang 100 cm); pas persis pada lebar dalam Ring D 1.5 cm.", styles["td"]),
        ],
        [
            Paragraph("Pita Webbing Nylon 1.5 cm + Jahitan X-Box", styles["td_bold"]),
            Paragraph("Kuat tarik &gt; 90 kg;<br/>cabut jahitan X-box &gt; 25 kg", styles["td_center"]),
            Paragraph("Cincin kerah 18 cm + 2 tab vertikal 6 cm ke bodi Ø 8.0 cm memintas pengurangan bahu (&lt; 2 mm mulur).", styles["td"]),
        ],
    ]
    load_tbl = Table(load_rows, colWidths=[150, 124, 236])
    load_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]
    for r_idx in range(1, len(load_rows)):
        bg = EMERALD_BG if r_idx == 2 else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        load_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    load_tbl.setStyle(TableStyle(load_style))
    story.append(KeepTogether([load_tbl]))
    story.append(Spacer(1, 8))

    # Hanger System Fit & Straps Callout Card (100% clean Indonesian)
    dc = hf["drawstringChannel"]
    hw = hf["hardware"]
    ss = hf["interchangeableStraps"]["shortStrap"]
    ls = hf["interchangeableStraps"]["longStrap"]

    hanger_body = (
        f"• <b>Proporsi Hardware Presisi Leher Ø 5.6–5.8 cm:</b> Memakai <b>{hw['dRings']['quantityPerCase']} pcs Ring D Besi {hw['dRings']['innerWidthCm']} cm × kawat {hw['dRings']['wireThicknessMm']} mm</b> "
        f"(hanya ~8.2% keliling leher per sisi agar rapi tanpa menyembul seperti ring 2.5–3 cm) berpasangan dengan "
        f"<b>{hw['swivelLobsterClasps']['quantityPerCase']} pcs Kait Udang Putar {hw['swivelLobsterClasps']['innerEyeWidthCm']} cm</b> (2 untuk tali pendek, 2 untuk tali panjang).<br/>"
        f"• <b>Kerah Ganda Anti-Melorot:</b> Pita <b>Webbing Nylon 1.5 cm × 20 cm</b> dijahit menjadi cincin tertutup <b>18.0 cm (Ø 5.73 cm)</b> di balik kerah Zona 4 + "
        f"2 tab jangkar vertikal <b>1.5 cm × 15 cm</b> dijahit X-box turun <b>6.0 cm</b> ke bodi Ø 8.0 cm. Dikunci serutan <b>Paracord 550 4 mm</b> (potong {dc['cordCutLengthCm']} cm) + "
        f"<b>Stopper pegas 2 lubang (Ø lubang 4.5–5.0 mm)</b> tepat di bawah bibir tutup ~6.5 cm.<br/>"
        f"• <b>Opsi Ring Silikon &amp; PERINGATAN UKURAN:</b> Opsional pasang Ring Silikon Leher Tumbler <b>Wide-Mouth ID 5.5–5.8 cm</b> (melar 5.5–6.2 cm, untuk botol 18oz–32oz) di alur leher. "
        f"<b>PERINGATAN:</b> <u>JANGAN beli ukuran 2.8–3.0 cm untuk botol PET/Aqua</u> karena tidak akan muat di leher Cuculemon 1L!<br/>"
        f"• <b>Konstruksi Dua Tali Inti Paracord (0% Mulur):</b> "
        f"<b>(1) Tali Pendek ({ss['totalLengthHookToHookCm']:.0f} cm)</b>: bentang {ss['cordSpanCm']} cm dari Paracord 550 4 mm dipilin/kepang 4-helai + selongsong rajut Polycherry ketat 3.5–4.0 cm di tiap ujung pengait. "
        f"<b>(2) Tali Panjang ({ls['totalLengthHookToHookCm']:.0f} cm / 1 m)</b>: bentang {ls['strapSpanCm']} cm selebar {ls['widthCm']} cm dengan pola <b>Thermal Stitch 8 stitch (~460–480 baris)</b> membungkus tulang inti Paracord 550 4 mm utuh dari pengait ke pengait."
    )
    story.append(
        KeepTogether(
            [
                callout_box(
                    "Hanger System Fit &amp; Konstruksi Tali Pendek 30 cm / Tali Panjang 100 cm",
                    hanger_body,
                    accent=EMERALD_ACCENT,
                    bg_color=EMERALD_BG,
                    styles=styles,
                )
            ]
        )
    )

    return story


def _build_bom_category_table(
    cat_title: str,
    items: list[dict[str, Any]],
    start_no: int,
    cat_bg: colors.Color,
    styles: dict[str, ParagraphStyle],
) -> Table:
    """Build a crisp category-scoped BOM table so no category header ever orphans."""
    rows: list[list[Any]] = [
        [
            Paragraph("No", styles["th_center"]),
            Paragraph("Nama Komponen &amp; Material", styles["th"]),
            Paragraph("Spesifikasi &amp; Fit Ukuran Tumbler", styles["th"]),
            Paragraph("Qty/Case", styles["th_center"]),
            Paragraph("Est. Harga", styles["th_right"]),
            Paragraph("Link Beli", styles["th_center"]),
        ],
        [Paragraph(escape(cat_title), styles["cat_row"]), "", "", "", "", ""],
    ]
    tbl_styles: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("SPAN", (0, 1), (-1, 1)),
        ("BACKGROUND", (0, 1), (-1, 1), cat_bg),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.0),
        ("TOPPADDING", (0, 0), (-1, -1), 3.1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.1),
    ]

    for idx, item in enumerate(items):
        item_no = start_no + idx
        r_idx = idx + 2
        shared_note = " <i>[Dipakai Bersama: Sceptile &amp; Dragonite]</i>" if item["id"] == "yarn-polycherry-black" else ""
        spec_fit = f"{escape(item['spec'])}<br/><b>Fit:</b> {escape(item['fitNote'])}{shared_note}"
        url_escaped = escape(item["shopeeUrl"], quote=True)
        link_html = f'<link href="{url_escaped}"><u>Beli di Shopee</u> {arrow_ne()}</link>'

        rows.append(
            [
                Paragraph(str(item_no), styles["td_center"]),
                Paragraph(escape(item["name"]), styles["td_bold"]),
                Paragraph(spec_fit, styles["td"]),
                Paragraph(escape(item["qtyPerCase"]), styles["td_center"]),
                Paragraph(format_idr(int(item["estPriceIdr"])), styles["td_right"]),
                Paragraph(link_html, styles["link"]),
            ]
        )
        tbl_styles.append(("BACKGROUND", (0, r_idx), (-1, r_idx), SURFACE_ALT if idx % 2 == 1 else colors.white))

    # Col widths sum exactly to 510 pt; 66 pt keeps "Beli di Shopee ↗" on 1 crisp line
    tbl = Table(rows, colWidths=[21, 118, 189, 64, 52, 66], repeatRows=1)
    tbl.setStyle(TableStyle(tbl_styles))
    return tbl


def build_section_2(
    specs: dict[str, Any],
    styles: dict[str, ParagraphStyle],
) -> list[Any]:
    """Section 2: Component-Only BOM (18 items) with clickable Shopee links + Cost Breakdown."""
    bom: list[dict[str, Any]] = specs["bomComponents"]
    story: list[Any] = [PageBreak()]

    story.append(
        section_banner(
            "BAGIAN 2",
            "Bill of Materials (BOM) — Komponen Produk & Link Beli Shopee",
            "Daftar lengkap 18 material pembentuk sarung & sistem gantungan (TANPA alat kerja) dengan tautan pencarian Shopee aktif",
            SHOPEE_CORAL,
            AMBER_BG,
            styles,
        )
    )
    story.append(Spacer(1, 6))

    story.append(
        callout_box(
            "PENTING — CAKUPAN BILL OF MATERIALS (KHUSUS KOMPONEN / MATERIAL CASE)",
            "Tabel BOM di bawah ini <b>HANYA mencantumkan komponen/material fisik produk</b> yang menempel atau membentuk sarung tumbler. "
            "<b>TIDAK mencantumkan alat kerja perajut</b> (tanpa hakpen, jarum tapestri, gunting, penanda rajut, atau korek).",
            accent=AMBER_ACCENT,
            bg_color=AMBER_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 7))

    structural_items = [i for i in bom if not i["id"].startswith("yarn-polycherry-")]
    sceptile_yarn_items = [i for i in bom if i["id"].startswith("yarn-polycherry-") and "sceptile" in i["appliesto"]]
    dragonite_only_items = [i for i in bom if i["id"].startswith("yarn-polycherry-") and i["appliesto"] == ["dragonite"]]

    # Category A fits cleanly on Page 3
    story.append(
        _build_bom_category_table(
            "KATEGORI A — KOMPONEN STRUKTURAL, HARDWARE GANTUNGAN & ISIAN (SCEPTILE & DRAGONITE • 9 ITEM)",
            structural_items,
            start_no=1,
            cat_bg=BLUE_BG,
            styles=styles,
        )
    )

    # Page 4 holds Category B + Category C + Cost Breakdown together cleanly
    story.append(PageBreak())
    story.append(
        _build_bom_category_table(
            "KATEGORI B — PAKET BENANG POLYCHERRY D27: DESAIN SCEPTILE + HITAM BERSAMA (5 ITEM / 6 GULUNG)",
            sceptile_yarn_items,
            start_no=1 + len(structural_items),
            cat_bg=EMERALD_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 7))
    story.append(
        _build_bom_category_table(
            "KATEGORI C — PAKET BENANG POLYCHERRY D27: DESAIN DRAGONITE (4 ITEM KHAS + HITAM NO. 14)",
            dragonite_only_items,
            start_no=1 + len(structural_items) + len(sceptile_yarn_items),
            cat_bg=AMBER_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 8))

    # Dynamic Total Cost Breakdown Box
    structural_sum = sum(int(i["estPriceIdr"]) for i in structural_items)
    sceptile_yarn_sum = sum(int(i["estPriceIdr"]) for i in bom if i["id"].startswith("yarn-polycherry-") and "sceptile" in i["appliesto"])
    dragonite_yarn_sum = sum(int(i["estPriceIdr"]) for i in bom if i["id"].startswith("yarn-polycherry-") and "dragonite" in i["appliesto"])
    total_sceptile = structural_sum + sceptile_yarn_sum
    total_dragonite = structural_sum + dragonite_yarn_sum

    cost_rows = [
        [
            Paragraph("Rincian Anggaran Material per 1 Tumbler Case", styles["th"]),
            Paragraph("Sceptile (Jukain)", styles["th_right"]),
            Paragraph("Dragonite (Kairyu)", styles["th_right"]),
        ],
        [
            Paragraph("Subtotal Komponen Struktural, Hardware &amp; Isian (9 Item Kategori A)", styles["td"]),
            Paragraph(format_idr(structural_sum), styles["td_right"]),
            Paragraph(format_idr(structural_sum), styles["td_right"]),
        ],
        [
            Paragraph("Subtotal Paket Benang Polycherry D27 (5 Warna / 6 Gulung termasuk Hitam)", styles["td"]),
            Paragraph(format_idr(sceptile_yarn_sum), styles["td_right"]),
            Paragraph(format_idr(dragonite_yarn_sum), styles["td_right"]),
        ],
        [
            Paragraph("<b>TOTAL ESTIMASI MODAL PER 1 CASE LENGKAP</b> (termasuk 2 tali 30 cm &amp; 100 cm)", styles["td_bold"]),
            Paragraph(f"<b>{format_idr(total_sceptile)}</b>", styles["td_right"]),
            Paragraph(f"<b>{format_idr(total_dragonite)}</b>", styles["td_right"]),
        ],
    ]
    cost_tbl = Table(cost_rows, colWidths=[318, 96, 96])
    cost_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
                ("BACKGROUND", (0, 1), (-1, 1), colors.white),
                ("BACKGROUND", (0, 2), (-1, 2), SURFACE_ALT),
                ("BACKGROUND", (0, 3), (-1, 3), EMERALD_BG),
                ("BOX", (0, 0), (-1, -1), 0.75, EMERALD_ACCENT),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 4.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ]
        )
    )
    story.append(
        KeepTogether(
            [
                cost_tbl,
                Spacer(1, 4),
                Paragraph(
                    "<i>Catatan efisiensi:</i> Dakron 250g, Busa EVA, Webbing Nylon 1 m, Benang Jahit Nylon, dan Benang Hitam masih menyisakan stok cukup "
                    "untuk membuat karakter kedua (hanya perlu menambah hardware gantung, paracord, &amp; warna khas karakter kedua).",
                    styles["body_sm"],
                ),
            ]
        )
    )

    return story


def build_section_3(
    specs: dict[str, Any],
    styles: dict[str, ParagraphStyle],
) -> list[Any]:
    """Section 3: Polycherry D27 Dual Gauge Guide & 1.3 kg Load-Path Assembly Guide."""
    g = specs["projectSpecs"]["gauge"]
    ss = g["standardSingleStrand"]
    ds = g["heavyDutyDoubleStrandEquivalent"]
    story: list[Any] = [PageBreak()]

    story.append(
        section_banner(
            "BAGIAN 3",
            "Panduan Gauge Polycherry D27 & Perakitan Rangka Beban 1.3 kg",
            "Perbandingan gauge 1 Helai vs 2 Helai serta langkah praktis merakit alas EVA, webbing X-box, dan tali 30/100 cm",
            EMERALD_ACCENT,
            EMERALD_BG,
            styles,
        )
    )
    story.append(Spacer(1, 8))

    story.append(
        callout_box(
            "Standar Benang &amp; Teknik Tusukan Wajib (Anti-Tembus &amp; Dinding Kaku)",
            f"<b>Material Benang:</b> {escape(g['yarn'])}<br/>"
            "<b>Rekomendasi Ukuran Hakpen:</b> <b>3.0 mm (5/0)</b> untuk tension tas rapat 1 helai (single-strand); "
            "atau <b>4.0–4.5 mm</b> jika dirajut rangkap 2 helai (double-strand).<br/>"
            "<b>Teknik Tusukan:</b> Wajib menggunakan <b>Tight Yarn-Under Single Crochet (YU-SC)</b>—kait benang dari atas ke bawah "
            "untuk menghasilkan tusukan huruf 'X' yang rapat, tebal, tidak mudah melar saat membawa 1.3 kg, dan dakron isian 3D tidak tembus pandang.",
            accent=BLUE_ACCENT,
            bg_color=BLUE_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 8))

    story.append(Paragraph("Tabel 3.1 — Perbandingan Gauge: Single-Strand (1 Helai) vs Double-Strand (2 Helai)", styles["h3"]))
    gauge_rows = [
        [
            Paragraph("Parameter Gauge &amp; Hitungan", styles["th"]),
            Paragraph("Opsi A: Single-Strand (1 Helai)<br/>Hakpen 3.0 mm (5/0) — Standar", styles["th_center"]),
            Paragraph("Opsi B: Double-Strand (2 Helai)<br/>Hakpen 4.0–4.5 mm — Tebal Cepat", styles["th_center"]),
        ],
        [
            Paragraph("Kerapatan Lebar Tusukan", styles["td_bold"]),
            Paragraph(f"{ss['widthScPerCm']} sc / cm", styles["td_center"]),
            Paragraph(f"{ds['widthScPerCm']} sc / cm", styles["td_center"]),
        ],
        [
            Paragraph("Kerapatan Tinggi Baris", styles["td_bold"]),
            Paragraph(f"{ss['heightRowsPerCm']} baris / cm", styles["td_center"]),
            Paragraph(f"{ds['heightRowsPerCm']} baris / cm", styles["td_center"]),
        ],
        [
            Paragraph("Bodi Ø 8.0 cm (Keliling 25.13 cm)", styles["td_bold"]),
            Paragraph(f"<b>{ss['bodyDiameter8_0cmStitches']} sc</b> keliling", styles["td_center"]),
            Paragraph(f"<b>{ds['bodyDiameter8_0cmStitches']} sc</b> keliling", styles["td_center"]),
        ],
        [
            Paragraph("Leher Ø 5.8 cm (Keliling 18.2 cm)", styles["td_bold"]),
            Paragraph(f"<b>{ss['neckDiameter5_8cmStitches']} sc</b> keliling", styles["td_center"]),
            Paragraph(f"<b>{ds['neckDiameter5_8cmStitches']} sc</b> keliling", styles["td_center"]),
        ],
        [
            Paragraph("Tinggi Silinder Lurus (0.0–20.0 cm)", styles["td_bold"]),
            Paragraph(f"{ss['cylinder20_0cmRows']} baris", styles["td_center"]),
            Paragraph(f"{ds['cylinder20_0cmRows']} baris", styles["td_center"]),
        ],
        [
            Paragraph("Bahu Tirus 5.5 cm (20.0–25.5 cm)", styles["td_bold"]),
            Paragraph(f"{ss['shoulder5_5cmRows']} baris (60 → 44 sc)", styles["td_center"]),
            Paragraph(f"{ds['shoulder5_5cmRows']} baris (40 → 28 sc)", styles["td_center"]),
        ],
        [
            Paragraph("Kerah Leher 2.5 cm (25.5–28.0 cm)", styles["td_bold"]),
            Paragraph(f"{ss['collar2_5cmRows']} baris (44 sc)", styles["td_center"]),
            Paragraph(f"{ds['collar2_5cmRows']} baris (28 sc)", styles["td_center"]),
        ],
    ]
    gauge_tbl = Table(gauge_rows, colWidths=[150, 180, 180])
    g_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]
    for r_idx in range(1, len(gauge_rows)):
        bg = EMERALD_BG if r_idx in (3, 4) else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        g_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    gauge_tbl.setStyle(TableStyle(g_style))
    story.append(KeepTogether([gauge_tbl]))
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "<i>Verifikasi Matematika Gauge:</i> Baik memakai <b>1 Helai (60 sc → 44 sc)</b> maupun <b>2 Helai (40 sc → 28 sc)</b>, "
            "dimensi akhir tetap tepat <b>Ø 8.0 cm → Ø 5.8 cm × tinggi 28.0 cm</b>. Pastikan uji swatch 5×5 cm sebelum memulai agar botol pas tanpa kedodoran.",
            styles["body_sm"],
        )
    )
    story.append(Spacer(1, 10))

    story.append(Paragraph("Alur Perakitan 5 Langkah — Jalur Penahan Beban 1.3 kg &amp; Pembuatan Tali", styles["h3"]))
    steps_data = [
        (
            "1",
            "Alas Sandwich EVA Ganda (Zona 1)",
            "Rajut 2 cakram alas Ø 8.0 cm (60 sc pada 1 helai atau 40 sc pada 2 helai). Potong 1 cakram <b>Busa EVA / Spon Ati tebal 4 mm berdiameter Ø 7.8 cm</b>. "
            "Selipkan EVA di tengah kedua cakram rajut, lalu kunci dengan 1 putaran <b>BLO (Back Loop Only)</b> yang mengait loop cakram luar dan dalam sekaligus. "
            "Hasilnya alas datar 90° anti-ambles yang menyebarkan beban 1.3 kg merata dan meredam benturan.",
        ),
        (
            "2",
            "Jembatan Webbing Bahu &amp; Jahitan X-Box (Zona 2–3)",
            "Potong 2 pita <b>Webbing Nylon 1.5 cm sepanjang 15 cm</b>. Lipat masing-masing melewati batang datar <b>Ring D 1.5 cm</b> sehingga menyisakan ekor ganda sepanjang ±6.5 cm. "
            "Posisikan di sisi kiri (jam 9) dan kanan (jam 3) dinding dalam dari tinggi 25.5 cm turun ke 19.5 cm pada bodi Ø 8.0 cm, lalu jahit pola <b>kotak silang (X-box stitch)</b> memakai <b>Benang Jahit Nylon Tas No. 30</b>. "
            "Jalur ini memintas tusukan pengurangan bahu sehingga rajutan tidak tertarik memanjang.",
        ),
        (
            "3",
            "Kerah Leher Ø 5.8 cm + Paracord Drawstring + Ring D 1.5 cm (Zona 4)",
            "Jahitkan pita <b>Webbing Nylon 1.5 cm × 20 cm</b> membentuk cincin tertutup lingkar <b>18.0 cm (Ø 5.73 cm)</b> di sisi dalam Baris 4–6 kerah Zona 4 agar leher tidak pernah melar. "
            "Sulamkan <b>65 cm Paracord 550 4 mm</b> melewati putaran lubang eyelet Baris 3 dan pasang <b>Stopper 2 Lubang</b> di bagian depan/belakang. "
            "Opsional: pasangkan <b>Ring Silikon Wide-Mouth Ø 5.5–6.0 cm</b> di leher botol tepat di bawah tutup ~6.5 cm sebagai pengunci gesek ekstra.",
        ),
        (
            "4",
            "Konstruksi Tali Pendek 30 cm (Tali Jinjing)",
            "Potong <b>±55 cm Paracord 550 4 mm</b> (untuk bentang bersih ±22.5 cm + allowance dua pengait 7.5 cm = total <b>30.0 cm</b> dari ujung ke ujung kait). "
            "Pilin atau kepang 4-helai, kaitkan kedua ujungnya langsung pada lubang mata <b>2 pcs Kait Udang Putar 1.5 cm</b> dengan simpul kuat/whipping, "
            "lalu rajut <b>selongsong Polycherry ketat sepanjang 3.5–4.0 cm</b> (warna aksen karakter) menutupi sambungan kedua pangkal kait.",
        ),
        (
            "5",
            "Konstruksi Tali Panjang 100 cm (Thermal Stitch + Inti Paracord)",
            "Potong <b>1.30 m Paracord 550 4 mm</b> utuh sebagai tulang anti-mulur. Rajut tali datar selebar <b>8 stitch (~1.8–2.0 cm)</b> menggunakan teknik <b>Thermal Stitch</b> "
            "(±460–480 baris thermal hingga panjang badan strap <b>92.5 cm</b>; total <b>100.0 cm</b> termasuk 2 Kait Udang 1.5 cm). "
            "Sambil merajut atau di akhir, selipkan inti Paracord 550 ke dalam rongga Thermal Stitch dan kaitkan ujung paracord langsung ke batang kedua Kait Udang 1.5 cm sebelum dikunci selongsong ujung (<b>0% mulur permanen</b>).",
        ),
    ]

    step_rows = []
    for num, title, desc in steps_data:
        badge_para = Paragraph(
            f"<b>{num}</b>",
            ParagraphStyle("stepnum", fontName=FONT_BOLD, fontSize=10, leading=13, textColor=colors.white, alignment=TA_CENTER),
        )
        desc_para = Paragraph(f"<b>{title}</b><br/>{desc}", styles["body_sm"])
        step_rows.append([badge_para, desc_para])

    step_tbl = Table(step_rows, colWidths=[26, 484])
    s_style: list[tuple[Any, ...]] = [
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for r_idx in range(len(step_rows)):
        s_style.append(("BACKGROUND", (0, r_idx), (0, r_idx), EMERALD_ACCENT))
        s_style.append(("BACKGROUND", (1, r_idx), (1, r_idx), SURFACE_ALT if r_idx % 2 == 1 else colors.white))
    step_tbl.setStyle(TableStyle(s_style))
    story.append(step_tbl)

    return story


def build_character_section(
    char_id: str,
    section_label: str,
    accent: colors.Color,
    bg_tint: colors.Color,
    specs: dict[str, Any],
    styles: dict[str, ParagraphStyle],
    image_buffers: list[io.BytesIO],
) -> list[Any]:
    """Build complete multi-angle blueprint, palette swatches, yarn breakdown & Zones 1-6 for a character."""
    char = specs["characters"][char_id]
    yb = char["yarnBreakdown"]
    palette = char["palette"]

    story: list[Any] = [PageBreak()]

    # Section Banner (Note: section_banner escapes strings internally, so pass raw '&')
    subtitle = (
        f"Blueprint Multi-Sudut, Palet Warna & Pola Lengkap Zona 1–6  •  "
        f"Total Benang {yb['totalEstimatedGrams']} g ({yb['rollsToPurchase']} gulung Polycherry D27)"
    )
    story.append(
        section_banner(
            section_label,
            f"Desain {char['name']}",
            subtitle,
            accent,
            bg_tint,
            styles,
        )
    )
    story.append(Spacer(1, 7))

    if char_id == "sceptile":
        panels = [
            ("sceptile_front_30cm.png", "<b>Sudut 1 — Tampak Depan (Tali 30 cm):</b> Moncong, mata celah, kerah V Hijau Tua, sabuk Coral &amp; bilah daun lengan."),
            ("sceptile_back_30cm.png", "<b>Sudut 2 — Tampak Belakang:</b> 6 biji kuning 3D (2×3), garis tulang belakang, stopper leher &amp; ekor daun berlapis."),
            ("sceptile_neck_hanger.png", "<b>Sudut 3 — Detail Leher Ø 5.8 cm:</b> Jambul kembar di bawah bibir 28 cm, serut Paracord 4 mm, Ring D 1.5 cm &amp; webbing."),
            ("sceptile_long_100cm.png", "<b>Sudut 4 — Tali Panjang 100 cm:</b> Strap datar Thermal Stitch 8 st dengan inti Paracord 550 utuh terpasang di Ring D."),
        ]
    else:
        panels = [
            ("dragonite_front_30cm.png", "<b>Sudut 1 — Tampak Depan (Tali 30 cm):</b> Panel perut Krem 11 rusuk, moncong bulat, mata oval, tanduk &amp; 6 cakar kaki."),
            ("dragonite_back_30cm.png", "<b>Sudut 2 — Tampak Belakang:</b> Sepasang sayap 2-warna (Tosca &amp; Oranye), stopper cord lock &amp; ekor gemuk melengkung."),
            ("dragonite_neck_hanger.png", "<b>Sudut 3 — Detail Leher Ø 5.8 cm:</b> Antena lengkung-S Krem bebas tutup, tab webbing X-box &amp; Ring D 1.5 cm + Kait Udang."),
            ("dragonite_long_100cm.png", "<b>Sudut 4 — Tali Panjang 100 cm:</b> Strap panjang selempang 1 meter Thermal Stitch dengan selongsong pengait warna Krem."),
        ]

    card_tl = make_studio_card(panels[0][0], 250, 196, panels[0][1], styles, image_buffers, accent)
    card_tr = make_studio_card(panels[1][0], 250, 196, panels[1][1], styles, image_buffers, accent)
    row1 = Table([[card_tl, "", card_tr]], colWidths=[250, 10, 250])
    row1.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))

    card_bl = make_studio_card(panels[2][0], 278, 165, panels[2][1], styles, image_buffers, accent)
    card_br = make_studio_card(panels[3][0], 222, 165, panels[3][1], styles, image_buffers, accent)
    row2 = Table([[card_bl, "", card_br]], colWidths=[278, 10, 222])
    row2.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))

    story.append(row1)
    story.append(Spacer(1, 6))
    story.append(row2)
    story.append(Spacer(1, 7))

    # Color Palette Swatches + Indonesian Yarn Usage Table
    palette_list = list(palette.values())
    swatch_data = []
    usage_rows = [
        [
            Paragraph("Warna Benang", styles["th"]),
            Paragraph("Hex", styles["th_center"]),
            Paragraph("Terpakai", styles["th_center"]),
            Paragraph("Beli", styles["th_center"]),
            Paragraph("Area Penggunaan pada Pola Zona 1–6", styles["th"]),
        ]
    ]

    for p_entry, c_entry in zip(palette_list, yb["colors"]):
        hex_code = p_entry["hex"]
        loc_info = YARN_USAGE_ID.get((char_id, hex_code), {})
        short_name = loc_info.get("short_name", c_entry["color"])
        usage_id = loc_info.get("usage", c_entry["usage"])

        swatch_data.append(
            {
                "hex": hex_code,
                "label": short_name,
                "grams": c_entry["gramsUsed"],
                "rolls": c_entry["rolls"],
            }
        )
        usage_rows.append(
            [
                Paragraph(escape(short_name), styles["td_bold"]),
                Paragraph(escape(hex_code.upper()), styles["td_center"]),
                Paragraph(f"{c_entry['gramsUsed']} g", styles["td_center"]),
                Paragraph(f"{c_entry['rolls']} gulung", styles["td_center"]),
                Paragraph(escape(usage_id), styles["td"]),
            ]
        )

    story.append(
        Paragraph(
            f"Palet Warna &amp; Alokasi Benang Polycherry D27 ({yb['totalEstimatedGrams']} g Terpakai • {yb['rollsToPurchase']} Gulung • Est. {format_idr(yb['estimatedYarnCostIdr'])})",
            styles["h3"],
        )
    )
    story.append(SwatchRowFlowable(swatch_data, total_width=CONTENT_W, height=54.0))
    story.append(Spacer(1, 6))

    usage_tbl = Table(usage_rows, colWidths=[108, 52, 48, 48, 254])
    u_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.3),
    ]
    for r_idx in range(1, len(usage_rows)):
        u_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), SURFACE_ALT if r_idx % 2 == 0 else colors.white))
    usage_tbl.setStyle(TableStyle(u_style))
    story.append(KeepTogether([usage_tbl]))

    # Next page: Zone 1–6 Pattern Cards
    story.append(PageBreak())
    story.append(
        Paragraph(
            f"Pola Rajut Langkah demi Langkah — {escape(char['name'])} (Zona 1 s.d. Zona 6)",
            styles["sec_title"],
        )
    )
    story.append(
        Paragraph(
            "Singkatan standar: <b>MR</b> = Magic Ring, <b>sc</b> = single crochet (YU-SC), <b>inc</b> = increase (2 sc dalam 1 st), "
            "<b>dec</b> = invisible decrease, <b>BLO</b> = Back Loop Only, <b>ch</b> = chain, <b>sk</b> = skip, <b>st</b> = stitch.",
            styles["body_sm"],
        )
    )
    story.append(Spacer(1, 6))

    for zone in char["zones"]:
        zid = zone["id"]
        loc = ZONE_ID_CONTENT.get((char_id, zid))
        z_title = loc["title"] if loc else zone["title"]
        z_badge = loc["badge"] if loc else f"Tinggi {zone['heightRangeCm']} cm | Ø {zone['diameterRangeCm']}"
        z_stitches = loc["stitches"] if loc else zone["stitches"]
        z_rows = loc["rows"] if loc else zone["rows"]
        z_colors = loc["colors"] if loc else ", ".join(zone["colors"])
        z_load = loc["load_note"] if loc else zone["loadBearingNote"]
        z_steps = loc["steps"] if loc else zone["instructions"]

        hdr_tbl = Table(
            [
                [
                    Paragraph(escape(z_title), styles["zone_title"]),
                    Paragraph(
                        escape(z_badge),
                        ParagraphStyle("zbadge", fontName=FONT_BOLD, fontSize=7.4, leading=10, textColor=colors.white, alignment=TA_RIGHT),
                    ),
                ]
            ],
            colWidths=[326, 184],
        )
        hdr_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), accent),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        meta_html = (
            f"<b>Tusuk (Stitches):</b> {escape(z_stitches)}<br/>"
            f"<b>Baris (Rows):</b> {escape(z_rows)}<br/>"
            f"<b>Warna:</b> {escape(z_colors)}"
        )
        load_html = f"<b>Catatan Beban &amp; Struktur:</b> {escape(z_load)}"
        step_paras = [Paragraph(f"<b>{idx}.</b> {escape(step)}", styles["zone_step"]) for idx, step in enumerate(z_steps, start=1)]

        card_rows = [
            [hdr_tbl],
            [Paragraph(meta_html, styles["zone_meta"])],
            [Paragraph(load_html, styles["zone_note"])],
            [step_paras],
        ]
        z_card = Table(card_rows, colWidths=[CONTENT_W])
        z_card.setStyle(
            TableStyle(
                [
                    ("ROUNDEDCORNERS", [5, 5, 5, 5]),
                    ("BOX", (0, 0), (-1, -1), 0.75, accent),
                    ("BACKGROUND", (0, 1), (0, 1), SURFACE_ALT),
                    ("BACKGROUND", (0, 2), (0, 2), bg_tint),
                    ("BACKGROUND", (0, 3), (0, 3), colors.white),
                    ("LINEBELOW", (0, 1), (0, 1), 0.4, BORDER_SLATE),
                    ("LINEBELOW", (0, 2), (0, 2), 0.4, BORDER_SLATE),
                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 0),
                    ("TOPPADDING", (0, 0), (0, 0), 0),
                    ("BOTTOMPADDING", (0, 0), (0, 0), 0),
                    ("LEFTPADDING", (0, 1), (0, 3), 8),
                    ("RIGHTPADDING", (0, 1), (0, 3), 8),
                    ("TOPPADDING", (0, 1), (0, 3), 4.5),
                    ("BOTTOMPADDING", (0, 1), (0, 3), 5.0),
                ]
            )
        )
        story.append(KeepTogether([z_card, Spacer(1, 7)]))

    return story


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
def main() -> None:
    if not SPECS_PATH.exists():
        raise FileNotFoundError(f"Master specs JSON not found: {SPECS_PATH}")

    with SPECS_PATH.open("r", encoding="utf-8") as fh:
        specs = json.load(fh)

    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    styles = make_styles()
    image_buffers: list[io.BytesIO] = []

    story: list[Any] = []
    story.extend(build_section_1(specs, styles, image_buffers))
    story.extend(build_section_2(specs, styles))
    story.extend(build_section_3(specs, styles))
    story.extend(
        build_character_section(
            "sceptile",
            "BAGIAN 4",
            EMERALD_ACCENT,
            EMERALD_BG,
            specs,
            styles,
            image_buffers,
        )
    )
    story.extend(
        build_character_section(
            "dragonite",
            "BAGIAN 5",
            AMBER_ACCENT,
            AMBER_BG,
            specs,
            styles,
            image_buffers,
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN_L,
        rightMargin=MARGIN_R,
        topMargin=MARGIN_T,
        bottomMargin=MARGIN_B,
        title="Pokemon 3D Crochet Tumbler Case — Technical Blueprint & Panduan Perajut",
        author="Sceptile & Dragonite 1L Crochet Engineering Blueprint",
        subject="Cuculemon 1L Stainless Steel Heavy-Duty Crochet Case Pattern & Shopee BOM",
    )
    doc.build(story, canvasmaker=NumberedBlueprintCanvas)

    for buf in image_buffers:
        buf.close()

    print(f"Generated PDF: {OUTPUT_PDF} ({OUTPUT_PDF.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
