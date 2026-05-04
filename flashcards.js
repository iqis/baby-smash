// Flashcard vocabulary data and drawing functions
// Categories: colors, animals, fruits, vehicles, nature, numbers, body parts
// Languages: English, 中文, + rotating (Japanese, Hindi, Spanish)

const FLASHCARDS = (function () {
    'use strict';

    // Third-language rotation pool
    const THIRD_LANGUAGES = [
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'es-ES', name: 'Spanish' },
    ];

    let thirdLangIndex = 0;

    function getNextThirdLang() {
        const lang = THIRD_LANGUAGES[thirdLangIndex];
        thirdLangIndex = (thirdLangIndex + 1) % THIRD_LANGUAGES.length;
        return lang;
    }

    // --- Vocabulary Database ---
    // Each item: { en, zh, ja, hi, es, color, draw(ctx, x, y, size) }

    const CATEGORIES = {
        colors: {
            label: 'Colors',
            items: [
                { en: 'Red', zh: '红色', ja: '赤', hi: 'लाल', es: 'Rojo', color: '#e87070' },
                { en: 'Blue', zh: '蓝色', ja: '青', hi: 'नीला', es: 'Azul', color: '#70a0e8' },
                { en: 'Green', zh: '绿色', ja: '緑', hi: 'हरा', es: 'Verde', color: '#70c878' },
                { en: 'Yellow', zh: '黄色', ja: '黄色', hi: 'पीला', es: 'Amarillo', color: '#e8d870' },
                { en: 'Purple', zh: '紫色', ja: '紫', hi: 'बैंगनी', es: 'Morado', color: '#b070e8' },
                { en: 'Orange', zh: '橙色', ja: 'オレンジ', hi: 'नारंगी', es: 'Naranja', color: '#e8a050' },
                { en: 'Pink', zh: '粉色', ja: 'ピンク', hi: 'गुलाबी', es: 'Rosa', color: '#f0a0b8' },
                { en: 'White', zh: '白色', ja: '白', hi: 'सफेद', es: 'Blanco', color: '#f0f0f0' },
            ],
            draw: function (ctx, item, x, y, size) {
                // Large filled circle of the color
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Soft border
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        },

        animals: {
            label: 'Animals',
            items: [
                { en: 'Cat', zh: '猫', ja: '猫', hi: 'बिल्ली', es: 'Gato', color: '#f4c8a7' },
                { en: 'Dog', zh: '狗', ja: '犬', hi: 'कुत्ता', es: 'Perro', color: '#d4a878' },
                { en: 'Bird', zh: '鸟', ja: '鳥', hi: 'चिड़िया', es: 'Pájaro', color: '#a7d8f4' },
                { en: 'Fish', zh: '鱼', ja: '魚', hi: 'मछली', es: 'Pez', color: '#a7f4e6' },
                { en: 'Rabbit', zh: '兔子', ja: 'うさぎ', hi: 'खरगोश', es: 'Conejo', color: '#f0e0e0' },
                { en: 'Bear', zh: '熊', ja: '熊', hi: 'भालू', es: 'Oso', color: '#c8a878' },
                { en: 'Duck', zh: '鸭子', ja: 'あひる', hi: 'बत्तख', es: 'Pato', color: '#f4dda7' },
                { en: 'Elephant', zh: '大象', ja: '象', hi: 'हाथी', es: 'Elefante', color: '#b8c8d4' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                ctx.fillStyle = item.color;
                switch (item.en) {
                    case 'Cat':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.5, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.3, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(x - s * 0.25, y - s * 0.6); ctx.lineTo(x - s * 0.1, y - s * 0.9); ctx.lineTo(x + s * 0.05, y - s * 0.6); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(x + s * 0.05, y - s * 0.6); ctx.lineTo(x + s * 0.2, y - s * 0.9); ctx.lineTo(x + s * 0.3, y - s * 0.6); ctx.fill();
                        // Eyes
                        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.4, s * 0.05, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.1, y - s * 0.4, s * 0.05, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Dog':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.5, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.32, 0, Math.PI * 2); ctx.fill();
                        // Floppy ears
                        ctx.beginPath(); ctx.ellipse(x - s * 0.35, y - s * 0.25, s * 0.12, s * 0.25, -0.2, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(x + s * 0.35, y - s * 0.25, s * 0.12, s * 0.25, 0.2, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x, y - s * 0.35, s * 0.06, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Bird':
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.4, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.35, y - s * 0.15, s * 0.2, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#e8a050'; ctx.beginPath(); ctx.moveTo(x + s * 0.55, y - s * 0.15); ctx.lineTo(x + s * 0.75, y - s * 0.1); ctx.lineTo(x + s * 0.55, y - s * 0.05); ctx.closePath(); ctx.fill();
                        // Wing
                        ctx.fillStyle = item.color; ctx.globalAlpha *= 0.7;
                        ctx.beginPath(); ctx.ellipse(x - s * 0.05, y - s * 0.05, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2); ctx.fill();
                        ctx.globalAlpha /= 0.7;
                        break;
                    case 'Fish':
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.75, y - s * 0.2); ctx.lineTo(x - s * 0.75, y + s * 0.2); ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + s * 0.2, y - s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x + s * 0.22, y - s * 0.05, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Rabbit':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.15, s * 0.35, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y - s * 0.3, s * 0.25, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(x - s * 0.1, y - s * 0.75, s * 0.07, s * 0.3, -0.1, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(x + s * 0.1, y - s * 0.75, s * 0.07, s * 0.3, 0.1, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#f8b0b8'; ctx.beginPath(); ctx.ellipse(x - s * 0.1, y - s * 0.75, s * 0.04, s * 0.2, -0.1, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.ellipse(x + s * 0.1, y - s * 0.75, s * 0.04, s * 0.2, 0.1, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Bear':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.45, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.32, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 0.6, s * 0.12, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.25, y - s * 0.6, s * 0.12, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.4, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.1, y - s * 0.4, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Duck':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.45, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.25, y - s * 0.25, s * 0.22, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#e8a050'; ctx.beginPath(); ctx.ellipse(x + s * 0.48, y - s * 0.2, s * 0.15, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Elephant':
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.55, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.3, y - s * 0.3, s * 0.3, 0, Math.PI * 2); ctx.fill();
                        // Ears
                        ctx.beginPath(); ctx.ellipse(x + s * 0.55, y - s * 0.2, s * 0.15, s * 0.25, 0.2, 0, Math.PI * 2); ctx.fill();
                        // Trunk
                        ctx.strokeStyle = item.color; ctx.lineWidth = size * 0.04; ctx.lineCap = 'round';
                        ctx.beginPath(); ctx.moveTo(x + s * 0.5, y - s * 0.15); ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.2, x + s * 0.55, y + s * 0.4); ctx.stroke();
                        break;
                }
            }
        },

        fruits: {
            label: 'Fruits & Food',
            items: [
                { en: 'Apple', zh: '苹果', ja: 'りんご', hi: 'सेब', es: 'Manzana', color: '#e85050' },
                { en: 'Banana', zh: '香蕉', ja: 'バナナ', hi: 'केला', es: 'Plátano', color: '#f0d840' },
                { en: 'Orange', zh: '橘子', ja: 'みかん', hi: 'संतरा', es: 'Naranja', color: '#f0a030' },
                { en: 'Grape', zh: '葡萄', ja: 'ぶどう', hi: 'अंगूर', es: 'Uva', color: '#9060c0' },
                { en: 'Watermelon', zh: '西瓜', ja: 'すいか', hi: 'तरबूज', es: 'Sandía', color: '#50b850' },
                { en: 'Strawberry', zh: '草莓', ja: 'いちご', hi: 'स्ट्रॉबेरी', es: 'Fresa', color: '#e04050' },
                { en: 'Milk', zh: '牛奶', ja: '牛乳', hi: 'दूध', es: 'Leche', color: '#f8f8f0' },
                { en: 'Bread', zh: '面包', ja: 'パン', hi: 'रोटी', es: 'Pan', color: '#d4a050' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                ctx.fillStyle = item.color;
                switch (item.en) {
                    case 'Apple':
                        ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#5a3'; ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.65, x + s * 0.1, y - s * 0.55); ctx.quadraticCurveTo(x + s * 0.05, y - s * 0.45, x, y - s * 0.4); ctx.fill();
                        // Stem
                        ctx.strokeStyle = '#654'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x, y - s * 0.55); ctx.stroke();
                        break;
                    case 'Banana':
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.4, y + s * 0.1);
                        ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.4, x + s * 0.3, y - s * 0.3);
                        ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.2, x + s * 0.4, y);
                        ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.1, x - s * 0.4, y + s * 0.1);
                        ctx.closePath(); ctx.fill();
                        break;
                    case 'Orange':
                        ctx.beginPath(); ctx.arc(x, y, s * 0.42, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#5a3'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.42, s * 0.06, s * 0.04, 0, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Grape':
                        for (let row = 0; row < 4; row++) {
                            const count = 4 - row;
                            for (let i = 0; i < count; i++) {
                                const gx = x + (i - (count - 1) / 2) * s * 0.22;
                                const gy = y - s * 0.3 + row * s * 0.2;
                                ctx.beginPath(); ctx.arc(gx, gy, s * 0.1, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                        break;
                    case 'Watermelon':
                        // Half slice
                        ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0, Math.PI); ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#e04050';
                        ctx.beginPath(); ctx.arc(x, y, s * 0.38, 0, Math.PI); ctx.closePath(); ctx.fill();
                        // Seeds
                        ctx.fillStyle = '#333';
                        for (let i = 0; i < 5; i++) {
                            const angle = Math.PI * 0.2 + (Math.PI * 0.6 / 4) * i;
                            ctx.beginPath(); ctx.ellipse(x + Math.cos(angle) * s * 0.2, y + Math.sin(angle) * s * 0.2, s * 0.03, s * 0.05, angle, 0, Math.PI * 2); ctx.fill();
                        }
                        break;
                    case 'Strawberry':
                        ctx.beginPath(); ctx.moveTo(x, y - s * 0.35);
                        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.1, x + s * 0.2, y + s * 0.35);
                        ctx.quadraticCurveTo(x, y + s * 0.45, x - s * 0.2, y + s * 0.35);
                        ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.1, x, y - s * 0.35);
                        ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#5a3';
                        ctx.beginPath(); ctx.moveTo(x - s * 0.15, y - s * 0.35); ctx.lineTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.15, y - s * 0.35); ctx.fill();
                        break;
                    case 'Milk':
                        // Bottle/carton shape
                        ctx.fillStyle = '#f8f8f0'; ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.2, y - s * 0.45); ctx.lineTo(x - s * 0.15, y - s * 0.3);
                        ctx.lineTo(x - s * 0.25, y - s * 0.2); ctx.lineTo(x - s * 0.25, y + s * 0.45);
                        ctx.lineTo(x + s * 0.25, y + s * 0.45); ctx.lineTo(x + s * 0.25, y - s * 0.2);
                        ctx.lineTo(x + s * 0.15, y - s * 0.3); ctx.lineTo(x + s * 0.2, y - s * 0.45);
                        ctx.closePath(); ctx.fill(); ctx.stroke();
                        // Label
                        ctx.fillStyle = '#a0d0f0';
                        ctx.fillRect(x - s * 0.22, y, s * 0.44, s * 0.2);
                        break;
                    case 'Bread':
                        ctx.beginPath();
                        ctx.ellipse(x, y - s * 0.1, s * 0.4, s * 0.25, 0, Math.PI, 0);
                        ctx.lineTo(x + s * 0.4, y + s * 0.2);
                        ctx.lineTo(x - s * 0.4, y + s * 0.2);
                        ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#c08030';
                        ctx.beginPath(); ctx.ellipse(x, y - s * 0.1, s * 0.4, s * 0.25, 0, Math.PI, 0); ctx.fill();
                        break;
                }
            }
        },

        vehicles: {
            label: 'Vehicles',
            items: [
                { en: 'Car', zh: '汽车', ja: '車', hi: 'कार', es: 'Coche', color: '#e87070' },
                { en: 'Bus', zh: '公交车', ja: 'バス', hi: 'बस', es: 'Autobús', color: '#f0c040' },
                { en: 'Train', zh: '火车', ja: '電車', hi: 'ट्रेन', es: 'Tren', color: '#70a0e8' },
                { en: 'Airplane', zh: '飞机', ja: '飛行機', hi: 'हवाई जहाज', es: 'Avión', color: '#e0e0e8' },
                { en: 'Boat', zh: '船', ja: '船', hi: 'नाव', es: 'Barco', color: '#70c0c0' },
                { en: 'Bicycle', zh: '自行车', ja: '自転車', hi: 'साइकिल', es: 'Bicicleta', color: '#50b050' },
                { en: 'Rocket', zh: '火箭', ja: 'ロケット', hi: 'रॉकेट', es: 'Cohete', color: '#f0f0f8' },
                { en: 'Helicopter', zh: '直升机', ja: 'ヘリコプター', hi: 'हेलीकॉप्टर', es: 'Helicóptero', color: '#f0a050' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                ctx.fillStyle = item.color;
                switch (item.en) {
                    case 'Car':
                        // Body
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.5, y - s * 0.15);
                        ctx.lineTo(x - s * 0.3, y - s * 0.15); ctx.lineTo(x - s * 0.2, y - s * 0.4);
                        ctx.lineTo(x + s * 0.2, y - s * 0.4); ctx.lineTo(x + s * 0.35, y - s * 0.15);
                        ctx.lineTo(x + s * 0.5, y - s * 0.15); ctx.lineTo(x + s * 0.5, y);
                        ctx.closePath(); ctx.fill();
                        // Wheels
                        ctx.fillStyle = '#333';
                        ctx.beginPath(); ctx.arc(x - s * 0.25, y + s * 0.05, s * 0.1, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.05, s * 0.1, 0, Math.PI * 2); ctx.fill();
                        // Window
                        ctx.fillStyle = '#a0d8f8';
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.15, y - s * 0.18); ctx.lineTo(x - s * 0.1, y - s * 0.35);
                        ctx.lineTo(x + s * 0.1, y - s * 0.35); ctx.lineTo(x + s * 0.2, y - s * 0.18);
                        ctx.closePath(); ctx.fill();
                        break;
                    case 'Bus':
                        ctx.beginPath();
                        ctx.rect(x - s * 0.55, y - s * 0.35, s * 1.1, s * 0.55);
                        ctx.fill();
                        // Windows
                        ctx.fillStyle = '#a0d8f8';
                        for (let i = 0; i < 4; i++) {
                            ctx.fillRect(x - s * 0.45 + i * s * 0.27, y - s * 0.28, s * 0.18, s * 0.2);
                        }
                        // Wheels
                        ctx.fillStyle = '#333';
                        ctx.beginPath(); ctx.arc(x - s * 0.3, y + s * 0.25, s * 0.1, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.25, s * 0.1, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Train':
                        ctx.beginPath(); ctx.rect(x - s * 0.5, y - s * 0.3, s * 1.0, s * 0.45); ctx.fill();
                        // Roof
                        ctx.fillStyle = '#5080c0';
                        ctx.beginPath(); ctx.rect(x - s * 0.45, y - s * 0.38, s * 0.9, s * 0.08); ctx.fill();
                        // Windows
                        ctx.fillStyle = '#f0f8ff';
                        ctx.fillRect(x - s * 0.35, y - s * 0.2, s * 0.2, s * 0.2);
                        ctx.fillRect(x - s * 0.05, y - s * 0.2, s * 0.2, s * 0.2);
                        ctx.fillRect(x + s * 0.25, y - s * 0.2, s * 0.2, s * 0.2);
                        // Wheels
                        ctx.fillStyle = '#333';
                        ctx.beginPath(); ctx.arc(x - s * 0.3, y + s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y + s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Airplane':
                        // Fuselage
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.55, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
                        // Wings
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.1, y); ctx.lineTo(x - s * 0.15, y - s * 0.45);
                        ctx.lineTo(x + s * 0.15, y - s * 0.45); ctx.lineTo(x + s * 0.1, y);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.1, y); ctx.lineTo(x - s * 0.15, y + s * 0.45);
                        ctx.lineTo(x + s * 0.15, y + s * 0.45); ctx.lineTo(x + s * 0.1, y);
                        ctx.fill();
                        // Tail
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.55, y - s * 0.2);
                        ctx.lineTo(x - s * 0.4, y); ctx.fill();
                        // Nose
                        ctx.fillStyle = '#a0a8b0';
                        ctx.beginPath(); ctx.arc(x + s * 0.5, y, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Boat':
                        // Hull
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.4, y + s * 0.25);
                        ctx.lineTo(x + s * 0.4, y + s * 0.25); ctx.lineTo(x + s * 0.5, y);
                        ctx.closePath(); ctx.fill();
                        // Cabin
                        ctx.fillStyle = '#f0f0f8';
                        ctx.fillRect(x - s * 0.15, y - s * 0.25, s * 0.3, s * 0.25);
                        // Mast
                        ctx.strokeStyle = '#654'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(x, y - s * 0.25); ctx.lineTo(x, y - s * 0.55); ctx.stroke();
                        // Flag
                        ctx.fillStyle = '#e87070';
                        ctx.beginPath(); ctx.moveTo(x, y - s * 0.55); ctx.lineTo(x + s * 0.15, y - s * 0.45); ctx.lineTo(x, y - s * 0.35); ctx.fill();
                        break;
                    case 'Bicycle':
                        // Wheels
                        ctx.strokeStyle = item.color; ctx.lineWidth = 3; ctx.fillStyle = 'transparent';
                        ctx.beginPath(); ctx.arc(x - s * 0.3, y + s * 0.1, s * 0.2, 0, Math.PI * 2); ctx.stroke();
                        ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.1, s * 0.2, 0, Math.PI * 2); ctx.stroke();
                        // Frame
                        ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 0.1); ctx.lineTo(x, y - s * 0.15); ctx.lineTo(x + s * 0.3, y + s * 0.1); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 0.1); ctx.lineTo(x + s * 0.1, y + s * 0.1); ctx.lineTo(x, y - s * 0.15); ctx.stroke();
                        // Handlebars
                        ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.25); ctx.lineTo(x + s * 0.3, y - s * 0.1); ctx.stroke();
                        // Seat
                        ctx.fillStyle = '#333';
                        ctx.beginPath(); ctx.ellipse(x - s * 0.05, y - s * 0.2, s * 0.08, s * 0.04, 0, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Rocket':
                        ctx.beginPath();
                        ctx.moveTo(x, y - s * 0.6); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.3, x + s * 0.15, y + s * 0.3);
                        ctx.lineTo(x - s * 0.15, y + s * 0.3); ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.3, x, y - s * 0.6);
                        ctx.closePath(); ctx.fill();
                        // Fins
                        ctx.fillStyle = '#e87070';
                        ctx.beginPath(); ctx.moveTo(x - s * 0.15, y + s * 0.15); ctx.lineTo(x - s * 0.3, y + s * 0.4); ctx.lineTo(x - s * 0.1, y + s * 0.3); ctx.fill();
                        ctx.beginPath(); ctx.moveTo(x + s * 0.15, y + s * 0.15); ctx.lineTo(x + s * 0.3, y + s * 0.4); ctx.lineTo(x + s * 0.1, y + s * 0.3); ctx.fill();
                        // Window
                        ctx.fillStyle = '#a0d8f8';
                        ctx.beginPath(); ctx.arc(x, y - s * 0.15, s * 0.08, 0, Math.PI * 2); ctx.fill();
                        // Flame
                        ctx.fillStyle = '#f0a030';
                        ctx.beginPath(); ctx.moveTo(x - s * 0.08, y + s * 0.3); ctx.quadraticCurveTo(x, y + s * 0.55, x + s * 0.08, y + s * 0.3); ctx.fill();
                        break;
                    case 'Helicopter':
                        // Body
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.35, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
                        // Tail
                        ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.05); ctx.lineTo(x - s * 0.7, y - s * 0.15);
                        ctx.lineTo(x - s * 0.7, y + s * 0.05); ctx.lineTo(x - s * 0.3, y + s * 0.05); ctx.fill();
                        // Rotor
                        ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.25); ctx.lineTo(x + s * 0.5, y - s * 0.25); ctx.stroke();
                        // Rotor hub
                        ctx.fillStyle = '#555';
                        ctx.beginPath(); ctx.arc(x, y - s * 0.25, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        // Skids
                        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(x - s * 0.25, y + s * 0.2); ctx.lineTo(x - s * 0.25, y + s * 0.3); ctx.lineTo(x + s * 0.25, y + s * 0.3); ctx.lineTo(x + s * 0.25, y + s * 0.2); ctx.stroke();
                        break;
                }
            }
        },

        nature_words: {
            label: 'Nature',
            items: [
                { en: 'Sun', zh: '太阳', ja: '太陽', hi: 'सूरज', es: 'Sol', color: '#f0c030' },
                { en: 'Moon', zh: '月亮', ja: '月', hi: 'चाँद', es: 'Luna', color: '#f0e8a0' },
                { en: 'Star', zh: '星星', ja: '星', hi: 'तारा', es: 'Estrella', color: '#f0d860' },
                { en: 'Tree', zh: '树', ja: '木', hi: 'पेड़', es: 'Árbol', color: '#50a850' },
                { en: 'Flower', zh: '花', ja: '花', hi: 'फूल', es: 'Flor', color: '#f070a0' },
                { en: 'Rain', zh: '雨', ja: '雨', hi: 'बारिश', es: 'Lluvia', color: '#70b0e8' },
                { en: 'Cloud', zh: '云', ja: '雲', hi: 'बादल', es: 'Nube', color: '#e0e8f0' },
                { en: 'Rainbow', zh: '彩虹', ja: '虹', hi: 'इंद्रधनुष', es: 'Arcoíris', color: '#e87070' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                ctx.fillStyle = item.color;
                switch (item.en) {
                    case 'Sun':
                        ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, Math.PI * 2); ctx.fill();
                        // Rays
                        ctx.strokeStyle = item.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
                        for (let i = 0; i < 8; i++) {
                            const a = (i / 8) * Math.PI * 2;
                            ctx.beginPath();
                            ctx.moveTo(x + Math.cos(a) * s * 0.35, y + Math.sin(a) * s * 0.35);
                            ctx.lineTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5);
                            ctx.stroke();
                        }
                        break;
                    case 'Moon':
                        ctx.beginPath(); ctx.arc(x, y, s * 0.35, 0, Math.PI * 2); ctx.fill();
                        // Shadow to make crescent
                        ctx.fillStyle = '#faf8f5';
                        ctx.beginPath(); ctx.arc(x + s * 0.15, y - s * 0.05, s * 0.28, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Star':
                        ctx.beginPath();
                        for (let i = 0; i < 10; i++) {
                            const r = i % 2 === 0 ? s * 0.45 : s * 0.2;
                            const a = (i * Math.PI) / 5 - Math.PI / 2;
                            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
                            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                        }
                        ctx.closePath(); ctx.fill();
                        break;
                    case 'Tree':
                        // Trunk
                        ctx.fillStyle = '#8b6040';
                        ctx.fillRect(x - s * 0.08, y + s * 0.1, s * 0.16, s * 0.4);
                        // Crown
                        ctx.fillStyle = item.color;
                        ctx.beginPath(); ctx.arc(x, y - s * 0.1, s * 0.35, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x - s * 0.2, y + s * 0.05, s * 0.25, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.2, y + s * 0.05, s * 0.25, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Flower':
                        // Petals
                        const petalColors = ['#f070a0', '#f0a0c0', '#f090b0', '#f080a8', '#f0a0b8'];
                        for (let i = 0; i < 5; i++) {
                            ctx.fillStyle = petalColors[i];
                            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                            ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * s * 0.18, y + Math.sin(a) * s * 0.18, s * 0.15, s * 0.1, a, 0, Math.PI * 2); ctx.fill();
                        }
                        // Center
                        ctx.fillStyle = '#f0c030';
                        ctx.beginPath(); ctx.arc(x, y, s * 0.1, 0, Math.PI * 2); ctx.fill();
                        // Stem
                        ctx.strokeStyle = '#50a850'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(x, y + s * 0.18); ctx.lineTo(x, y + s * 0.5); ctx.stroke();
                        break;
                    case 'Rain':
                        // Cloud
                        ctx.fillStyle = '#c8d0d8';
                        ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.2, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.2, y - s * 0.15, s * 0.15, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x - s * 0.18, y - s * 0.15, s * 0.15, 0, Math.PI * 2); ctx.fill();
                        // Drops
                        ctx.fillStyle = item.color;
                        for (let i = 0; i < 5; i++) {
                            const dx = x - s * 0.25 + i * s * 0.12;
                            const dy = y + s * 0.1 + (i % 2) * s * 0.12;
                            ctx.beginPath(); ctx.ellipse(dx, dy, s * 0.03, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
                        }
                        break;
                    case 'Cloud':
                        ctx.beginPath(); ctx.arc(x, y, s * 0.25, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.25, y + s * 0.05, s * 0.2, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x - s * 0.22, y + s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + s * 0.1, y - s * 0.12, s * 0.18, 0, Math.PI * 2); ctx.fill();
                        break;
                    case 'Rainbow':
                        const rainbow = ['#e87070', '#f0a030', '#f0d040', '#50b850', '#4090e0', '#7050c0'];
                        for (let i = 0; i < rainbow.length; i++) {
                            ctx.strokeStyle = rainbow[i]; ctx.lineWidth = s * 0.06;
                            ctx.beginPath(); ctx.arc(x, y + s * 0.2, s * 0.45 - i * s * 0.06, Math.PI, 0); ctx.stroke();
                        }
                        break;
                }
            }
        },

        numbers: {
            label: 'Numbers',
            items: [
                { en: 'One', zh: '一', ja: '一', hi: 'एक', es: 'Uno', value: 1, color: '#f4a7bb' },
                { en: 'Two', zh: '二', ja: '二', hi: 'दो', es: 'Dos', value: 2, color: '#a7d8f4' },
                { en: 'Three', zh: '三', ja: '三', hi: 'तीन', es: 'Tres', value: 3, color: '#b8e6c8' },
                { en: 'Four', zh: '四', ja: '四', hi: 'चार', es: 'Cuatro', value: 4, color: '#f4dda7' },
                { en: 'Five', zh: '五', ja: '五', hi: 'पाँच', es: 'Cinco', value: 5, color: '#c8b8f4' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                // Draw the numeral big
                ctx.fillStyle = item.color;
                ctx.font = `bold ${s * 1.2}px system-ui`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.value.toString(), x, y - s * 0.2);
                // Draw that many dots below
                const dotR = s * 0.08;
                const totalWidth = (item.value - 1) * dotR * 3;
                for (let i = 0; i < item.value; i++) {
                    ctx.beginPath();
                    ctx.arc(x - totalWidth / 2 + i * dotR * 3, y + s * 0.35, dotR, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        },

        body_parts: {
            label: 'Body Parts',
            items: [
                { en: 'Hand', zh: '手', ja: '手', hi: 'हाथ', es: 'Mano', color: '#f4c8a7' },
                { en: 'Foot', zh: '脚', ja: '足', hi: 'पैर', es: 'Pie', color: '#f4c8a7' },
                { en: 'Eye', zh: '眼睛', ja: '目', hi: 'आँख', es: 'Ojo', color: '#a7d8f4' },
                { en: 'Nose', zh: '鼻子', ja: '鼻', hi: 'नाक', es: 'Nariz', color: '#f4c8a7' },
                { en: 'Mouth', zh: '嘴巴', ja: '口', hi: 'मुँह', es: 'Boca', color: '#f4a7bb' },
                { en: 'Ear', zh: '耳朵', ja: '耳', hi: 'कान', es: 'Oreja', color: '#f4c8a7' },
            ],
            draw: function (ctx, item, x, y, size) {
                const s = size * 0.35;
                ctx.fillStyle = item.color;
                switch (item.en) {
                    case 'Hand':
                        // Palm
                        ctx.beginPath(); ctx.ellipse(x, y + s * 0.1, s * 0.25, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
                        // Fingers
                        const fingers = [
                            { dx: -s * 0.2, dy: -s * 0.25, h: s * 0.2 },
                            { dx: -s * 0.1, dy: -s * 0.35, h: s * 0.25 },
                            { dx: 0, dy: -s * 0.38, h: s * 0.28 },
                            { dx: s * 0.1, dy: -s * 0.35, h: s * 0.25 },
                            { dx: s * 0.22, dy: -s * 0.1, h: s * 0.18 },
                        ];
                        fingers.forEach(f => {
                            ctx.beginPath(); ctx.ellipse(x + f.dx, y + f.dy, s * 0.05, f.h * 0.5, 0, 0, Math.PI * 2); ctx.fill();
                        });
                        break;
                    case 'Foot':
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.2, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
                        // Toes
                        for (let i = 0; i < 5; i++) {
                            ctx.beginPath(); ctx.arc(x - s * 0.12 + i * s * 0.06, y - s * 0.42, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        }
                        break;
                    case 'Eye':
                        // White
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.35, s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
                        // Iris
                        ctx.fillStyle = item.color;
                        ctx.beginPath(); ctx.arc(x, y, s * 0.18, 0, Math.PI * 2); ctx.fill();
                        // Pupil
                        ctx.fillStyle = '#222';
                        ctx.beginPath(); ctx.arc(x, y, s * 0.09, 0, Math.PI * 2); ctx.fill();
                        // Highlight
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.arc(x + s * 0.05, y - s * 0.05, s * 0.04, 0, Math.PI * 2); ctx.fill();
                        // Outline
                        ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.35, s * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
                        break;
                    case 'Nose':
                        ctx.beginPath();
                        ctx.moveTo(x, y - s * 0.3);
                        ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.1, x + s * 0.15, y + s * 0.2);
                        ctx.quadraticCurveTo(x, y + s * 0.25, x - s * 0.15, y + s * 0.2);
                        ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.1, x, y - s * 0.3);
                        ctx.closePath(); ctx.fill();
                        ctx.strokeStyle = '#c0a080'; ctx.lineWidth = 2; ctx.stroke();
                        break;
                    case 'Mouth':
                        // Lips shape
                        ctx.beginPath();
                        ctx.moveTo(x - s * 0.3, y);
                        ctx.quadraticCurveTo(x, y - s * 0.15, x + s * 0.3, y);
                        ctx.quadraticCurveTo(x, y + s * 0.2, x - s * 0.3, y);
                        ctx.closePath(); ctx.fill();
                        break;
                    case 'Ear':
                        ctx.beginPath(); ctx.ellipse(x, y, s * 0.2, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
                        // Inner ear
                        ctx.strokeStyle = '#d0a080'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.ellipse(x + s * 0.02, y, s * 0.1, s * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
                        break;
                }
            }
        },
    };

    // --- TTS Engine ---
    // --- Voice Selection (prefer Neural/Online voices, fallback to local) ---
    const voiceCache = {};  // lang -> SpeechSynthesisVoice

    function getBestVoice(lang) {
        if (voiceCache[lang]) return voiceCache[lang];

        const voices = speechSynthesis.getVoices();
        const matching = voices.filter(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));

        // Priority: Online/Neural > Natural > any matching
        const neural = matching.find(v =>
            /online|neural|natural/i.test(v.name)
        );
        const selected = neural || matching[0] || null;
        if (selected) voiceCache[lang] = selected;
        return selected;
    }

    // Pre-warm voice list (async on some browsers)
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.addEventListener('voiceschanged', () => {
            // Clear cache so next speak picks up new voices
            Object.keys(voiceCache).forEach(k => delete voiceCache[k]);
        });
    }

    function speakSequence(item) {
        if (!('speechSynthesis' in window)) return;

        const thirdLang = getNextThirdLang();
        const langKey = { 'ja-JP': 'ja', 'hi-IN': 'hi', 'es-ES': 'es' }[thirdLang.code];

        const sequence = [
            { text: item.en, lang: 'en-US', delay: 0 },
            { text: item.zh, lang: 'zh-CN', delay: 1200 },
            { text: item[langKey], lang: thirdLang.code, delay: 2400 },
        ];

        sequence.forEach(({ text, lang, delay }) => {
            setTimeout(() => {
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = lang;
                const voice = getBestVoice(lang);
                if (voice) utter.voice = voice;
                utter.rate = 0.8;
                utter.pitch = 1.1;
                utter.volume = 0.8;
                speechSynthesis.speak(utter);
            }, delay);
        });
    }

    // --- Public API ---
    const categoryKeys = Object.keys(CATEGORIES);

    return {
        CATEGORIES,
        categoryKeys,
        speakSequence,
        getBestVoice,
        getRandomItem: function (categoryKey) {
            const cat = CATEGORIES[categoryKey];
            return cat.items[Math.floor(Math.random() * cat.items.length)];
        },
        getCategoryCount: function () {
            return categoryKeys.length;
        },
    };
})();
