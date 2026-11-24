"""生理の理解度テストの OGP 画像（test/ogp.png、1200×630）を作る。

    python3 tools/test_ogp.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc"
INK, PINK, MUTED = "#3d2c2e", "#ff5c8a", "#8f7a78"


def font(size):
    return ImageFont.truetype(FONT, size)


def centered(draw, y, text, size, fill, stroke=0):
    f = font(size)
    w = draw.textlength(text, font=f)
    draw.text(((1200 - w) / 2, y), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=fill)


def main():
    img = Image.new("RGB", (1200, 630), "#fff1ea")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((60, 50, 1140, 580), radius=56, fill="#ffffff", outline="#ffd9c7", width=4)
    centered(draw, 104, "理解度テスト ・ 全10問", 38, PINK, 1)
    centered(draw, 190, "彼氏は、生理のこと", 84, INK, 2)
    centered(draw, 300, "どれだけ知ってる？", 84, INK, 2)
    draw.rounded_rectangle((330, 440, 870, 530), radius=45, fill=PINK)
    centered(draw, 458, "ホントかウソか・約2分", 44, "#ffffff", 1)
    icon = Image.open(ROOT / "icon-192.png").convert("RGBA").resize((56, 56))
    img.paste(icon, (980, 500), icon)
    img.save(ROOT / "test/ogp.png", optimize=True)


if __name__ == "__main__":
    main()
