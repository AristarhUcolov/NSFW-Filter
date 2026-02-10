// Sandbox для классификации изображений
// Работает в изолированном контексте с разрешённым unsafe-eval
// Оптимизировано для максимальной производительности

let model = null;
let modelLoadPromise = null;

// Загрузка модели
async function loadModel() {
  if (model) return model;
  if (modelLoadPromise) return modelLoadPromise;
  
  modelLoadPromise = (async () => {
    try {
      console.log('NSFW Filter Sandbox: Loading model...');
      
      // nsfwjs.min.js bundles TensorFlow.js internally
      // It auto-detects the best backend (WebGL if available, CPU fallback)
      // No need to manually call tf.setBackend — tf is not exposed as a global
      
      model = await nsfwjs.load('../models/', { size: 299 });
      console.log('NSFW Filter Sandbox: Model loaded successfully');
      return model;
    } catch (error) {
      console.error('NSFW Filter Sandbox: Failed to load model', error);
      modelLoadPromise = null;
      throw error;
    }
  })();
  
  return modelLoadPromise;
}

// Оптимизированная классификация: принимает ImageBitmap напрямую
async function classifyFromBitmap(bitmap) {
  const loadedModel = await loadModel();
  if (!loadedModel) throw new Error('Model not available');
  
  // Рисуем bitmap на canvas 299x299 (размер модели)
  const canvas = new OffscreenCanvas(299, 299);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, 299, 299);
  bitmap.close(); // Освобождаем память
  
  // Классифицируем
  const predictions = await loadedModel.classify(canvas, 5);
  
  // Возвращаем упрощённый формат для быстрой передачи
  return predictions.map(p => ({
    className: p.className,
    probability: p.probability
  }));
}

// Фоллбэк: классификация по data URL
async function classifyFromDataUrl(imageDataUrl) {
  const loadedModel = await loadModel();
  if (!loadedModel) throw new Error('Model not available');
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const predictions = await loadedModel.classify(img, 5);
        resolve(predictions.map(p => ({
          className: p.className,
          probability: p.probability
        })));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

// Обработка сообщений
window.addEventListener('message', async (event) => {
  const { type, id, imageDataUrl } = event.data;
  
  if (type === 'CLASSIFY_IMAGE') {
    try {
      let predictions;
      
      // Если передан ImageBitmap через transfer
      if (event.data.bitmap) {
        predictions = await classifyFromBitmap(event.data.bitmap);
      } else if (imageDataUrl) {
        predictions = await classifyFromDataUrl(imageDataUrl);
      } else {
        throw new Error('No image data provided');
      }
      
      window.parent.postMessage({
        type: 'CLASSIFY_RESULT',
        id,
        success: true,
        predictions
      }, '*');
    } catch (error) {
      window.parent.postMessage({
        type: 'CLASSIFY_RESULT',
        id,
        success: false,
        error: error.message
      }, '*');
    }
  }
  
  if (type === 'CLASSIFY_BATCH') {
    // Пакетная классификация
    const results = [];
    for (const item of event.data.items) {
      try {
        let predictions;
        if (item.bitmap) {
          predictions = await classifyFromBitmap(item.bitmap);
        } else {
          predictions = await classifyFromDataUrl(item.imageDataUrl);
        }
        results.push({ id: item.id, success: true, predictions });
      } catch (error) {
        results.push({ id: item.id, success: false, error: error.message });
      }
    }
    window.parent.postMessage({
      type: 'BATCH_RESULT',
      id,
      results
    }, '*');
  }
  
  if (type === 'PRELOAD_MODEL') {
    try {
      await loadModel();
      window.parent.postMessage({
        type: 'PRELOAD_RESULT',
        id,
        success: true
      }, '*');
    } catch (error) {
      window.parent.postMessage({
        type: 'PRELOAD_RESULT',
        id,
        success: false,
        error: error.message
      }, '*');
    }
  }
});

// Сообщаем о готовности и сразу загружаем модель
window.addEventListener('load', () => {
  console.log('NSFW Filter Sandbox: Ready');
  window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
  loadModel();
});
