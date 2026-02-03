// Background Service Worker для NSFW Filter

// Service worker не может создавать DOM/iframe
// Классификация происходит напрямую в content script через sandbox iframe

// Инициализация настроек при первом запуске
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    enabled: true,
    sensitivity: 50,
    categories: {
      porn: true,
      sexy: true,
      hentai: true
    },
    stats: {
      blocked: 0,
      scanned: 0
    }
  };

  // Сохраняем настройки только если они не существуют
  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};
  
  for (const key of Object.keys(defaults)) {
    if (existing[key] === undefined) {
      toSet[key] = defaults[key];
    }
  }

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  console.log('NSFW Filter: Extension installed and initialized');
});

// Обработка сообщений от content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATS') {
    updateStats(message.blocked, message.scanned);
    sendResponse({ success: true });
  } else if (message.type === 'GET_SETTINGS') {
    getSettings().then(sendResponse);
    return true; // Асинхронный ответ
  }
  return false;
});

// Обновление статистики
async function updateStats(blocked, scanned) {
  const result = await chrome.storage.local.get('stats');
  const stats = result.stats ?? { blocked: 0, scanned: 0 };
  
  stats.blocked += blocked;
  stats.scanned += scanned;
  
  await chrome.storage.local.set({ stats });
}

// Получение настроек
async function getSettings() {
  const result = await chrome.storage.local.get([
    'enabled',
    'sensitivity',
    'categories'
  ]);

  return {
    enabled: result.enabled !== false,
    sensitivity: result.sensitivity ?? 50,
    categories: result.categories ?? { porn: true, sexy: true, hentai: true }
  };
}
