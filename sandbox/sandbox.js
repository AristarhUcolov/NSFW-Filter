// Sandbox для классификации изображений
// Работает в изолированном контексте с разрешённым unsafe-eval

let model = null;
let isModelLoading = false;
let modelLoadPromise = null;

// Загрузка модели
async function loadModel() {
  if (model) return model;
  
  if (modelLoadPromise) {
    return modelLoadPromise;
  }
  
  modelLoadPromise = (async () => {
    try {
      // В sandbox нет доступа к chrome.runtime, используем относительный путь
      // Модель будет передана через postMessage
      console.log('NSFW Filter Sandbox: Loading model...');
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

// Классификация изображения по data URL
async function classifyImage(imageDataUrl) {
  const loadedModel = await loadModel();
  if (!loadedModel) {
    throw new Error('Model not available');
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        const predictions = await loadedModel.classify(img);
        resolve(predictions);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

// Обработка сообщений через postMessage (sandbox не имеет доступа к chrome.runtime)
window.addEventListener('message', async (event) => {
  const { type, id, imageDataUrl } = event.data;
  
  if (type === 'CLASSIFY_IMAGE') {
    try {
      const predictions = await classifyImage(imageDataUrl);
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

// Сообщаем о готовности
window.addEventListener('load', () => {
  console.log('NSFW Filter Sandbox: Ready');
  window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
  // Предзагружаем модель
  loadModel();
});
