// NSFW Filter Content Script
// Обрабатывает изображения на странице в реальном времени

(async function() {
  'use strict';

  // Конфигурация
  let settings = {
    enabled: true,
    sensitivity: 50,
    categories: { porn: true, sexy: true, hentai: true }
  };

  // Состояние
  let isModelReady = false;
  let isSandboxReady = false;
  let processedImages = new WeakSet();
  let pendingImages = new Set();
  let sandboxIframe = null;
  let pendingRequests = new Map();
  let requestIdCounter = 0;
  
  // Минимальный размер изображения для проверки (пиксели)
  const MIN_IMAGE_SIZE = 64;

  // Создание sandbox iframe
  function createSandboxIframe() {
    if (sandboxIframe) return;
    
    sandboxIframe = document.createElement('iframe');
    sandboxIframe.src = chrome.runtime.getURL('sandbox/sandbox.html');
    sandboxIframe.style.cssText = 'display:none !important; width:0; height:0; border:none; position:fixed; top:-9999px; left:-9999px;';
    sandboxIframe.setAttribute('sandbox', 'allow-scripts');
    
    document.documentElement.appendChild(sandboxIframe);
  }

  // Обработка сообщений от sandbox
  window.addEventListener('message', (event) => {
    // Проверяем что сообщение от нашего sandbox
    if (event.source !== sandboxIframe?.contentWindow) return;
    
    const { type, id, success, predictions, error } = event.data;
    
    if (type === 'SANDBOX_READY') {
      isSandboxReady = true;
      console.log('NSFW Filter: Sandbox ready');
    }
    
    if (type === 'PRELOAD_RESULT') {
      if (success) {
        isModelReady = true;
        console.log('NSFW Filter: Model loaded');
        processPendingImages();
      }
      const pending = pendingRequests.get(id);
      if (pending) {
        pending.resolve({ success, error });
        pendingRequests.delete(id);
      }
    }
    
    if (type === 'CLASSIFY_RESULT') {
      const pending = pendingRequests.get(id);
      if (pending) {
        if (success) {
          pending.resolve({ success: true, predictions });
        } else {
          pending.resolve({ success: false, error });
        }
        pendingRequests.delete(id);
      }
    }
  });
  
  // Отправка сообщения в sandbox с ожиданием ответа
  function sendToSandbox(type, data = {}) {
    return new Promise((resolve, reject) => {
      if (!sandboxIframe?.contentWindow) {
        reject(new Error('Sandbox not available'));
        return;
      }
      
      const id = ++requestIdCounter;
      pendingRequests.set(id, { resolve, reject });
      
      // Таймаут 30 секунд
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
      
      sandboxIframe.contentWindow.postMessage({ type, id, ...data }, '*');
    });
  }
  
  // Преобразование изображения в data URL
  function imageToDataUrl(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // Классификация изображения через sandbox
  async function classifyImage(img) {
    try {
      const imageDataUrl = imageToDataUrl(img);
      const response = await sendToSandbox('CLASSIFY_IMAGE', { imageDataUrl });
      
      if (response && response.success) {
        return response.predictions;
      } else {
        throw new Error(response?.error || 'Classification failed');
      }
    } catch (error) {
      console.debug('NSFW Filter: Classification error', error);
      return null;
    }
  }

  // Предзагрузка модели
  async function preloadModel() {
    if (isModelReady) return;
    if (!isSandboxReady) {
      // Подождём готовности sandbox
      await new Promise(resolve => {
        const check = () => {
          if (isSandboxReady) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
    
    try {
      const response = await sendToSandbox('PRELOAD_MODEL');
      if (response && response.success) {
        isModelReady = true;
        console.log('NSFW Filter: Model preloaded');
        processPendingImages();
      }
    } catch (error) {
      console.debug('NSFW Filter: Model preload error', error);
    }
  }

  // Получение настроек
  async function fetchSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response) {
        settings = response;
      }
    } catch (error) {
      console.error('NSFW Filter: Failed to fetch settings', error);
    }
  }

  // Проверка изображения
  async function checkImage(img) {
    if (!settings.enabled) return;
    if (processedImages.has(img)) return;
    if (img.dataset.nsfwBlocked === 'true') return;
    if (img.width < MIN_IMAGE_SIZE || img.height < MIN_IMAGE_SIZE) return;
    
    processedImages.add(img);
    
    try {
      const predictions = await classifyImage(img);
      if (!predictions) return;
      
      const result = analyzeResults(predictions);
      
      if (result.shouldBlock) {
        blockImage(img, result.reason);
        updateStats(1, 1);
      } else {
        updateStats(0, 1);
      }
    } catch (error) {
      console.debug('NSFW Filter: Check image error', error);
    }
  }

  // Анализ результатов классификации
  function analyzeResults(predictions) {
    // Преобразуем чувствительность (0-100) в порог (1.0-0.0)
    // sensitivity 0 = threshold 1.0 (ничего не блокируем)
    // sensitivity 100 = threshold 0.0 (блокируем всё)
    const threshold = 1 - (settings.sensitivity / 100);
    
    let shouldBlock = false;
    let reason = '';
    let maxScore = 0;

    for (const pred of predictions) {
      const className = pred.className.toLowerCase();
      const probability = pred.probability;

      // Проверяем каждую категорию
      if (className === 'porn' && settings.categories.porn) {
        if (probability >= threshold) {
          shouldBlock = true;
          if (probability > maxScore) {
            maxScore = probability;
            reason = 'Порнография';
          }
        }
      }
      
      if (className === 'sexy' && settings.categories.sexy) {
        // Для "sexy" используем более высокий порог
        const sexyThreshold = Math.min(threshold + 0.2, 0.95);
        if (probability >= sexyThreshold) {
          shouldBlock = true;
          if (probability > maxScore) {
            maxScore = probability;
            reason = 'Откровенный контент';
          }
        }
      }
      
      if (className === 'hentai' && settings.categories.hentai) {
        if (probability >= threshold) {
          shouldBlock = true;
          if (probability > maxScore) {
            maxScore = probability;
            reason = 'Хентай';
          }
        }
      }
    }

    return { shouldBlock, reason, score: maxScore };
  }

  // Блокировка изображения
  function blockImage(img, reason) {
    // Сохраняем оригинальные стили
    img.dataset.nsfwOriginalSrc = img.src;
    img.dataset.nsfwBlocked = 'true';
    img.dataset.nsfwReason = reason;
    
    // Создаём белый placeholder
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 200;
    canvas.height = img.naturalHeight || img.height || 200;
    
    const ctx = canvas.getContext('2d');
    
    // Белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Добавляем иконку щита
    ctx.fillStyle = '#e0e0e0';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const iconSize = Math.min(canvas.width, canvas.height) * 0.3;
    
    // Рисуем простой щит
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - iconSize/2);
    ctx.lineTo(centerX + iconSize/2, centerY - iconSize/4);
    ctx.lineTo(centerX + iconSize/2, centerY + iconSize/4);
    ctx.quadraticCurveTo(centerX, centerY + iconSize/2, centerX, centerY + iconSize/2);
    ctx.quadraticCurveTo(centerX, centerY + iconSize/2, centerX - iconSize/2, centerY + iconSize/4);
    ctx.lineTo(centerX - iconSize/2, centerY - iconSize/4);
    ctx.closePath();
    ctx.fill();
    
    // Заменяем src
    img.src = canvas.toDataURL('image/png');
    
    // Добавляем стили
    img.style.filter = 'none';
    img.style.opacity = '1';
    
    console.log(`NSFW Filter: Blocked image (${reason})`);
  }

  // Обновление статистики
  let statsBuffer = { blocked: 0, scanned: 0 };
  let statsTimeout = null;

  function updateStats(blocked, scanned) {
    statsBuffer.blocked += blocked;
    statsBuffer.scanned += scanned;

    // Отправляем статистику с задержкой для оптимизации
    if (!statsTimeout) {
      statsTimeout = setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_STATS',
          blocked: statsBuffer.blocked,
          scanned: statsBuffer.scanned
        }).catch(() => {});
        
        statsBuffer = { blocked: 0, scanned: 0 };
        statsTimeout = null;
      }, 1000);
    }
  }

  // Обработка отложенных изображений
  function processPendingImages() {
    for (const img of pendingImages) {
      if (img.complete && img.naturalWidth > 0) {
        checkImage(img);
      }
    }
    pendingImages.clear();
  }

  // Обработка нового изображения
  function handleImage(img) {
    if (!settings.enabled) return;
    if (processedImages.has(img)) return;
    if (img.dataset.nsfwBlocked === 'true') return;
    
    if (img.width < MIN_IMAGE_SIZE && img.height < MIN_IMAGE_SIZE) {
      return;
    }

    if (!isModelReady || !isSandboxReady) {
      pendingImages.add(img);
      preloadModel();
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      checkImage(img);
    } else {
      img.addEventListener('load', () => checkImage(img), { once: true });
    }
  }

  // Поиск всех изображений на странице
  function scanPage() {
    const images = document.querySelectorAll('img');
    images.forEach(handleImage);
  }

  // Наблюдатель за изменениями DOM
  const observer = new MutationObserver((mutations) => {
    if (!settings.enabled) return;
    
    for (const mutation of mutations) {
      // Новые узлы
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'IMG') {
          handleImage(node);
        } else if (node.querySelectorAll) {
          const images = node.querySelectorAll('img');
          images.forEach(handleImage);
        }
      }
      
      // Изменение атрибутов (например, src)
      if (mutation.type === 'attributes' && mutation.target.nodeName === 'IMG') {
        const img = mutation.target;
        // Пропускаем уже заблокированные изображения
        if (img.dataset.nsfwBlocked === 'true') {
          continue;
        }
        if (mutation.attributeName === 'src') {
          processedImages.delete(img);
          handleImage(img);
        }
      }
    }
  });

  // Слушатель обновления настроек
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
      settings = message.settings;
      
      // Если фильтр выключен, можно показать заблокированные изображения
      if (!settings.enabled) {
        document.querySelectorAll('img[data-nsfw-blocked="true"]').forEach(img => {
          if (img.dataset.nsfwOriginalSrc) {
            img.src = img.dataset.nsfwOriginalSrc;
            delete img.dataset.nsfwBlocked;
            delete img.dataset.nsfwOriginalSrc;
            delete img.dataset.nsfwReason;
            processedImages.delete(img);
          }
        });
      } else {
        // Перепроверяем страницу с новыми настройками
        processedImages = new WeakSet();
        scanPage();
      }
    }
  });

  // Инициализация
  async function init() {
    await fetchSettings();
    
    if (!settings.enabled) return;
    
    // Создаём sandbox iframe
    createSandboxIframe();
    
    // Запускаем наблюдатель
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    });
    
    // Сканируем существующие изображения
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanPage);
    } else {
      scanPage();
    }
    
    // Повторное сканирование после полной загрузки
    window.addEventListener('load', scanPage);
    
    // Предзагрузка модели
    preloadModel();
  }

  init();
})();
