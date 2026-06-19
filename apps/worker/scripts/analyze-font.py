import sys
import json
import os
from fontTools.ttLib import TTFont

def analyze_font(font_path):
    try:
        font = TTFont(font_path)
        
        # 1. Extract metadata from 'name' table
        name_table = font['name']
        family_name = None
        subfamily_name = None
        designer = None
        publisher = None
        
        # Helper to get string from name record
        def get_name_record(name_id):
            record = name_table.getName(name_id, 3, 1, 0x409) or \
                     name_table.getName(name_id, 1, 0, 0) or \
                     name_table.getName(name_id, 3, 1, 0)
            return record.toUnicode() if record else None

        family_name = get_name_record(1) or get_name_record(16)
        subfamily_name = get_name_record(2) or get_name_record(17)
        designer = get_name_record(9)
        publisher = get_name_record(11)

        # Fallbacks for names
        if not family_name:
            family_name = os.path.splitext(os.path.basename(font_path))[0].replace("-", " ")
        if not subfamily_name:
            subfamily_name = "Regular"

        # 2. Extract weight & style from OS/2 table
        weight = 400
        style = "NORMAL"
        if 'OS/2' in font:
            os2 = font['OS/2']
            weight = os2.usWeightClass
            # Check selection flags for italic
            if os2.fsSelection & 0x01:
                style = "ITALIC"
        
        # Fallback style parsing
        sub_lower = subfamily_name.lower()
        if "italic" in sub_lower:
            style = "ITALIC"
        if "oblique" in sub_lower:
            style = "OBLIQUE"
        
        if "bold" in sub_lower:
            weight = 700
        elif "light" in sub_lower:
            weight = 300
        elif "medium" in sub_lower:
            weight = 500
        elif "thin" in sub_lower:
            weight = 100

        # Check if variable font
        is_variable = 'fvar' in font

        # 3. Glyph Coverage check using 'cmap'
        cmap = font.getBestCmap()
        if not cmap:
            raise Exception("No cmap table found in font")

        # Define character sets for verification
        pashto_chars = ["پ", "ټ", "ځ", "څ", "ډ", "ړ", "ژ", "ږ", "ښ", "ګ", "ڼ", "ئ", "ې", "ۍ"]
        urdu_chars = ["ٹ", "ڈ", "ڑ", "ہ", "چ", "پ", "گ", "ے", "ں", "ھ"]
        persian_chars = ["پ", "چ", "ژ", "گ", "ی", "ه"]
        arabic_chars = [
            "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", 
            "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"
        ]

        def check_coverage(chars):
            present = [ord(char) in cmap for char in chars]
            return all(present), sum(present)

        supports_pashto, pashto_count = check_coverage(pashto_chars)
        supports_urdu, urdu_count = check_coverage(urdu_chars)
        supports_persian, persian_count = check_coverage(persian_chars)
        supports_arabic, arabic_count = check_coverage(arabic_chars)

        result = {
            "success": True,
            "familyName": family_name,
            "subfamily": subfamily_name,
            "weight": weight,
            "style": style,
            "isVariable": is_variable,
            "designer": designer,
            "publisher": publisher,
            "supportsPashto": supports_pashto,
            "supportsUrdu": supports_urdu,
            "supportsArabic": supports_arabic,
            "supportsPersian": supports_persian,
            "pashtoGlyphs": pashto_count,
            "totalPashtoGlyphs": len(pashto_chars)
        }

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
    
    font_path = sys.argv[1]
    analyze_font(font_path)
