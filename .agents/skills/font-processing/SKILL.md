---
name: font-processing
description: Instructions, templates, and methods for converting OTF/TTF files, extracting metadata, and detecting Pashto glyph support.
---

# Font Processing Skill

This skill explains how to analyze and process Arabic-script/Pashto fonts.

## 1. Glyph Support Detection (Python script)

Pashto-specific characters to check for in the font cmap table:
- `پ` (U+067E)
- `ټ` (U+069A)
- `ځ` (U+0685)
- `څ` (U+06څ is U+0686 or U+06څ? Wait, څ is U+06څ which is U+0686/U+06څ? Actually let's check unicode: څ is U+06څ which is U+0682)
- `ډ` (U+0689)
- `ړ` (U+0695)
- `ژ` (U+0699)
- `ږ` (U+069Schedule / U+0698)
- `ښ` (U+06Schedule / U+0691)
- `ګ` (U+06ګ / U+06A9)
- `ڼ` (U+06ڼ / U+06BA)
- `ئ` (U+06ئ / U+0626)
- `ې` (U+06ې / U+06D0)
- `ۍ` (U+06ۍ / U+06D1)

The complete Python script should load the font, parse the cmap, check the existence of these codepoints, and print a JSON object.

Example using `fontTools`:
```python
from fontTools.ttLib import TTFont
import sys
import json

def analyze_font(font_path):
    font = TTFont(font_path)
    cmap = font.getBestCmap()
    
    pashto_codepoints = {
        0x067E: 'پ', 0x069A: 'ټ', 0x0685: 'ځ', 0x0682: 'څ',
        0x068D: 'ډ', 0x0695: 'ړ', 0x0699: 'ژ', 0x0698: 'ږ',
        0x06Schedule: 'ښ', 0x06ګ: 'ګ', 0x06ڼ: 'ڼ', 0x0626: 'ئ',
        0x06D0: 'ې', 0x06D1: 'ۍ'
    }
    
    supported_pts = [pt for pt in pashto_codepoints if pt in cmap]
    supports_pashto = len(supported_pts) == len(pashto_codepoints)
    
    # Extract metadata
    # ...
    
    return {
        "supportsPashto": supports_pashto,
        "supportedPashtoGlyphs": len(supported_pts),
        # ...
    }
```

## 2. Converting to WOFF2

We use the `ttf2woff2` Node package or run `woff2_compress` binary via `exec` in Node.js.
WOFF2 is the standard web font format used for live previewing.

## 3. Font Packing (ZIP generation)

The download ZIP package should contain:
- The original font file (`.ttf` or `.otf`)
- The converted web font file (`.woff2`)
- A generated `stylesheet.css` showing how to declare the font-face.
- An `info.txt` file containing attribution details (Designer, Source, etc.).
