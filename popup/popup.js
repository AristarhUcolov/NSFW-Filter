// Элементы управления
const enableFilter = document.getElementById('enableFilter');
const sensitivity = document.getElementById('sensitivity');
const sensitivityValue = document.getElementById('sensitivityValue');
const blockedCount = document.getElementById('blockedCount');
const scannedCount = document.getElementById('scannedCount');
const resetStats = document.getElementById('resetStats');
const showBankDetails = document.getElementById('showBankDetails');
const bankDetails = document.getElementById('bankDetails');

// Загрузка локализованных текстов
function loadI18nMessages() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      // Для ссылок и кнопок добавляем иконки
      if (key === 'buyMeCoffee') {
        element.textContent = '☕ ' + message;
      } else if (key === 'bankTransfer') {
        element.textContent = '🏦 ' + message;
      } else {
        element.textContent = message;
      }
    }
  });
  
  // Обновляем lang атрибут
  const locale = chrome.i18n.getUILanguage();
  document.documentElement.lang = locale.startsWith('ru') ? 'ru' : 'en';
}

// Загрузка настроек при открытии popup
async function loadSettings() {
  const result = await chrome.storage.local.get([
    'enabled',
    'sensitivity',
    'stats'
  ]);

  // Установка значений
  enableFilter.checked = result.enabled !== false;
  sensitivity.value = result.sensitivity ?? 50;
  sensitivityValue.textContent = `${sensitivity.value}%`;

  const stats = result.stats ?? { blocked: 0, scanned: 0 };
  blockedCount.textContent = formatNumber(stats.blocked);
  scannedCount.textContent = formatNumber(stats.scanned);
}

// Форматирование чисел
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Сохранение настроек
async function saveSettings() {
  const settings = {
    enabled: enableFilter.checked,
    sensitivity: parseInt(sensitivity.value),
    // Все категории всегда включены
    categories: {
      porn: true,
      sexy: true,
      hentai: true
    }
  };

  await chrome.storage.local.set(settings);

  // Уведомление content scripts об изменении настроек
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'SETTINGS_UPDATED',
      settings
    }).catch(() => {});
  }
}

// Обработчики событий
enableFilter.addEventListener('change', saveSettings);

sensitivity.addEventListener('input', () => {
  sensitivityValue.textContent = `${sensitivity.value}%`;
});

sensitivity.addEventListener('change', saveSettings);

resetStats.addEventListener('click', async () => {
  await chrome.storage.local.set({
    stats: { blocked: 0, scanned: 0 }
  });
  blockedCount.textContent = '0';
  scannedCount.textContent = '0';
});

// Показать/скрыть банковские реквизиты
showBankDetails.addEventListener('click', () => {
  bankDetails.classList.toggle('hidden');
});

// Обновление статистики в реальном времени
chrome.storage.onChanged.addListener((changes) => {
  if (changes.stats) {
    const stats = changes.stats.newValue;
    blockedCount.textContent = formatNumber(stats.blocked);
    scannedCount.textContent = formatNumber(stats.scanned);
  }
});

// Инициализация
loadI18nMessages();
loadSettings();
