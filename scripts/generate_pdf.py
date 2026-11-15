#!/usr/bin/env python3
"""
Technical Blueprint & Crochet Pattern Guide Generator (v2.0.0)
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
            fontSize=9.3,
            leading=13.0,
            textColor=colors.HexColor("#CBD5E1"),
        ),
        "kpi_label": ParagraphStyle(
            "kpi_label",
            fontName=FONT_BOLD,
            fontSize=6.9,
            leading=9.2,
            textColor=INK_MUTED,
        ),
        "kpi_value": ParagraphStyle(
            "kpi_value",
            fontName=FONT_BOLD,
            fontSize=9.8,
            leading=12.5,
            textColor=INK_DARK,
        ),
        "kpi_sub": ParagraphStyle(
            "kpi_sub",
            fontName=FONT_REGULAR,
            fontSize=7.0,
            leading=9.3,
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
            fontSize=12.8,
            leading=16.0,
            textColor=INK_DARK,
        ),
        "sec_sub": ParagraphStyle(
            "sec_sub",
            fontName=FONT_REGULAR,
            fontSize=8.3,
            leading=11.3,
            textColor=INK_MUTED,
        ),
        "h3": ParagraphStyle(
            "h3",
            fontName=FONT_BOLD,
            fontSize=10.3,
            leading=13.5,
            textColor=INK_DARK,
            spaceBefore=3,
            spaceAfter=2.5,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=FONT_REGULAR,
            fontSize=8.4,
            leading=12.0,
            textColor=INK_BODY,
        ),
        "body_sm": ParagraphStyle(
            "body_sm",
            fontName=FONT_REGULAR,
            fontSize=7.7,
            leading=10.6,
            textColor=INK_BODY,
        ),
        "caption": ParagraphStyle(
            "caption",
            fontName=FONT_REGULAR,
            fontSize=7.4,
            leading=9.8,
            textColor=INK_BODY,
            alignment=TA_LEFT,
        ),
        "th": ParagraphStyle(
            "th",
            fontName=FONT_BOLD,
            fontSize=7.6,
            leading=9.8,
            textColor=colors.white,
        ),
        "th_center": ParagraphStyle(
            "th_center",
            fontName=FONT_BOLD,
            fontSize=7.6,
            leading=9.8,
            textColor=colors.white,
            alignment=TA_CENTER,
        ),
        "th_right": ParagraphStyle(
            "th_right",
            fontName=FONT_BOLD,
            fontSize=7.6,
            leading=9.8,
            textColor=colors.white,
            alignment=TA_RIGHT,
        ),
        "td": ParagraphStyle(
            "td",
            fontName=FONT_REGULAR,
            fontSize=7.4,
            leading=9.8,
            textColor=INK_BODY,
        ),
        "td_bold": ParagraphStyle(
            "td_bold",
            fontName=FONT_BOLD,
            fontSize=7.4,
            leading=9.8,
            textColor=INK_DARK,
        ),
        "td_center": ParagraphStyle(
            "td_center",
            fontName=FONT_REGULAR,
            fontSize=7.4,
            leading=9.8,
            textColor=INK_BODY,
            alignment=TA_CENTER,
        ),
        "td_right": ParagraphStyle(
            "td_right",
            fontName=FONT_BOLD,
            fontSize=7.4,
            leading=9.8,
            textColor=INK_DARK,
            alignment=TA_RIGHT,
        ),
        "cat_row": ParagraphStyle(
            "cat_row",
            fontName=FONT_BOLD,
            fontSize=7.6,
            leading=10.0,
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
            fontSize=8.6,
            leading=11.4,
            textColor=INK_DARK,
        ),
        "callout_body": ParagraphStyle(
            "callout_body",
            fontName=FONT_REGULAR,
            fontSize=7.7,
            leading=10.8,
            textColor=INK_BODY,
        ),
        "zone_title": ParagraphStyle(
            "zone_title",
            fontName=FONT_BOLD,
            fontSize=9.0,
            leading=11.8,
            textColor=colors.white,
        ),
        "zone_meta": ParagraphStyle(
            "zone_meta",
            fontName=FONT_REGULAR,
            fontSize=7.5,
            leading=10.2,
            textColor=INK_BODY,
        ),
        "zone_note": ParagraphStyle(
            "zone_note",
            fontName=FONT_REGULAR,
            fontSize=7.6,
            leading=10.4,
            textColor=INK_DARK,
        ),
        "zone_step": ParagraphStyle(
            "zone_step",
            fontName=FONT_REGULAR,
            fontSize=7.7,
            leading=10.8,
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
            self.drawString(MARGIN_L, PAGE_H - 10 * mm, "POKEMON 3D CROCHET TUMBLER CASE  |  BLUEPRINT TEKNIS v2.0 & PANDUAN PERAJUT")
            self.setFont(FONT_REGULAR, 7.2)
            self.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 10 * mm, "Cuculemon 1L (Ø 8.0 × 32.0 cm) • Case 27.8 cm • Beban 1.3 kg")

        self.setStrokeColor(BORDER_SLATE)
        self.setLineWidth(0.5)
        self.line(MARGIN_L, 11 * mm, PAGE_W - MARGIN_R, 11 * mm)
        self.setFont(FONT_REGULAR, 7.2)
        self.setFillColor(INK_MUTED)
        self.drawString(MARGIN_L, 7.5 * mm, "Sceptile (Jukain) & Dragonite (Kairyu) • Polycherry D27 • Ring Silikon Ø 5.7 cm + Tali 30 cm / 100 cm")
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
                ("TOPPADDING", (0, 0), (0, 0), 6.5),
                ("BOTTOMPADDING", (0, 0), (0, 0), 6.5),
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
        Spacer(1, 2.2),
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
                ("TOPPADDING", (0, 0), (0, 0), 6.5),
                ("BOTTOMPADDING", (0, 0), (0, 0), 6.5),
            ]
        )
    )
    return tbl


# ---------------------------------------------------------------------------
# Indonesian Localization Maps (100% Synced to project_specs.json v2.0.0)
# ---------------------------------------------------------------------------
YARN_USAGE_ID: dict[tuple[str, str], dict[str, str]] = {
    ("sceptile", "#68C481"): {
        "short_name": "Hijau Mint / Emerald",
        "usage": "Silinder bodi utama Ø 8.0 cm, alas, kerah leher Ø 5.8 cm, 4 simpul pengikat ring silikon, lengan/kaki, bilah daun bawah, jambul, & strap",
    },
    ("sceptile", "#438D5A"): {
        "short_name": "Hijau Tua Forest",
        "usage": "Bingkai kerah V dada, garis tulang punggung, sirip daun ekor atas, & daun pergelangan tangan",
    },
    ("sceptile", "#D6615D"): {
        "short_name": "Merah Bata / Coral",
        "usage": "Sabuk perut (belly belt), aksen rahang bawah, garis kelopak mata bawah, manik ujung tali serut (bead tips), & selongsong ujung strap",
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
        "usage": "Bodi utama Ø 8.0 cm, alas, kerah leher, 4 simpul pengikat ring silikon, ekor gemuk, kaki/tangan, rangka sayap, tanduk, & strap",
    },
    ("dragonite", "#EAD8B3"): {
        "short_name": "Krem / Ivory",
        "usage": "Panel perut bergaris 12 rusuk, panel bawah ekor 8 rusuk, manik ujung tali serut, & 2 antena lengkung-S di dahi",
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
        "badge": "Tinggi 0.0–21.5 cm  |  Ø 8.0 cm (Kll. 25.13 cm)",
        "stitches": "1 Helai: 60 sc keliling  |  2 Helai: 40 sc keliling",
        "rows": "1 Helai: 56 baris  |  2 Helai: 39 baris",
        "colors": "Hijau Mint (#68C481), Merah Coral (#D6615D), Hijau Tua (#438D5A)",
        "load_note": (
            "Tusukan Yarn-Under SC (YU-SC) rapat membentuk selongsong silinder kaku berkeliling tepat 25.13 cm "
            "yang memeluk penuh dinding stainless steel 0.0–21.5 cm agar beban vertikal terbagi merata melalui gesekan dinding tanpa melorot."
        ),
        "steps": [
            "Kerjakan silinder lurus dengan YU-SC rapat: Baris 1–11 (1 helai) atau Baris 1–7 (2 helai) memakai Hijau Mint (#68C481).",
            "Sabuk Perut Merah Coral (tinggi ~4.5–8.0 cm): Pada Baris 12–21 (1 helai) atau Baris 8–14 (2 helai), ganti 38 st bagian depan/samping (25 st pada 2 helai) menjadi Merah Coral (#D6615D) sambil mempertahankan 22 st belakang tetap Hijau Mint.",
            "Baris 22–56 (1 helai) / Baris 15–39 (2 helai): Lanjutkan Hijau Mint lurus hingga tinggi 21.5 cm. Tambahkan garis tulang punggung vertikal 3 st dengan Hijau Tua (#438D5A) di tengah belakang (st 29–31) via surface slip stitch atau intarsia.",
            "Awal Kerah V Dada (19.0–21.5 cm): Pada Baris 49–56 di tengah depan, mulai garis V Hijau Tua (#438D5A) yang mengerucut ke titik tengah dada.",
        ],
    },
    ("sceptile", "zone-3"): {
        "title": "Zona 3: Bahu Kubah Cembung & Puncak Kerah V Dada",
        "badge": "Tinggi 21.5–24.8 cm  |  Ø 8.0 → 5.7 cm",
        "stitches": "1 Helai: 60 sc → 44 sc  |  2 Helai: 40 sc → 28 sc",
        "rows": "1 Helai: 9 baris  |  2 Helai: 6 baris",
        "colors": "Hijau Mint (#68C481), Hijau Tua Forest (#438D5A)",
        "load_note": (
            "Mengikuti persis profil kubah cembung botol Cuculemon 1L (tinggi 21.5–24.8 cm, panjang lengkung 3.3 cm). "
            "Karena Ring Silikon pada Zona 4 menumpu beban 1.3 kg langsung di bawah bibir tutup Ø ~6.0 cm, "
            "tusukan pengurangan bahu Zona 3 terbebas dari tarikan beban tali (0% melar ke atas)."
        ),
        "steps": [
            "Jadwal Pengurangan Kubah Cembung 1 Helai (9 baris, 60 → 44 sc): R1–2 sc 60; R3 (13 sc, dec)×4 (56); R4 sc 56; R5 (12 sc, dec)×4 (52); R6 (11 sc, dec)×4 (48); R7 sc 48; R8 (10 sc, dec)×4 (44); R9 sc 44.",
            "Jadwal Pengurangan Kubah Cembung 2 Helai (6 baris, 40 → 28 sc): R1 sc 40; R2 (8 sc, dec)×4 (36); R3 (7 sc, dec)×4 (32); R4 sc 32; R5 (6 sc, dec)×4 (28); R6 sc 28.",
            "Selesaikan bingkai kerah V Hijau Tua (#438D5A) membungkus bahu kiri/kanan menuju ujung lancip V di tengah depan pada tinggi ~20.5 cm.",
            "Uji pasang (test-fit) pada botol Cuculemon 1L sebelum masuk Zona 4: kubah rajut 3.3 cm harus memeluk bahu baja secara rata tanpa celah udara.",
        ],
    },
    ("sceptile", "zone-4"): {
        "title": "Zona 4: Kerah Leher Vertikal, Serut Sulam 14 Eyelet & Ring Silikon",
        "badge": "Tinggi 24.8–27.8 cm  |  Ø 5.6–5.8 cm",
        "stitches": "1 Helai: 44 sc  |  2 Helai: 28 sc (takik 3 st kiri/kanan)",
        "rows": "1 Helai: 8 baris  |  2 Helai: 6 baris",
        "colors": "Hijau Mint (#68C481), Merah Coral (#D6615D — manik ujung tali)",
        "load_note": (
            "HUB SUSPENSI UTAMA 1.3 KG (Ring Silikon & Serut Sulam): Ring Silikon Tumbler Wide-Mouth (ID 5.5–5.8 cm) duduk tepat di manset rajut atas "
            "(y = 26.6–27.8 cm) di bawah bibir tutup ulir Ø ~6.0 cm dan disatukan dengan kerah rajut lewat 4 simpul jahit lilit Polycherry. "
            "Tepat di bawahnya (y = 25.4–26.2 cm), tali serut Paracord 550 disulam keluar-masuk 14 eyelet + stopper pegas 2 lubang. Tutup, flip-straw & side carry loop 27.8–32.0 cm dibiarkan 100% bebas."
        ),
        "steps": [
            "Baris 1–2 (24.8–25.5 cm): Kerjakan 44 sc (atau 28 sc pada 2 helai) lurus ke atas memeluk bagian leher hitam Ø 5.8 cm.",
            "Baris 3 (25.4–26.2 cm — Putaran Tali Serut 14 Eyelet): Pada 1 helai: [sc 2, ch 1, sk 1] ×14, sc 2 (14 lubang merata). Pada 2 helai: [sc 1, ch 1, sk 1] ×14. Sulamkan 65 cm Paracord 550 4 mm KELUAR-MASUK melewati seluruh 14 lubang eyelet, keluarkan kedua ujung di sisi belakang/samping melalui 2 lubang bersebelahan ke Stopper Pegas 2 Lubang + rajut 2 manik ujung Merah Coral (MR 6 → 6 sc → tutup) membungkus simpul ujung tali.",
            "Baris 4–5 (26.2–26.9 cm): Kerjakan 44 sc (28 sc) rapat naik memeluk bagian leher silver atas.",
            "Baris 6–8 (26.6–27.8 cm — Dudukan Ring Silikon & Takik Kuping): Kerjakan 44 sc (28 sc) hingga tinggi tepat 27.8 cm, dengan menyisakan 2 takik/potongan dangkal selebar 3 stitch di posisi jam 3 & jam 9 (skip 3 st / slip stitch rendah pada R7–8) agar kedua lubang kuping samping bawaan Ring Silikon duduk rata tanpa mengganjal.",
            "Satukan Ring Silikon & Kait Tali: Selipkan Ring Silikon Tumbler Wide-Mouth (ID 5.5–5.8 cm) ke manset rajut atas y = 26.6–27.8 cm di bawah flensa tutup Ø ~6.0 cm. Kunci keduanya menjadi satu kesatuan memakai 4 simpul jahit lilit Polycherry (whip-stitch/tacking loops di depan, belakang, kiri, kanan — melingkari bibir bawah ring silikon & tusuk kerah atas). Kaitkan Kait Udang 1.5 cm dari Tali 30 cm / 100 cm LANGSUNG ke 2 kuping samping Ring Silikon.",
        ],
    },
    ("sceptile", "zone-5"): {
        "title": "Zona 5: Relief Kepala Sceptile di Kerah Depan, Jambul & Mata Celah",
        "badge": "Tinggi 21.5–27.8 cm  |  Relief Depan ~7.5×6.3 cm",
        "stitches": "Kubah moncong: MR 6 → 30 sc (half-shell) + 2 jambul runcing (MR 4 → 14 sc)",
        "rows": "Moncong/wajah 12 baris + 2 jambul × 8 baris + rahang bawah 4 baris",
        "colors": "Hijau Mint (#68C481), Merah Coral (#D6615D), Kuning (#E4D17C), Hitam (#1F2421)",
        "load_note": (
            "Dipasang khusus pada lengkung depan dada/kerah di bawah bibir 27.8 cm (bebas dari kuping samping Ring Silikon di jam 3 & jam 9 "
            "maupun stopper tali serut di belakang), sehingga tutup botol, flip-straw spout, & side carry loop 27.8–32.0 cm tetap bebas 100%."
        ),
        "steps": [
            "Moncong & Alis Relief: Rajut kubah moncong oval pipih dengan Hijau Mint (#68C481) (MR 6 → 30 sc, 12 baris), isi Dakron padat secukupnya, tambahkan lengkung rahang bawah sabit Merah Coral (#D6615D) di bawah moncong.",
            "Jambul Kepala Runcing Kembar (2 pcs): MR 4 sc, naikkan bertahap ke 14 sc selama 8 baris dalam Hijau Mint; pipihkan ringan lalu jahit miring ke atas-luar di kanan/kiri kerah depan di bawah batas 27.8 cm agar tidak menghalangi putaran tutup botol.",
            "Sepasang Mata Tajam (2 pcs): Buat bentuk almond Kuning Muda (#E4D17C) (ch 5, sc/hdc/sc berkeliling), sulam pupil celah vertikal Hitam (#1F2421) + titik kilau, beri bingkai kelopak bawah Merah Coral (#D6615D) dan alis Hijau Tua, lalu jahit simetris di sisi atas moncong.",
        ],
    },
    ("sceptile", "zone-6"): {
        "title": "Zona 6: 6 Biji Punggung, Ekor Daun, Lengan, Kaki & Tali 30/100 cm",
        "badge": "Zona 1–3 + Tali 30 cm & 100 cm",
        "stitches": "Biji: MR 6 → 18 sc; Pangkal ekor: MR 6 → 24 sc; Strap Thermal 100 cm: lebar 8 st",
        "rows": "6 Biji × 7 baris; Ekor 26 baris + 12 bilah daun; Tali 30 cm; Tali 100 cm ~470 baris",
        "colors": "Hijau Mint (#68C481), Hijau Tua (#438D5A), Kuning (#E4D17C), Coral (#D6615D)",
        "load_note": (
            "Seluruh komponen amigurumi 3D dijahit ke dinding rajutan luar dan wajib diisi Dakron padat agar ekor & anggota badan kokoh berdiri. "
            "Kedua tali lepas-pasang bertumpu pada tulang inti Paracord 550 4 mm yang Kait Udang 1.5 cm-nya mengait LANGSUNG ke 2 kuping samping Ring Silikon."
        ),
        "steps": [
            "6 Biji Punggung Kuning (6 pcs): MR 6 → 12 → 18 → 18 → 18 → 12 → 6 sc dengan Kuning Muda (#E4D17C), isi Dakron padat; jahit membentuk 2 kolom vertikal isi 3 biji di punggung tengah-atas (tinggi 14.0–23.5 cm).",
            "Ekor Daun Berlapis: Rajut kerucut pangkal ekor Hijau Mint (#68C481) (MR 6 → 24 sc selama 26 baris, melengkung ke atas ±30°, isi Dakron sangat padat); buat sirip daun bergerigi (pasangan atas Hijau Tua #438D5A, pasangan bawah Hijau Mint #68C481 dengan picot ch+sc/hdc/dc) lalu jahit lebar pangkal ekor di tinggi 3.0–9.5 cm belakang.",
            "Lengan & Bilah Daun Pergelangan (2 set): Tabung lengan MR 6 → 12 sc × 14 baris berujung 3 cakar kecil; pada tiap pergelangan jahit 2 helai daun pipih mengarah ke atas (1 bilah tinggi 6 cm Hijau Mint + 1 bilah 4.5 cm Hijau Tua); pasang di sisi tinggi 19.0–21.5 cm.",
            "Kaki Belakang Berotot & 3 Jari (2 pcs): MR 6 → 24 sc paha tirus × 10 baris + bantalan kaki 3 jari, jahit simetris di sudut depan bawah Zona 1–2 (0–6 cm) agar sarung tumbler stabil berdiri rata di meja.",
            "Tali Gantungan Lepas-Pasang (Kait Langsung ke Kuping Ring Silikon): (A) Tali Pendek 30 cm = inti Paracord 550 4 mm dipilin/kepang mengait ke 2 Kait Udang 1.5 cm dengan selongsong rajut Polycherry ketat 4 cm warna Emerald/Coral/Kuning; (B) Tali Panjang 100 cm = strap datar Thermal Stitch lebar 8 st (~1.9 cm, ~470 baris) motif Emerald + tepi Coral membungkus inti Paracord 550 4 mm utuh hingga kedua Kait Udang 1.5 cm. Kaitkan langsung ke 2 lubang kuping Ring Silikon.",
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
        "title": "Zona 2: Silinder Bodi Lurus & Panel Perut Krem 12 Rusuk",
        "badge": "Tinggi 0.0–21.5 cm  |  Ø 8.0 cm (Kll. 25.13 cm)",
        "stitches": "1 Helai: 60 sc keliling  |  2 Helai: 40 sc keliling",
        "rows": "1 Helai: 56 baris  |  2 Helai: 39 baris",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3)",
        "load_note": (
            "Silinder YU-SC rapat mempertahankan keliling tepat 25.13 cm di sepanjang dinding 0.0–21.5 cm. "
            "Panel perut Krem 12 rusuk menambah kekakuan lapis ganda bagian depan tanpa mengubah diameter ruang dalam Ø 8.0 cm."
        ),
        "steps": [
            "Kerjakan silinder lurus warna Oranye Emas (#EC9D41) sebanyak 56 baris (1 helai) atau 39 baris (2 helai) hingga tinggi 21.5 cm.",
            "Panel Perut Krem Bergaris (tinggi depan 1.0–21.5 cm): Rajut terpisah sebagai panel oval tirus warna Krem (#EAD8B3) menggunakan tusuk BLO bergantian tiap 2 baris untuk membentuk 12 rusuk horizontal tajam (terlebar ~18 st / 7.5 cm di perut tengah, menirus halus ke 12 st / 5.0 cm di dada atas).",
            "Alternatif terintegrasi: kerjakan tapestry/intarsia Krem pada 18 st depan (12 st pada 2 helai) lalu tambahkan rusuk horizontal via surface slip stitch tiap 4 baris; jahit rata ke dinding depan sehingga tumbler tetap keluar-masuk dengan mulus.",
        ],
    },
    ("dragonite", "zone-3"): {
        "title": "Zona 3: Bahu Kubah Cembung, Lanjutan Rusuk Tenggorokan & Sayap",
        "badge": "Tinggi 21.5–24.8 cm  |  Ø 8.0 → 5.7 cm",
        "stitches": "1 Helai: 60 sc → 44 sc  |  2 Helai: 40 sc → 28 sc",
        "rows": "1 Helai: 9 baris  |  2 Helai: 6 baris",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3)",
        "load_note": (
            "Memeluk mulus lengkung kubah baja 3.3 cm (21.5–24.8 cm). Karena Ring Silikon pada Zona 4 menumpu 1.3 kg langsung di bawah bibir tutup Ø ~6.0 cm, "
            "rajutan bahu Zona 3 tidak mengalami regangan tarik ke atas. Sepasang sayap punggung dipasang pada jam 10 & jam 2 di belakang kuping Ring Silikon."
        ),
        "steps": [
            "Jadwal Pengurangan Kubah Cembung 1 Helai (9 baris, 60 → 44 sc): R1–2 sc 60; R3 (13 sc, dec)×4 (56); R4 sc 56; R5 (12 sc, dec)×4 (52); R6 (11 sc, dec)×4 (48); R7 sc 48; R8 (10 sc, dec)×4 (44); R9 sc 44.",
            "Jadwal Pengurangan Kubah Cembung 2 Helai (6 baris, 40 → 28 sc): R1 sc 40; R2 (8 sc, dec)×4 (36); R3 (7 sc, dec)×4 (32); R4 sc 32; R5 (6 sc, dec)×4 (28); R6 sc 28.",
            "Teruskan penyempitan panel Krem bergaris pada tenggorokan depan hingga tinggi 24.8 cm (lebar ~10 st / 4.0 cm) tepat di bawah dagu/moncong Dragonite.",
        ],
    },
    ("dragonite", "zone-4"): {
        "title": "Zona 4: Kerah Leher Vertikal, Serut Sulam 14 Eyelet & Ring Silikon",
        "badge": "Tinggi 24.8–27.8 cm  |  Ø 5.6–5.8 cm",
        "stitches": "1 Helai: 44 sc  |  2 Helai: 28 sc (takik 3 st kiri/kanan)",
        "rows": "1 Helai: 8 baris  |  2 Helai: 6 baris",
        "colors": "Oranye Emas (#EC9D41), Krem / Ivory (#EAD8B3 — manik ujung tali)",
        "load_note": (
            "HUB SUSPENSI UTAMA 1.3 KG (Ring Silikon & Serut Sulam): Ring Silikon Tumbler Wide-Mouth (ID 5.5–5.8 cm) menyatu dengan manset rajut atas "
            "(y = 26.6–27.8 cm) di bawah flensa tutup Ø ~6.0 cm melalui 4 simpul jahit lilit Polycherry. Tepat di bawahnya (y = 25.4–26.2 cm), "
            "Paracord 550 4 mm disulam keluar-masuk 14 lubang eyelet & dikunci stopper 2 lubang. Tutup, flip-straw & side carry loop 27.8–32.0 cm bebas 100%."
        ),
        "steps": [
            "Baris 1–2 (24.8–25.5 cm): Kerjakan 44 sc (atau 28 sc pada 2 helai) melingkar pada leher hitam bawah Ø 5.8 cm dalam Oranye Emas (#EC9D41).",
            "Baris 3 (25.4–26.2 cm — Putaran Tali Serut 14 Eyelet): Pada 1 helai: [sc 2, ch 1, sk 1] ×14, sc 2. Pada 2 helai: [sc 1, ch 1, sk 1] ×14. Sulam 65 cm Paracord 550 4 mm KELUAR-MASUK melewati ke-14 lubang eyelet, keluarkan kedua ujung di 2 lubang belakang/samping ke Stopper Pegas 2 Lubang + rajut 2 manik ujung warna Krem (#EAD8B3) membungkus simpul ujung.",
            "Baris 4–5 (26.2–26.9 cm): Kerjakan 44 sc (28 sc) rapat memeluk leher silver bagian atas.",
            "Baris 6–8 (26.6–27.8 cm — Dudukan Ring Silikon & Takik Kuping): Kerjakan 44 sc (28 sc) hingga tepat 27.8 cm sambil membuat 2 takik dangkal selebar 3 stitch di sisi kiri (jam 9) & kanan (jam 3) agar kuping samping Ring Silikon pas masuk dengan rata.",
            "Satukan Ring Silikon & Kait Tali: Pasang Ring Silikon Wide-Mouth (ID 5.5–5.8 cm) pada manset atas y = 26.6–27.8 cm tepat di bawah bibir tutup Ø ~6.0 cm, lalu kunci menjadi satu kesatuan memakai 4 simpul jahit lilit Polycherry (depan, belakang, kiri, kanan melewati bibir bawah ring silikon & tusuk kerah atas). Kaitkan langsung Kait Udang 1.5 cm ke kedua kuping samping Ring Silikon.",
        ],
    },
    ("dragonite", "zone-5"): {
        "title": "Zona 5: Moncong Dragonite, Mata Oval, Tanduk & 2 Antena-S",
        "badge": "Tinggi 21.8–27.8 cm  |  Relief Depan ~7.5×6.0 cm",
        "stitches": "Kubah moncong: MR 6 → 30 sc; Tanduk: MR 4 → 10 sc; Antena: tabung spiral 4–5 sc",
        "rows": "Moncong 10 baris; Tanduk 5 baris; 2 Antena × 16 baris",
        "colors": "Oranye Emas (#EC9D41), Krem (#EAD8B3), Tosca (#167B75), Putih Tulang (#DCE0E5), Hitam (#1F2421)",
        "load_note": (
            "Dipasang pada dinding depan dada/kerah (21.8–27.8 cm), bebas dari kuping samping Ring Silikon. "
            "Tanduk kecil & 2 antena Krem diarahkan miring lembut ke depan-atas dari bibir 27.5 cm agar tutup ulir & flip-straw 27.8–32.0 cm bebas diputar."
        ),
        "steps": [
            "Moncong Bulat & Pipi: Rajut moncong tebal Oranye Emas (#EC9D41) (MR 6 → 30 sc, 10 baris, isi Dakron padat), sulam 2 lubang hidung kecil dan senyum lembut Hitam (#1F2421), jahit terpusat di tinggi 22.0–26.2 cm.",
            "Sepasang Mata Oval (2 pcs): Buat iris oval Hijau Tosca Tua (#167B75) + pupil vertikal Hitam (#1F2421) + kilau sabit Putih Tulang (#DCE0E5), jahit simetris di kanan-kiri atas moncong.",
            "Tanduk Dahi Tengah: Kerucut mini Oranye Emas (MR 4 → 6 → 8 → 10 sc dalam 5 baris) dijahit tepat di tengah bibir depan tinggi 27.3 cm.",
            "Dua Antena Lengkung-S (2 pcs): Kerjakan tabung spiral rapat 4–5 sc warna Krem (#EAD8B3) sepanjang 16 baris (~6.5 cm); selipkan sisa benang Polycherry pilin di dalamnya agar kaku lalu bentuk kurva huruf S mengapit tanduk dahi.",
        ],
    },
    ("dragonite", "zone-6"): {
        "title": "Zona 6: Sayap 2-Warna, Ekor Bergaris, Kaki/Lengan & Tali 30/100 cm",
        "badge": "Zona 1–3 + Tali 30 cm & 100 cm",
        "stitches": "Ekor: MR 6 → 34 sc; Sayap 2-warna bergerigi 3 titik; Strap Thermal 100 cm: lebar 8 st",
        "rows": "Ekor 32 baris; Sayap 14 baris/sisi; 12 Cakar × 4 baris; Tali 30 cm; Tali 100 cm ~470 baris",
        "colors": "Oranye Emas (#EC9D41), Krem (#EAD8B3), Hijau Tosca (#167B75), Putih Tulang (#DCE0E5)",
        "load_note": (
            "Ekor gemuk & sayap 2-warna dijahit ke dinding luar rajutan secara simetris agar tumbler 1.3 kg tergantung tegak lurus tanpa miring. "
            "Tali Pendek 30 cm & Tali Panjang 100 cm memakai tulang inti Paracord 550 4 mm yang Kait Udang 1.5 cm-nya mengait LANGSUNG ke kuping samping Ring Silikon."
        ),
        "steps": [
            "Sepasang Sayap Dragonite 2-Warna (2 pcs, Kiri & Kanan): Rajut membran dalam sayap kelelawar bergerigi 3 ujung bawah dengan Hijau Tosca Tua (#167B75, 14 baris); buat lapisan belakang + tulang rangka atas Oranye Emas (#EC9D41); satukan kedua lapisan dengan tusuk sc keliling Oranye Emas (opsional sisipkan strip tipis EVA 2 mm di tulang atas agar sayap mekar tegas). Jahit di punggung bahu atas tinggi 19.0–24.5 cm (jam 10 & jam 2) di belakang kuping Ring Silikon.",
            "Ekor Gemuk dengan Bagian Bawah Bergaris Krem: Rajut kerucut ekor besar Oranye Emas (MR 6 → 34 sc selama 32 baris, isi Dakron sangat padat melengkung ke atas 17 cm agar tidak menyentuh lantai); jahitkan panel Krem (#EAD8B3) bergaris 8 rusuk BLO sepanjang lekukan bawah ekor; pasang pangkal ekor lebar di punggung bawah 2.0–9.5 cm.",
            "Lengan & Kaki Bercakar 12 Cakar (2 lengan + 2 kaki): Lengan pendek gemuk Oranye Emas (MR 6 → 16 sc × 13 baris) dan kaki bulat kokoh (MR 6 → 22 sc × 12 baris); buat 12 kerucut cakar kecil Putih Tulang (#DCE0E5, MR 4 → 6 sc, 4 baris) — 3 per tangan, 3 per kaki — jahit rapi ke ujung jari. Pasang kaki di sudut depan bawah Zona 1–2 (0–6 cm) dan lengan di 18.5–21.5 cm.",
            "Tali Gantungan Lepas-Pasang (Kait Langsung ke Kuping Ring Silikon): (A) Tali Pendek 30 cm = inti Paracord 550 4 mm dipilin/kepang mengait ke 2 Kait Udang 1.5 cm dengan selongsong rajut Oranye/Krem/Tosca 4 cm; (B) Tali Panjang 100 cm = strap datar Thermal Stitch lebar 8 st (~1.9 cm, ~470 baris) warna Oranye Emas + strip tengah Krem + tepi Tosca membungkus inti Paracord 550 4 mm utuh hingga kedua Kait Udang 1.5 cm. Kaitkan langsung ke 2 kuping samping Ring Silikon.",
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
    """Section 1: Cover Banner, Executive Summary, Interactive 3D Tip, Cuculemon 1L Specs & 1.3 kg Engineering."""
    ps = specs["projectSpecs"]
    td = ps["tumblerDimensions"]
    le = ps["loadEngineering"]
    hf = ps["hangerFitSystem"]
    sf_short = le["achievedSafetyFactor"].split()[0].replace("x", "×")
    story: list[Any] = []

    # 1. Cover Header Banner
    banner_content = [
        Paragraph(
            f"TECHNICAL BLUEPRINT &amp; PANDUAN PERAJUT  •  VERSI {escape(ps.get('version', '2.0.0'))} (SKALA 1:1)",
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
                ("TOPPADDING", (0, 0), (0, 0), 10),
                ("BOTTOMPADDING", (0, 0), (0, 0), 10),
            ]
        )
    )
    story.append(banner)
    story.append(Spacer(1, 7))

    # 2. 4-Column Executive KPI Strip
    kpis = [
        ("TUMBLER TARGET", f"Ø {td['bodyDiameterCm']} × {td['totalHeightWithLidCm']} cm", f"Cuculemon {td['capacityLiters']:.0f}L Stainless SUS 304"),
        ("TINGGI SARUNG RAJUT", f"{td['crochetCaseHeightCm']} cm", f"Tutup &amp; Handle {td['exposedLidHandleRangeCm']} cm bebas"),
        ("KAPASITAS BEBAN PENUH", f"{le['designFullWeightKg']} kg ({le['designStaticForceN']} N)", f"Safety Factor {escape(sf_short)} (min {le['systemWeakestLinkRatingKg']:.0f} kg)"),
        ("GANTUNGAN RING SILIKON", "Serut + 30 / 100 cm", "Kait langsung + inti Paracord 550"),
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
                ("TOPPADDING", (col_idx, 0), (col_idx, 0), 5.5),
                ("BOTTOMPADDING", (col_idx, 0), (col_idx, 0), 5.5),
            ]
        )
    kpi_tbl.setStyle(TableStyle(kpi_styles))
    story.append(kpi_tbl)
    story.append(Spacer(1, 8))

    # 3. Hero Duo 3D Studio Renders (Side-by-Side)
    left_card = make_studio_card(
        "overview_both_30cm_dims.png",
        card_w=286,
        img_box_h=244,
        caption_html=(
            "<b>Gambar 1.1 — Perbandingan Skala 1:1 (Tali Pendek 30 cm):</b> Sceptile (kiri) &amp; Dragonite (kanan) "
            f"terpasang presisi pada Cuculemon 1L (bodi Ø {td['bodyDiameterCm']} cm, sarung {td['crochetCaseHeightCm']} cm, "
            f"leher Ø {td['neckDiameterMaxCm']} cm, total botol {td['totalHeightWithLidCm']} cm)."
        ),
        styles=styles,
        image_buffers=image_buffers,
    )
    right_card = make_studio_card(
        "xray_bottle_engineering.png",
        card_w=214,
        img_box_h=244,
        caption_html=(
            "<b>Gambar 1.2 — Tampak X-Ray Engineering:</b> Profil botol baja di dalam dinding YU-SC "
            "memperlihatkan bahu kubah cembung 21.5–24.8 cm, tali serut 25.4–26.2 cm, Ring Silikon 26.6–27.8 cm, &amp; tutup 27.8–32.0 cm."
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
    story.append(Spacer(1, 7))

    # 4. Concept Summary Callout (v2.0.0 Ring Silikon + Woven Drawstring)
    story.append(
        callout_box(
            "Ringkasan Arsitektur v2.0: Rangka Ringkas Anti-Melorot (Sistem Ring Silikon Terpadu)",
            "Sarung rajut biasa sering melar di bahu saat menanggung botol stainless 1.3 kg. Versi 2.0 ini menyederhanakan suspensi menjadi <b>satu unit terpadu yang mudah dirakit perajut</b>: "
            "(1) Cakram <b>Busa EVA 4 mm</b> di dalam alas ganda Zona 1; (2) <b>Ring Silikon Wide-Mouth Ø 5.5–5.8 cm</b> berkuping samping di leher atas (y = 26.6–27.8 cm) "
            "di bawah bibir tutup Ø ~6.0 cm yang disatukan ke kerah rajut via <b>4 simpul jahit lilit Polycherry</b>; "
            "(3) <b>Tali serut Paracord 550 4 mm</b> disulam keluar-masuk <b>14 lubang eyelet</b> tepat di bawahnya (y = 25.4–26.2 cm) + stopper 2 lubang; "
            "serta (4) <b>Tali Pendek 30 cm</b> &amp; <b>Tali Panjang 100 cm</b> berinti Paracord 550 yang mengait <b>langsung</b> ke 2 kuping Ring Silikon.",
            accent=BLUE_ACCENT,
            bg_color=BLUE_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 6))

    # 5. Interactive 3D Standalone HTML Preview Callout
    story.append(
        callout_box(
            "Cara Paling Gampang Membuka Preview 3D Interaktif",
            "Ingin melihat lipatan rajutan, posisi kuping Ring Silikon, arah tali serut, atau belakang ekor dari segala sisi sebelum merajut? "
            "Cukup buka folder <b>output/</b> di sebelah file PDF ini lalu <b>klik-ganda (double-click) file <font name=\"Consolas\">Preview_3D_Perajut_Standalone.html</font></b> "
            "menggunakan browser <b>Google Chrome, Microsoft Edge, atau Safari</b> di laptop maupun HP Anda — <b>tanpa perlu install software tambahan atau Python</b>. "
            "Di dalamnya model Sceptile, Dragonite, Botol Asli, &amp; Tali 30/100 cm dapat diputar dan di-zoom <b>360°</b> secara interaktif!",
            accent=EMERALD_ACCENT,
            bg_color=EMERALD_BG,
            styles=styles,
        )
    )

    # Page 2: Detailed Mechanical Spec & Load Engineering
    story.append(PageBreak())

    story.append(
        section_banner(
            "BAGIAN 1",
            "Spesifikasi Dimensi Tumbler & Rekayasa Beban 1.3 kg",
            f"Parameter fisik Cuculemon 1L Stainless Steel, faktor keamanan {sf_short} (min. {le['systemWeakestLinkRatingKg']:.0f} kg), dan sistem Ring Silikon",
            BLUE_ACCENT,
            BLUE_BG,
            styles,
        )
    )
    story.append(Spacer(1, 7))

    story.append(Paragraph("Tabel 1.1 — Dimensi Profil Cuculemon 1L Stainless Steel &amp; Kesesuaian Sarung Rajut", styles["h3"]))
    zone_notes_id = {
        "Base": "Dasar datar diperkuat internal dengan cakram Busa EVA 4 mm (rentang 3–5 mm) Ø 7.8 cm di dalam Zona 1.",
        "Straight Body": f"Silinder konstan keliling {td['bodyCircumferenceCm']} cm memeluk penuh dinding stainless steel 0.0–21.5 cm tanpa celah.",
        "Rounded Convex Dome Shoulder": "Kubah cembung halus 3.3 cm melengkung dari bodi Ø 8.0 cm ke leher Ø 5.6–5.7 cm agar rajutan bahu pas rata.",
        "Vertical Neck": "Leher vertikal 3.0 cm (bagian bawah hitam + atas silver); dudukan serut 25.4–26.2 cm &amp; Ring Silikon 26.6–27.8 cm.",
        "Exposed Cap, Flip-Straw Spout & Side Carry Loop": f"Tutup ulir hitam Ø ~{td['capFlangeDiameterCm']} cm, cerat lipat atas, &amp; pegangan samping ({td['sideCarryLoopRangeCm']} cm) dibiarkan 100% bebas.",
    }
    zone_names_id = {
        "Base": "Dasar &amp; Bantalan",
        "Straight Body": "Bodi Silinder Lurus",
        "Rounded Convex Dome Shoulder": "Bahu Kubah Cembung",
        "Vertical Neck": "Leher Vertikal Pengunci",
        "Exposed Cap, Flip-Straw Spout & Side Carry Loop": "Tutup, Flip-Straw &amp; Handle Samping",
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

    dim_tbl = Table(dim_rows, colWidths=[102, 76, 82, 250])
    dim_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5.5),
        ("TOPPADDING", (0, 0), (-1, -1), 4.0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.0),
    ]
    for r_idx in range(1, len(dim_rows)):
        bg = BLUE_BG if r_idx == len(dim_rows) - 1 else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        dim_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    dim_tbl.setStyle(TableStyle(dim_style))
    story.append(KeepTogether([dim_tbl]))
    story.append(Spacer(1, 7))

    # Table 1.2: Load Engineering Analysis (v2.0.0 — 15.0 kg weakest link, 11.5x safety factor)
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
            Paragraph(f"Tautan Terlemah &gt; {le['systemWeakestLinkRatingKg']:.0f} kg<br/><b>Safety Factor: {escape(sf_short)}</b>", styles["td_center"]),
            Paragraph(
                "Melebihi standar minimum 3× (4.0 kg) dengan margin hampir 4× lipat untuk ayunan jalan, naik tangga, &amp; hentakan harian.",
                styles["td"],
            ),
        ],
        [
            Paragraph("Ring Silikon Wide-Mouth Ø 5.5–5.8 cm", styles["td_bold"]),
            Paragraph("Kuat tarik &amp; sobek &gt; 15 kg<br/>(2 kuping samping cetak)", styles["td_center"]),
            Paragraph(
                "Duduk di leher atas (y = 26.6–27.8 cm) tepat di bawah bibir tutup ulir Ø ~6.0 cm; menumpu beban botol secara langsung.",
                styles["td"],
            ),
        ],
        [
            Paragraph("4 Simpul Polycherry + Serut Paracord 14 Eyelet", styles["td_bold"]),
            Paragraph("Geser vertikal &gt; 15 kg<br/>(4 simpul + tali serut 4 mm)", styles["td_center"]),
            Paragraph(
                "4 simpul lilit Polycherry mengunci Ring Silikon ke kerah rajut atas (26.2–27.8 cm); serut sulam di 25.4–26.2 cm mencegah selip.",
                styles["td"],
            ),
        ],
        [
            Paragraph("Tali Paracord 550 Tipe III (Ø 4 mm)", styles["td_bold"]),
            Paragraph("Kekuatan putus 249 kg (550 lbs)<br/>Beban kerja aman ~50 kg", styles["td_center"]),
            Paragraph("Inti struktural 3 titik: tali serut sulam 14 eyelet (65 cm), core Tali Pendek 30 cm, &amp; spine Tali Panjang 100 cm.", styles["td"]),
        ],
        [
            Paragraph("Kait Udang Putar (Swivel Clasp 1.5 cm)", styles["td_bold"]),
            Paragraph("Beban statis &gt; 22 kg<br/>(zinc alloy / besi tebal)", styles["td_center"]),
            Paragraph("4 pcs (2 di Tali Pendek 30 cm, 2 di Tali Panjang 100 cm); dikaitkan LANGSUNG ke 2 kuping samping Ring Silikon.", styles["td"]),
        ],
    ]
    load_tbl = Table(load_rows, colWidths=[152, 122, 236])
    load_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5.5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.8),
    ]
    for r_idx in range(1, len(load_rows)):
        bg = EMERALD_BG if r_idx == 2 else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        load_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    load_tbl.setStyle(TableStyle(load_style))
    story.append(KeepTogether([load_tbl]))
    story.append(Spacer(1, 7))

    # Hanger System Fit & Straps Callout Card (100% v2.0.0 Silicone Ring + Woven Drawstring)
    sr = hf["siliconeNeckRing"]
    dc = hf["wovenDrawstringChannel"]
    hw = hf["hardware"]
    ss_strap = hf["interchangeableStraps"]["shortStrap"]
    ls_strap = hf["interchangeableStraps"]["longStrap"]

    eyelet_count = dc["eyeletPattern"].split("-")[0] if "-" in dc["eyeletPattern"] else "14"

    hanger_body = (
        f"• <b>Ring Silikon Leher Tumbler ({escape(sr['placementRangeCm'])} cm) — PERINGATAN UKURAN:</b> Pakai Ring Silikon <b>Wide-Mouth ID 5.5–5.8 cm</b> (melar 5.5–6.2 cm, untuk botol 18oz–32oz) "
        f"dengan 2 lubang kuping samping bawaan tepat di bawah flensa tutup ulir <b>Ø ~{td['capFlangeDiameterCm']} cm</b>. "
        f"<b>PERINGATAN:</b> <u>JANGAN beli ukuran 2.8–3.0 cm untuk botol PET/Aqua</u> karena tidak akan muat di leher Cuculemon 1L!<br/>"
        f"• <b>Penyatuan Manset Rajut (4 Simpul Polycherry):</b> Kerah rajut atas (y = 26.2–27.8 cm) diberi takik dangkal 3 st di jam 3 &amp; jam 9 untuk kuping Ring Silikon, "
        f"lalu kedua bagian disatukan menjadi satu unit memakai <b>4 simpul jahit lilit Polycherry</b> (depan, belakang, kiri, kanan melewati bibir bawah ring silikon &amp; tusuk atas).<br/>"
        f"• <b>Tali Serut Sulam {escape(eyelet_count)} Eyelet ({escape(dc['heightRangeCm'])} cm):</b> Tepat di bawah Ring Silikon, potong <b>{dc['cordCutLengthCm']} cm Paracord 550 4 mm</b> lalu sulam "
        f"<b>keluar-masuk (IN &amp; OUT)</b> melewati <b>{escape(eyelet_count)} lubang eyelet</b> ([sc 2, ch 1, sk 1] × 14) dan kunci di sisi belakang dengan <b>Stopper Pegas 2 Lubang (Ø 4.5–5.0 mm)</b> + manik rajut.<br/>"
        f"• <b>Kait Langsung &amp; Dua Tali Inti Paracord (0% Mulur):</b> Gunakan <b>{hw['swivelLobsterClasps']['quantityPerCase']} pcs Kait Udang Putar {hw['swivelLobsterClasps']['innerEyeWidthCm']} cm</b> "
        f"yang dikaitkan <b>LANGSUNG</b> ke 2 kuping samping Ring Silikon: <b>(1) Tali Pendek ({ss_strap['totalLengthHookToHookCm']:.0f} cm)</b> bentang {ss_strap['cordSpanCm']} cm pilin/kepang Paracord 4 mm + selongsong 4 cm; "
        f"<b>(2) Tali Panjang ({ls_strap['totalLengthHookToHookCm']:.0f} cm / 1 m)</b> bentang {ls_strap['strapSpanCm']} cm selebar {ls_strap['widthCm']} cm pola <b>Thermal Stitch 8 st (~460–480 baris)</b> berinti Paracord 550 utuh."
    )
    story.append(
        KeepTogether(
            [
                callout_box(
                    "Hanger System Fit: Ring Silikon Ø 5.5–5.8 cm + Serut Sulam + Kait Langsung (30 cm &amp; 100 cm)",
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
        ("TOPPADDING", (0, 0), (-1, -1), 3.0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.0),
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
    """Section 2: Component-Only BOM (15 items) with clickable Shopee links + Cost Breakdown."""
    bom: list[dict[str, Any]] = specs["bomComponents"]
    story: list[Any] = [PageBreak()]

    story.append(
        section_banner(
            "BAGIAN 2",
            "Bill of Materials (BOM) — Komponen Produk & Link Beli Shopee",
            f"Daftar lengkap {len(bom)} material pembentuk sarung & sistem gantungan (TANPA alat kerja) dengan tautan Shopee aktif",
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

    ordered_first_two = structural_items + sceptile_yarn_items
    black_item_no = next(
        (idx for idx, it in enumerate(ordered_first_two, 1) if it["id"] == "yarn-polycherry-black"),
        len(structural_items) + len(sceptile_yarn_items),
    )

    # Category A (6 items) fits comfortably on Page 3
    story.append(
        _build_bom_category_table(
            f"KATEGORI A — KOMPONEN STRUKTURAL, HARDWARE GANTUNGAN & ISIAN (SCEPTILE & DRAGONITE • {len(structural_items)} ITEM)",
            structural_items,
            start_no=1,
            cat_bg=BLUE_BG,
            styles=styles,
        )
    )

    # Page 4 holds Category B (5 items) + Category C (4 items) + Cost Breakdown together cleanly
    story.append(PageBreak())
    story.append(
        _build_bom_category_table(
            f"KATEGORI B — PAKET BENANG POLYCHERRY D27: DESAIN SCEPTILE + HITAM BERSAMA ({len(sceptile_yarn_items)} ITEM / 6 GULUNG)",
            sceptile_yarn_items,
            start_no=1 + len(structural_items),
            cat_bg=EMERALD_BG,
            styles=styles,
        )
    )
    story.append(Spacer(1, 7))
    story.append(
        _build_bom_category_table(
            f"KATEGORI C — PAKET BENANG POLYCHERRY D27: DESAIN DRAGONITE ({len(dragonite_only_items)} ITEM KHAS + HITAM NO. {black_item_no})",
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
            Paragraph(f"Subtotal Komponen Struktural, Hardware &amp; Isian ({len(structural_items)} Item Kategori A)", styles["td"]),
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
                Spacer(1, 5),
                Paragraph(
                    "<i>Catatan efisiensi belanja:</i> Dakron 250g, Busa EVA lembaran 20×20 cm, dan Benang Hitam 100g masih menyisakan stok cukup "
                    "untuk membuat karakter kedua (cukup menambah Ring Silikon Wide-Mouth, Paracord 550, Stopper, Kait Udang 1.5 cm, &amp; warna khas karakter kedua).",
                    styles["body_sm"],
                ),
            ]
        )
    )

    return story


def build_section_3(
    specs: dict[str, Any],
    styles: dict[str, ParagraphStyle],
    image_buffers: list[io.BytesIO],
) -> list[Any]:
    """Section 3: Real Bottle Verification, GLTF Proportion Check, Dual Gauge & 1.3 kg Assembly."""
    g = specs["projectSpecs"]["gauge"]
    ss = g["standardSingleStrand"]
    ds = g["heavyDutyDoubleStrandEquivalent"]
    td = specs["projectSpecs"]["tumblerDimensions"]
    story: list[Any] = [PageBreak()]

    story.append(
        section_banner(
            "BAGIAN 3",
            "Verifikasi Botol Asli, Panduan Gauge Polycherry D27 & Perakitan",
            "Validasi siluet Cuculemon 1L vs referensi GLTF 1:1, gauge 1 Helai vs 2 Helai, serta perakitan Ring Silikon + Tali 30/100 cm",
            EMERALD_ACCENT,
            EMERALD_BG,
            styles,
        )
    )
    story.append(Spacer(1, 7))

    # Visual verification renders added for v2.0.0: authentic bottle + GLTF reference comparison
    real_card = make_studio_card(
        "cuculemon_bottle_real.png",
        card_w=204,
        img_box_h=178,
        caption_html=(
            "<b>Gambar 3.1 — Profil Fisik Cuculemon 1L Asli:</b> Silinder Ø 8.0 cm (0–21.5 cm), "
            "bahu kubah cembung (21.5–24.8 cm), leher vertikal Ø 5.7 cm, tutup ulir &amp; handle samping."
        ),
        styles=styles,
        image_buffers=image_buffers,
        border_color=EMERALD_ACCENT,
    )
    gltf_card = make_studio_card(
        "side_by_side_ref_gltf.png",
        card_w=296,
        img_box_h=178,
        caption_html=(
            "<b>Gambar 3.2 — Validasi Proporsi 1:1 vs Model Referensi 3D (<font name=\"Consolas\">scene.gltf</font>):</b> "
            "Perbandingan langsung siluet wajah, perut 12 rusuk, sayap, ekor, &amp; biji punggung pada skala tumbler 1L."
        ),
        styles=styles,
        image_buffers=image_buffers,
        border_color=EMERALD_ACCENT,
    )
    verify_row = Table([[real_card, "", gltf_card]], colWidths=[204, 10, 296])
    verify_row.setStyle(
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
    story.append(verify_row)
    story.append(Spacer(1, 7))

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
    story.append(Spacer(1, 7))

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
            Paragraph("Tinggi Silinder Lurus (0.0–21.5 cm)", styles["td_bold"]),
            Paragraph(f"{ss['cylinder21_5cmRows']} baris", styles["td_center"]),
            Paragraph(f"{ds['cylinder21_5cmRows']} baris", styles["td_center"]),
        ],
        [
            Paragraph("Bahu Kubah Cembung 3.3 cm (21.5–24.8 cm)", styles["td_bold"]),
            Paragraph(f"{ss['shoulder3_3cmRows']} baris (60 → 44 sc)", styles["td_center"]),
            Paragraph(f"{ds['shoulder3_3cmRows']} baris (40 → 28 sc)", styles["td_center"]),
        ],
        [
            Paragraph("Kerah Leher Vertikal 3.0 cm (24.8–27.8 cm)", styles["td_bold"]),
            Paragraph(f"{ss['collar3_0cmRows']} baris (44 sc)", styles["td_center"]),
            Paragraph(f"{ds['collar3_0cmRows']} baris (28 sc)", styles["td_center"]),
        ],
    ]
    gauge_tbl = Table(gauge_rows, colWidths=[156, 177, 177])
    g_style: list[tuple[Any, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK_DARK),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER_SLATE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER_SLATE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.8),
    ]
    for r_idx in range(1, len(gauge_rows)):
        bg = EMERALD_BG if r_idx in (3, 4) else (SURFACE_ALT if r_idx % 2 == 0 else colors.white)
        g_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), bg))
    gauge_tbl.setStyle(TableStyle(g_style))
    story.append(KeepTogether([gauge_tbl]))
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            f"<i>Verifikasi Matematika Gauge:</i> Baik memakai <b>1 Helai (60 sc → 44 sc)</b> maupun <b>2 Helai (40 sc → 28 sc)</b>, "
            f"dimensi akhir tetap tepat <b>Ø {td['bodyDiameterCm']} cm → Ø {td['neckDiameterMaxCm']} cm × tinggi {td['crochetCaseHeightCm']} cm</b>. "
            "Lakukan uji swatch 5×5 cm sebelum memulai agar botol pas tanpa celah.",
            styles["body_sm"],
        )
    )

    # Page 6: 5-Step Assembly Workflow (Ring Silikon + Woven Drawstring + 30/100 cm Straps)
    story.append(PageBreak())
    story.append(Paragraph("Alur Perakitan 5 Langkah — Jalur Beban 1.3 kg (Ring Silikon &amp; Tali 30/100 cm)", styles["h3"]))
    story.append(Spacer(1, 3))
    steps_data = [
        (
            "1",
            "Alas Sandwich EVA Ganda (Zona 1: 0.0–0.8 cm)",
            "Rajut 2 cakram alas Ø 8.0 cm (60 sc pada 1 helai atau 40 sc pada 2 helai). Potong 1 cakram <b>Busa EVA / Spon Ati tebal 4 mm berdiameter Ø 7.8 cm</b>. "
            "Selipkan EVA di tengah kedua cakram rajut, lalu kunci dengan 1 putaran <b>BLO (Back Loop Only)</b> yang mengait loop cakram luar dan dalam sekaligus. "
            "Hasilnya alas datar 90° anti-ambles yang menyebarkan beban 1.3 kg merata dan meredam benturan saat botol diletakkan.",
        ),
        (
            "2",
            "Bahu Kubah Cembung &amp; Takik Kuping 3-Stitch di Leher Atas (Zona 3–4: 21.5–27.8 cm)",
            "Kerjakan pengurangan bahu kubah cembung 3.3 cm (9 baris 1 helai / 6 baris 2 helai) lalu lanjutkan kerah leher vertikal Ø 5.8 cm hingga tepat <b>27.8 cm</b>. "
            "Pada Baris 3 kerah (25.4–26.2 cm) buat 14 lubang eyelet; lalu pada Baris 7–8 (26.6–27.8 cm) buat <b>takik dangkal 3 stitch di sisi kiri (jam 9) &amp; kanan (jam 3)</b> "
            "supaya 2 lubang kuping samping bawaan Ring Silikon duduk rata flush di leher tanpa mengganjal.",
        ),
        (
            "3",
            "Penyatuan Ring Silikon Wide-Mouth + Tali Serut Sulam 14 Eyelet (y = 25.4–27.8 cm)",
            "Pasangkan <b>Ring Silikon Wide-Mouth (ID 5.5–5.8 cm)</b> di manset rajut atas (y = 26.6–27.8 cm) tepat di bawah bibir tutup Ø ~6.0 cm, lalu ikat menjadi satu kesatuan "
            "memakai <b>4 simpul jahit lilit Polycherry</b> (depan, belakang, kiri, kanan melewati bibir bawah ring silikon &amp; tusuk kerah atas). "
            "Tepat di bawahnya (y = 25.4–26.2 cm), sulam <b>65 cm Paracord 550 4 mm keluar-masuk (IN &amp; OUT)</b> lewat ke-14 lubang eyelet, kunci dengan <b>Stopper 2 Lubang</b> "
            "di sisi belakang + rajut 2 manik ujung kecil (Coral untuk Sceptile / Krem untuk Dragonite).",
        ),
        (
            "4",
            "Konstruksi Tali Pendek 30 cm — Kait Langsung ke Kuping Ring Silikon",
            "Potong <b>±55 cm Paracord 550 4 mm</b> (untuk bentang bersih ±22.5 cm + allowance dua pengait 7.5 cm = total <b>30.0 cm</b> ujung-ke-ujung). "
            "Pilin atau kepang 4-helai, kaitkan kedua ujungnya pada <b>2 pcs Kait Udang Putar 1.5 cm</b>, tutup sambungan dengan <b>selongsong rajut Polycherry 4 cm</b> (motif karakter), "
            "lalu jepitkan kedua Kait Udang <b>LANGSUNG ke 2 lubang kuping samping Ring Silikon</b>.",
        ),
        (
            "5",
            "Konstruksi Tali Panjang 100 cm (Thermal Stitch + Inti Paracord) — Kait Langsung ke Ring Silikon",
            "Potong <b>1.30 m Paracord 550 4 mm</b> utuh sebagai tulang anti-mulur. Rajut tali datar selebar <b>8 stitch (~1.8–2.0 cm)</b> menggunakan teknik <b>Thermal Stitch</b> "
            "(±460–480 baris thermal hingga badan strap <b>92.5 cm</b>; total <b>100.0 cm</b> termasuk 2 Kait Udang 1.5 cm). "
            "Selipkan inti Paracord 550 utuh ke dalam rongga Thermal Stitch hingga kedua batang Kait Udang 1.5 cm, kunci selongsong ujung 4 cm, dan jepitkan <b>LANGSUNG ke 2 kuping Ring Silikon</b> (<b>0% mulur permanen</b>).",
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
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
    ]
    for r_idx in range(len(step_rows)):
        s_style.append(("BACKGROUND", (0, r_idx), (0, r_idx), EMERALD_ACCENT))
        s_style.append(("BACKGROUND", (1, r_idx), (1, r_idx), SURFACE_ALT if r_idx % 2 == 1 else colors.white))
    step_tbl.setStyle(TableStyle(s_style))
    story.append(step_tbl)
    story.append(Spacer(1, 9))

    story.append(
        callout_box(
            "Checklist Uji Tarik &amp; Akses Tutup Botol Sebelum Pemakaian Penuh",
            "• <b>Uji Posisi Ring Silikon:</b> Pastikan Ring Silikon berada tepat di bawah bibir tutup ulir hitam (Ø ~6.0 cm), bukan menutupi ulir drat.<br/>"
            "• <b>Uji Buka-Tutup &amp; Handle:</b> Putar buka-tutup botol, angkat cerat flip-straw, dan ayunkan pegangan samping Cuculemon — semuanya harus 100% bebas tanpa menyentuh jambul/tanduk/antena.<br/>"
            "• <b>Uji Beban 1.3 kg:</b> Isi botol dengan 1 liter air, tarik &amp; kunci tali serut Paracord 14 eyelet + stopper 2 lubang, jinjing pakai Tali 30 cm lalu Tali 100 cm sambil memantul ringan — leher rajut harus diam tanpa merosot.",
            accent=BLUE_ACCENT,
            bg_color=BLUE_BG,
            styles=styles,
        )
    )

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
            ("sceptile_back_30cm.png", "<b>Sudut 2 — Tampak Belakang:</b> 6 biji kuning 3D (2×3), stopper tali serut + manik Coral, 4 simpul ring &amp; ekor daun berlapis."),
            ("sceptile_neck_hanger.png", "<b>Sudut 3 — Detail Leher Ø 5.7 cm:</b> Ring Silikon + 4 simpul Polycherry, serut Paracord sulam 14 eyelet &amp; Kait Udang langsung ke kuping ring."),
            ("sceptile_long_100cm.png", "<b>Sudut 4 — Tali Panjang 100 cm:</b> Strap datar Thermal Stitch 8 st berinti Paracord 550 mengait langsung ke kuping samping Ring Silikon."),
        ]
    else:
        panels = [
            ("dragonite_front_30cm.png", "<b>Sudut 1 — Tampak Depan (Tali 30 cm):</b> Panel perut Krem 12 rusuk, moncong bulat, mata oval, tanduk &amp; 6 cakar kaki."),
            ("dragonite_back_30cm.png", "<b>Sudut 2 — Tampak Belakang:</b> Sayap 2-warna (jam 10 &amp; 2), stopper + manik Krem, 4 simpul ring &amp; ekor gemuk 8 rusuk Krem."),
            ("dragonite_neck_hanger.png", "<b>Sudut 3 — Detail Leher Ø 5.7 cm:</b> Antena lengkung-S bebas tutup, Ring Silikon + 4 simpul Polycherry, serut sulam &amp; Kait Udang 1.5 cm."),
            ("dragonite_long_100cm.png", "<b>Sudut 4 — Tali Panjang 100 cm:</b> Strap panjang selempang 1 m Thermal Stitch dengan selongsong Krem mengait langsung ke kuping Ring Silikon."),
        ]

    card_tl = make_studio_card(panels[0][0], 250, 194, panels[0][1], styles, image_buffers, accent)
    card_tr = make_studio_card(panels[1][0], 250, 194, panels[1][1], styles, image_buffers, accent)
    row1 = Table([[card_tl, "", card_tr]], colWidths=[250, 10, 250])
    row1.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))

    card_bl = make_studio_card(panels[2][0], 278, 162, panels[2][1], styles, image_buffers, accent)
    card_br = make_studio_card(panels[3][0], 222, 162, panels[3][1], styles, image_buffers, accent)
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
                    ("TOPPADDING", (0, 0), (-1, -1), 4.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
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
                    ("TOPPADDING", (0, 1), (0, 3), 4.2),
                    ("BOTTOMPADDING", (0, 1), (0, 3), 4.6),
                ]
            )
        )
        story.append(KeepTogether([z_card, Spacer(1, 6.5)]))

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
    story.extend(build_section_3(specs, styles, image_buffers))
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
        title="Pokemon 3D Crochet Tumbler Case — Technical Blueprint v2.0 & Panduan Perajut",
        author="Sceptile & Dragonite 1L Crochet Engineering Blueprint",
        subject="Cuculemon 1L Stainless Steel Heavy-Duty Crochet Case Pattern & Shopee BOM",
    )
    doc.build(story, canvasmaker=NumberedBlueprintCanvas)

    for buf in image_buffers:
        buf.close()

    print(f"Generated PDF: {OUTPUT_PDF} ({OUTPUT_PDF.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
