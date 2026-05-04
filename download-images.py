"""
Download flashcard images from Bing Image Search using icrawler.
Downloads 4 images per vocabulary item into images/{category}/{item}/
"""
import os
import json
from icrawler.builtin import BingImageCrawler

# Vocabulary items organized by category
VOCAB = {
    "colors": [
        {"en": "Red", "query": "red color background simple"},
        {"en": "Blue", "query": "blue color background simple"},
        {"en": "Green", "query": "green color background simple"},
        {"en": "Yellow", "query": "yellow color background simple"},
        {"en": "Purple", "query": "purple color background simple"},
        {"en": "Orange", "query": "orange color background simple"},
        {"en": "Pink", "query": "pink color background simple"},
        {"en": "White", "query": "white color background simple"},
    ],
    "animals": [
        {"en": "Cat", "query": "cute cat close up photo"},
        {"en": "Dog", "query": "cute puppy dog photo"},
        {"en": "Bird", "query": "colorful bird photo"},
        {"en": "Fish", "query": "colorful tropical fish"},
        {"en": "Rabbit", "query": "cute bunny rabbit photo"},
        {"en": "Bear", "query": "cute bear animal photo"},
        {"en": "Duck", "query": "cute duck bird photo"},
        {"en": "Elephant", "query": "elephant animal photo"},
    ],
    "fruits": [
        {"en": "Apple", "query": "red apple fruit photo"},
        {"en": "Banana", "query": "banana fruit photo"},
        {"en": "Orange", "query": "orange fruit photo"},
        {"en": "Grape", "query": "purple grapes fruit photo"},
        {"en": "Watermelon", "query": "watermelon slice fruit"},
        {"en": "Strawberry", "query": "strawberry fruit photo"},
        {"en": "Milk", "query": "glass of milk white"},
        {"en": "Bread", "query": "bread loaf fresh baked"},
    ],
    "vehicles": [
        {"en": "Car", "query": "car simple red photo"},
        {"en": "Bus", "query": "yellow school bus photo"},
        {"en": "Train", "query": "colorful train photo"},
        {"en": "Airplane", "query": "airplane flying sky"},
        {"en": "Boat", "query": "boat on water photo"},
        {"en": "Bicycle", "query": "bicycle bike photo"},
        {"en": "Rocket", "query": "rocket space launch"},
        {"en": "Helicopter", "query": "helicopter flying photo"},
    ],
    "nature": [
        {"en": "Sun", "query": "sun bright sky photo"},
        {"en": "Moon", "query": "full moon night sky"},
        {"en": "Star", "query": "stars night sky bright"},
        {"en": "Tree", "query": "green tree nature photo"},
        {"en": "Flower", "query": "colorful flower close up"},
        {"en": "Rain", "query": "rain drops water photo"},
        {"en": "Cloud", "query": "white fluffy cloud blue sky"},
        {"en": "Rainbow", "query": "rainbow sky colorful"},
    ],
    "numbers": [
        {"en": "One", "query": "number 1 one object"},
        {"en": "Two", "query": "number 2 two objects"},
        {"en": "Three", "query": "number 3 three objects"},
        {"en": "Four", "query": "number 4 four objects"},
        {"en": "Five", "query": "number 5 five objects"},
    ],
    "bodyParts": [
        {"en": "Hand", "query": "human hand palm photo"},
        {"en": "Foot", "query": "baby foot photo cute"},
        {"en": "Eye", "query": "human eye close up"},
        {"en": "Nose", "query": "human nose face close up"},
        {"en": "Mouth", "query": "smiling mouth lips"},
        {"en": "Ear", "query": "human ear photo"},
    ],
}

IMAGES_PER_ITEM = 4
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")

# Manifest for the app
manifest = {}

for category, items in VOCAB.items():
    for item in items:
        key = item["en"].lower()
        out_dir = os.path.join(BASE_DIR, category, key)
        os.makedirs(out_dir, exist_ok=True)

        print(f"[{category}/{key}] Searching: {item['query']}")

        crawler = BingImageCrawler(
            storage={"root_dir": out_dir},
            log_level=40,  # ERROR only
        )
        crawler.crawl(
            keyword=item["query"],
            max_num=IMAGES_PER_ITEM,
            min_size=(200, 200),
            file_idx_offset=0,
        )

        # Collect downloaded files
        files = sorted([f for f in os.listdir(out_dir) if f.endswith(('.jpg', '.png', '.jpeg'))])
        manifest_key = f"{category}/{key}"
        manifest[manifest_key] = [f"images/{category}/{key}/{f}" for f in files]
        print(f"  -> Got {len(files)} images")

# Write manifest
manifest_path = os.path.join(BASE_DIR, "..", "image-manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"\nDone! Manifest written to image-manifest.json")
print(f"Total items: {len(manifest)}, Total images: {sum(len(v) for v in manifest.values())}")
