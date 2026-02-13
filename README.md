# 🛡️ NSFW Filter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/AristarhUcolov/NSFW-Filter?style=social)](https://github.com/AristarhUcolov/NSFW-Filter/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/AristarhUcolov/NSFW-Filter)](https://github.com/AristarhUcolov/NSFW-Filter/issues)
[![GitHub Release](https://img.shields.io/github/v/release/AristarhUcolov/NSFW-Filter?include_prereleases)](https://github.com/AristarhUcolov/NSFW-Filter/releases)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-brightgreen)](https://github.com/AristarhUcolov/NSFW-Filter)
[![Version](https://img.shields.io/badge/version-1.3.0-blue)](https://github.com/AristarhUcolov/NSFW-Filter)

[🇷🇺 Русский](#russian) | [🇬🇧 English](#english)

---

<a name="russian"></a>
## 🇷🇺 Русская версия

### Защита от нежелательного контента

Chrome расширение для блокировки NSFW контента (порнография, хентай, откровенные изображения) в реальном времени с использованием AI на базе TensorFlow.js и NSFWJS.

## ✨ Возможности

- 🔒 **Блокировка в реальном времени** - изображения проверяются мгновенно при загрузке страницы
- 🎚️ **Настраиваемая чувствительность** - ползунок от 0% до 100% для регулировки строгости фильтра
- 📊 **Категории блокировки** - выбор типов контента для блокировки:
  - Порнография
  - Откровенный контент (Sexy)
  - Хентай
- 📈 **Статистика** - отслеживание количества заблокированных и проверенных изображений
- 🖥️ **Локальная обработка** - вся обработка происходит на вашем компьютере, никакие данные не отправляются на сервер
- ⚡ **Быстрая работа** - использует предобученную модель машинного обучения
- 🌐 **Работа с cross-origin изображениями** — автоматически обрабатывает изображения с других доменов
- 🔄 **Параллельная обработка** — до 4 одновременных классификаций с приоритетом видимых изображений

## 📦 Установка

### Способ 1: Загрузка из папки (режим разработчика)

1. Скачайте или клонируйте этот репозиторий
2. Откройте Chrome и перейдите по адресу `chrome://extensions/`
3. Включите **Режим разработчика** (переключатель в правом верхнем углу)
4. Нажмите **Загрузить распакованное расширение**
5. Выберите папку `NSFW-Filter`
6. Расширение установлено! 🎉

## 🎮 Использование

1. Кликните на иконку расширения 🛡️ в панели инструментов Chrome
2. Используйте переключатель для включения/выключения защиты
3. Настройте чувствительность фильтра:
   - **0%** - Мягкий режим (блокируются только явно откровенные изображения)
   - **50%** - Сбалансированный режим (рекомендуется)
   - **100%** - Строгий режим (блокируются даже подозрительные изображения)
4. Выберите категории контента для блокировки
5. Наблюдайте за статистикой заблокированных изображений

## 🔧 Как это работает

1. Расширение сканирует все изображения на странице
2. Каждое изображение анализируется нейросетью NSFWJS
3. Модель классифицирует изображение по 5 категориям:
   - `Drawing` - Рисунки, иллюстрации
   - `Hentai` - Аниме/хентай контент
   - `Neutral` - Безопасный контент
   - `Porn` - Порнографический контент
   - `Sexy` - Откровенный контент
4. Если вероятность нежелательного контента превышает порог, изображение заменяется белой заглушкой

## 📁 Структура проекта

```
NSFW-Filter/
├── manifest.json          # Конфигурация расширения
├── background/
│   └── background.js      # Service Worker (маршрутизация запросов)
├── offscreen/
│   ├── offscreen.html     # Offscreen document (персистентный)
│   └── offscreen.js       # Мост между SW и sandbox
├── sandbox/
│   ├── sandbox.html       # Sandbox страница (unsafe-eval для TF.js)
│   └── sandbox.js         # Загрузка модели и классификация
├── content/
│   └── content.js         # Скрипт анализа изображений на страницах
├── popup/
│   ├── popup.html         # Интерфейс настроек
│   ├── popup.css          # Стили интерфейса
│   └── popup.js           # Логика интерфейса
├── icons/
│   ├── icon16.png         # Иконка 16x16
│   ├── icon48.png         # Иконка 48x48
│   └── icon128.png        # Иконка 128x128
├── lib/
│   └── nsfwjs.min.js      # NSFWJS + TensorFlow.js (bundled)
└── models/
    ├── model.json         # Конфигурация модели
    └── group1-shard*of6   # Веса модели (6 файлов)
```

## ⚠️ Ограничения

- Модель не идеальна и может иногда ошибаться
- Некоторые изображения могут быть неправильно классифицированы (ложные срабатывания)
- Изображения меньше 50x50 пикселей игнорируются
- Некоторые cross-origin изображения с жёсткими ограничениями CORS могут не анализироваться

## 🔒 Приватность

- Все изображения обрабатываются **локально** на вашем устройстве
- Никакие данные **не отправляются** на внешние серверы
- Расширение не собирает и не хранит личную информацию

## 🛠️ Технологии

- [TensorFlow.js](https://www.tensorflow.org/js) - машинное обучение в браузере
- [NSFWJS](https://github.com/infinitered/nsfwjs) - модель классификации контента
- Chrome Extension Manifest V3
## 📋 История изменений

### v1.3.0
- ⚡ **Централизованная модель** — модель загружается один раз через offscreen document, общая для всех вкладок
- ⚡ Больше нет лагов при загрузке страницы (модель не перезагружается на каждой вкладке)
- 🧹 Удалён sandbox iframe из content scripts
- 🧹 Удалён неиспользуемый `lib/tf.min.js`
- 🏗️ Новая архитектура: content.js → background.js → offscreen.js → sandbox
- 📉 Уменьшен размер content script (~200 строк удалено)

### v1.1.0
- 🐛 Исправлена критическая ошибка двойной загрузки TensorFlow.js (ошибки «kernel already registered»)
- 🐛 Исправлена обработка cross-origin изображений (Google Images и др.)
- ⚡ Оптимизирована производительность: параллельная обработка, очередь с приоритетами, переиспользование canvas
- 🎯 Улучшена 5-классовая система классификации с адаптивными порогами
- 🔄 Автоматическое пересканирование при скролле (поддержка lazy loading)

### v1.0.0
- 🎉 Первый релиз
- Sandbox-архитектура для Manifest V3
- Поддержка русского и английского языков
## 📝 Лицензия

MIT License

## � Поддержать проект

Если это расширение вам помогло, вы можете поддержать разработку:

**☕ Buy Me a Coffee:**
[buymeacoffee.com/aristarh.ucolov](https://buymeacoffee.com/aristarh.ucolov)

**🏦 Банковский перевод:**
- **Банк:** Moldindconbank
- **Карта:** `4028 1202 1106 0963`
- **Получатель:** Aristarh Ucolov

Ваша поддержка помогает развивать проект! 🙏

## 🙏 Благодарности

- [Infinite Red](https://github.com/infinitered) за NSFWJS
- Google за TensorFlow.js

---

<a name="english"></a>
## 🇬🇧 English Version

### Content Protection Extension

A Chrome extension for blocking NSFW content (pornography, hentai, explicit images) in real-time using AI powered by TensorFlow.js and NSFWJS.

## ✨ Features

- 🔒 **Real-time Blocking** - images are checked instantly as pages load
- 🎚️ **Adjustable Sensitivity** - slider from 0% to 100% to control filter strictness
- 📊 **Block Categories** - choose which content types to block:
  - Pornography
  - Explicit Content (Sexy)
  - Hentai
- 📈 **Statistics** - track the number of blocked and scanned images
- 🖥️ **Local Processing** - all processing happens on your computer, no data is sent to any server
- ⚡ **Fast Performance** - uses a pre-trained machine learning model
- 🌐 **Cross-origin Image Support** — automatically handles images from other domains
- 🔄 **Concurrent Processing** — up to 4 simultaneous classifications with visible-image priority

## 📦 Installation

### Method 1: Load from Folder (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked**
5. Select the `NSFW-Filter` folder
6. Extension installed! 🎉

## 🎮 Usage

1. Click the extension icon 🛡️ in the Chrome toolbar
2. Use the toggle to enable/disable protection
3. Adjust the filter sensitivity:
   - **0%** - Soft mode (blocks only explicitly graphic images)
   - **50%** - Balanced mode (recommended)
   - **100%** - Strict mode (blocks even suspicious images)
4. Select content categories to block
5. Monitor blocked images statistics

## 🔧 How It Works

1. The extension scans all images on the page
2. Each image is analyzed by the NSFWJS neural network
3. The model classifies images into 5 categories:
   - `Drawing` - Drawings, illustrations
   - `Hentai` - Anime/hentai content
   - `Neutral` - Safe content
   - `Porn` - Pornographic content
   - `Sexy` - Explicit content
4. If the probability of unwanted content exceeds the threshold, the image is replaced with a white placeholder

## 📁 Project Structure

```
NSFW-Filter/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Service Worker (request routing)
├── offscreen/
│   ├── offscreen.html     # Offscreen document (persistent)
│   └── offscreen.js       # Bridge between SW and sandbox
├── sandbox/
│   ├── sandbox.html       # Sandbox page (unsafe-eval for TF.js)
│   └── sandbox.js         # Model loading and classification
├── content/
│   └── content.js         # Script for analyzing images on pages
├── popup/
│   ├── popup.html         # Settings interface
│   ├── popup.css          # Interface styles
│   └── popup.js           # Interface logic
├── icons/
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
├── lib/
│   └── nsfwjs.min.js      # NSFWJS + TensorFlow.js (bundled)
└── models/
    ├── model.json         # Model configuration
    └── group1-shard*of6   # Model weights (6 files)
```

## ⚠️ Limitations

- The model is not perfect and may sometimes make mistakes
- Some images may be misclassified (false positives)
- Images smaller than 50x50 pixels are ignored
- Some cross-origin images with strict CORS restrictions may not be analyzed

## 🔒 Privacy

- All images are processed **locally** on your device
- No data is **sent** to external servers
- The extension does not collect or store personal information

## 🛠️ Technologies

- [TensorFlow.js](https://www.tensorflow.org/js) - machine learning in the browser
- [NSFWJS](https://github.com/infinitered/nsfwjs) - content classification model
- Chrome Extension Manifest V3

## � Changelog

### v1.3.0
- ⚡ **Centralized model** — model loads once via offscreen document, shared across all tabs
- ⚡ No more lag on page load (model no longer re-initializes per tab)
- 🧹 Removed sandbox iframe from content scripts
- 🧹 Deleted unused `lib/tf.min.js`
- 🏗️ New architecture: content.js → background.js → offscreen.js → sandbox
- 📉 Reduced content script size (~200 lines removed)

### v1.2.0
- 🎨 Compact popup UI — all content visible without scrolling
- 🎨 Horizontal header layout (logo + title + language button in one row)
- 🎨 Donate buttons as compact round icons in footer row
- 🎨 Gradient-filled sensitivity slider track
- 🧹 Removed sensitivity hint text for cleaner layout
- 📐 Reduced padding, margins and font sizes throughout popup

### v1.1.0
- 🐛 Fixed critical double TensorFlow.js loading issue («kernel already registered» errors)
- 🐛 Fixed cross-origin image processing (Google Images etc.)
- ⚡ Performance optimized: concurrent processing, priority queue, canvas reuse
- 🎯 Improved 5-class classification system with adaptive thresholds
- 🔄 Auto-rescan on scroll (lazy loading support)

### v1.0.0
- 🎉 Initial release
- Sandbox architecture for Manifest V3
- Russian and English language support

## �📝 License

MIT License

## 💖 Support the Project

If this extension helped you, you can support development:

**☕ Buy Me a Coffee:**
[buymeacoffee.com/aristarh.ucolov](https://buymeacoffee.com/aristarh.ucolov)

**🏦 Bank Transfer:**
- **Bank:** Moldindconbank
- **Card:** `4028 1202 1106 0963`
- **Recipient:** Aristarh Ucolov

Your support helps keep the project going! 🙏

## 🙏 Acknowledgments

- [Infinite Red](https://github.com/infinitered) for NSFWJS
- Google for TensorFlow.js
