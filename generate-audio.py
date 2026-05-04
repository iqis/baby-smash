"""
Generate TTS audio files for all flashcard vocabulary items using edge-tts.
Produces mp3 files in audio/{lang}/{category}/{item}.mp3
"""
import asyncio
import os
import ssl
import json
import edge_tts

# Bypass SSL verification (system cert issue)
edge_tts.voices._SSL_CTX = ssl.create_default_context()
edge_tts.voices._SSL_CTX.check_hostname = False
edge_tts.voices._SSL_CTX.verify_mode = ssl.CERT_NONE

# Voices for each language (neural, natural-sounding)
VOICES = {
    'en': 'en-US-AvaNeural',
    'zh': 'zh-CN-XiaoxiaoNeural',
    'ja': 'ja-JP-NanamiNeural',
    'hi': 'hi-IN-SwaraNeural',
    'es': 'es-ES-ElviraNeural',
}

# Vocabulary (mirrors flashcards.js)
VOCAB = {
    "colors": [
        {"en": "Red", "zh": "红色", "ja": "赤", "hi": "लाल", "es": "Rojo"},
        {"en": "Blue", "zh": "蓝色", "ja": "青", "hi": "नीला", "es": "Azul"},
        {"en": "Green", "zh": "绿色", "ja": "緑", "hi": "हरा", "es": "Verde"},
        {"en": "Yellow", "zh": "黄色", "ja": "黄色", "hi": "पीला", "es": "Amarillo"},
        {"en": "Purple", "zh": "紫色", "ja": "紫", "hi": "बैंगनी", "es": "Morado"},
        {"en": "Orange", "zh": "橙色", "ja": "オレンジ", "hi": "नारंगी", "es": "Naranja"},
        {"en": "Pink", "zh": "粉色", "ja": "ピンク", "hi": "गुलाबी", "es": "Rosa"},
        {"en": "White", "zh": "白色", "ja": "白", "hi": "सफेद", "es": "Blanco"},
    ],
    "animals": [
        {"en": "Cat", "zh": "猫", "ja": "猫", "hi": "बिल्ली", "es": "Gato"},
        {"en": "Dog", "zh": "狗", "ja": "犬", "hi": "कुत्ता", "es": "Perro"},
        {"en": "Bird", "zh": "鸟", "ja": "鳥", "hi": "चिड़िया", "es": "Pájaro"},
        {"en": "Fish", "zh": "鱼", "ja": "魚", "hi": "मछली", "es": "Pez"},
        {"en": "Rabbit", "zh": "兔子", "ja": "うさぎ", "hi": "खरगोश", "es": "Conejo"},
        {"en": "Bear", "zh": "熊", "ja": "熊", "hi": "भालू", "es": "Oso"},
        {"en": "Duck", "zh": "鸭子", "ja": "あひる", "hi": "बत्तख", "es": "Pato"},
        {"en": "Elephant", "zh": "大象", "ja": "象", "hi": "हाथी", "es": "Elefante"},
    ],
    "fruits": [
        {"en": "Apple", "zh": "苹果", "ja": "りんご", "hi": "सेब", "es": "Manzana"},
        {"en": "Banana", "zh": "香蕉", "ja": "バナナ", "hi": "केला", "es": "Plátano"},
        {"en": "Orange", "zh": "橘子", "ja": "みかん", "hi": "संतरा", "es": "Naranja"},
        {"en": "Grape", "zh": "葡萄", "ja": "ぶどう", "hi": "अंगूर", "es": "Uva"},
        {"en": "Watermelon", "zh": "西瓜", "ja": "すいか", "hi": "तरबूज", "es": "Sandía"},
        {"en": "Strawberry", "zh": "草莓", "ja": "いちご", "hi": "स्ट्रॉबेरी", "es": "Fresa"},
        {"en": "Milk", "zh": "牛奶", "ja": "牛乳", "hi": "दूध", "es": "Leche"},
        {"en": "Bread", "zh": "面包", "ja": "パン", "hi": "रोटी", "es": "Pan"},
    ],
    "vehicles": [
        {"en": "Car", "zh": "汽车", "ja": "車", "hi": "कार", "es": "Coche"},
        {"en": "Bus", "zh": "公交车", "ja": "バス", "hi": "बस", "es": "Autobús"},
        {"en": "Train", "zh": "火车", "ja": "電車", "hi": "ट्रेन", "es": "Tren"},
        {"en": "Airplane", "zh": "飞机", "ja": "飛行機", "hi": "हवाई जहाज", "es": "Avión"},
        {"en": "Boat", "zh": "船", "ja": "船", "hi": "नाव", "es": "Barco"},
        {"en": "Bicycle", "zh": "自行车", "ja": "自転車", "hi": "साइकिल", "es": "Bicicleta"},
        {"en": "Rocket", "zh": "火箭", "ja": "ロケット", "hi": "रॉकेट", "es": "Cohete"},
        {"en": "Helicopter", "zh": "直升机", "ja": "ヘリコプター", "hi": "हेलीकॉप्टर", "es": "Helicóptero"},
    ],
    "nature": [
        {"en": "Sun", "zh": "太阳", "ja": "太陽", "hi": "सूरज", "es": "Sol"},
        {"en": "Moon", "zh": "月亮", "ja": "月", "hi": "चाँद", "es": "Luna"},
        {"en": "Star", "zh": "星星", "ja": "星", "hi": "तारा", "es": "Estrella"},
        {"en": "Tree", "zh": "树", "ja": "木", "hi": "पेड़", "es": "Árbol"},
        {"en": "Flower", "zh": "花", "ja": "花", "hi": "फूल", "es": "Flor"},
        {"en": "Rain", "zh": "雨", "ja": "雨", "hi": "बारिश", "es": "Lluvia"},
        {"en": "Cloud", "zh": "云", "ja": "雲", "hi": "बादल", "es": "Nube"},
        {"en": "Rainbow", "zh": "彩虹", "ja": "虹", "hi": "इंद्रधनुष", "es": "Arcoíris"},
    ],
    "numbers": [
        {"en": "One", "zh": "一", "ja": "一", "hi": "एक", "es": "Uno"},
        {"en": "Two", "zh": "二", "ja": "二", "hi": "दो", "es": "Dos"},
        {"en": "Three", "zh": "三", "ja": "三", "hi": "तीन", "es": "Tres"},
        {"en": "Four", "zh": "四", "ja": "四", "hi": "चार", "es": "Cuatro"},
        {"en": "Five", "zh": "五", "ja": "五", "hi": "पाँच", "es": "Cinco"},
    ],
    "bodyParts": [
        {"en": "Hand", "zh": "手", "ja": "手", "hi": "हाथ", "es": "Mano"},
        {"en": "Foot", "zh": "脚", "ja": "足", "hi": "पैर", "es": "Pie"},
        {"en": "Eye", "zh": "眼睛", "ja": "目", "hi": "आँख", "es": "Ojo"},
        {"en": "Nose", "zh": "鼻子", "ja": "鼻", "hi": "नाक", "es": "Nariz"},
        {"en": "Mouth", "zh": "嘴巴", "ja": "口", "hi": "मुँह", "es": "Boca"},
        {"en": "Ear", "zh": "耳朵", "ja": "耳", "hi": "कान", "es": "Oreja"},
    ],
}

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio")

async def generate_one(text, voice, output_path):
    """Generate a single TTS audio file."""
    communicate = edge_tts.Communicate(text, voice, rate="-10%")
    await communicate.save(output_path)

async def main():
    manifest = {}
    total = 0
    errors = 0

    for category, items in VOCAB.items():
        for item in items:
            key_name = item["en"].lower()
            manifest_key = f"{category}/{key_name}"
            manifest[manifest_key] = {}

            for lang, voice in VOICES.items():
                text = item.get(lang, "")
                if not text:
                    continue

                out_dir = os.path.join(BASE_DIR, lang, category)
                os.makedirs(out_dir, exist_ok=True)
                out_file = os.path.join(out_dir, f"{key_name}.mp3")
                rel_path = f"audio/{lang}/{category}/{key_name}.mp3"

                if os.path.exists(out_file):
                    manifest[manifest_key][lang] = rel_path
                    continue

                try:
                    await generate_one(text, voice, out_file)
                    manifest[manifest_key][lang] = rel_path
                    total += 1
                    print(f"  [{lang}] {text} -> {rel_path}")
                except Exception as e:
                    errors += 1
                    print(f"  [{lang}] ERROR: {text} - {e}")

            print(f"[{manifest_key}] done")

    # Write audio manifest
    manifest_path = os.path.join(os.path.dirname(BASE_DIR), "audio-manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Generated {total} audio files ({errors} errors)")
    print(f"Manifest: audio-manifest.json")

if __name__ == "__main__":
    asyncio.run(main())
