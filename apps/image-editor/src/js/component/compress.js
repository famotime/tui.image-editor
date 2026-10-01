import { fabric } from 'fabric';
import isUndefined from 'tui-code-snippet/type/isUndefined';
import Component from '@/interface/component';
import { componentNames } from '@/consts';
import Compresszone from '@/extension/compresszone';

const DEFAULT_QUALITY = 80;
const DEFAULT_FORMAT = 'auto';

/**
 * Format bytes to readable string (e.g., "1.2 MB", "450 KB")
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = (bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2);

  return `${val} ${units[i] || 'B'}`;
}

/**
 * Estimate byte length from Data URL
 * @param {string} dataUrl
 * @returns {number}
 */
export function getByteLengthFromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return 0;
  }
  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index === -1) {
    return 0;
  }
  const base64 = dataUrl.substring(base64Index + 8);
  let padding = 0;
  if (base64.endsWith('==')) {
    padding = 2;
  } else if (base64.endsWith('=')) {
    padding = 1;
  }

  return Math.max(0, Math.round((base64.length * 3) / 4 - padding));
}

/**
 * Compress Component
 * @extends {Component}
 */
class Compress extends Component {
  /**
   * @param {Graphics} graphics - Graphics instance
   */
  constructor(graphics) {
    super(componentNames.COMPRESS, graphics);

    this._compresszone = null;
    this._originalUrl = '';
    this._originalSize = 0;
    this._originalMimeType = '';
    this._compressedUrl = '';
    this._compressedSize = 0;
    this._quality = DEFAULT_QUALITY;
    this._format = DEFAULT_FORMAT;
    this._isStarted = false;
    this._onStatsChange = null;
  }

  /**
   * Get original file size
   * @returns {number}
   */
  getOriginalSize() {
    return this._originalSize;
  }

  /**
   * Get original mime type
   * @returns {string}
   */
  getOriginalMimeType() {
    return this._originalMimeType;
  }

  /**
   * Get compressed file size
   * @returns {number}
   */
  getCompressedSize() {
    return this._compressedSize;
  }

  /**
   * Get current quality (1 - 100)
   * @returns {number}
   */
  getQuality() {
    return this._quality;
  }

  /**
   * Get target format
   * @returns {string}
   */
  getFormat() {
    return this._format;
  }

  /**
   * Start compression comparison mode
   * @param {Object} [options]
   * @param {number} [options.quality=80]
   * @param {string} [options.format='auto']
   * @param {Function} [options.onStatsChange]
   * @returns {Promise<Object>}
   */
  // eslint-disable-next-line complexity
  start(options = {}) {
    const canvas = this.getCanvas();
    const canvasImage = this.getCanvasImage();
    if (!canvas || !canvasImage) {
      return Promise.resolve(null);
    }

    this._quality = !isUndefined(options.quality) ? options.quality : DEFAULT_QUALITY;
    this._format = options.format || DEFAULT_FORMAT;
    this._onStatsChange = options.onStatsChange || null;
    this._isStarted = true;

    // Reset zoom before starting comparison for 1:1 view
    if (this.graphics && this.graphics.resetZoom) {
      this.graphics.resetZoom();
    }

    return this._resolveOriginalInfo(canvasImage).then((info) => {
      this._originalUrl = info.url;
      this._originalSize = info.size;
      this._originalMimeType = info.mimeType;

      // Mount compresszone overlay on canvas wrapper element
      const { wrapperEl } = canvas;
      if (wrapperEl) {
        if (this._compresszone) {
          this._compresszone.destroy();
        }
        this._compresszone = new Compresszone(wrapperEl, {
          originalUrl: this._originalUrl,
          compressedUrl: this._originalUrl,
          splitPercent: 50,
        });
      }

      // Generate initial compressed image
      return this.update({ quality: this._quality, format: this._format });
    });
  }

  /**
   * Update compression settings and recalculate
   * @param {Object} [options]
   * @param {number} [options.quality]
   * @param {string} [options.format]
   * @returns {Promise<Object>}
   */
  update(options = {}) {
    if (!isUndefined(options.quality)) {
      this._quality = Math.max(1, Math.min(100, options.quality));
    }
    if (!isUndefined(options.format)) {
      this._format = options.format;
    }

    return this._generateCompressedData(this._quality, this._format).then((result) => {
      this._compressedUrl = result.dataUrl;
      this._compressedSize = result.size;

      if (this._originalSize <= 0 && this._compressedSize > 0) {
        this._originalSize = this._compressedSize;
      }

      if (this._compresszone) {
        this._compresszone.setCompressedImage(this._compressedUrl);
      }

      const reductionRate =
        this._originalSize > 0
          ? Math.round(((this._originalSize - this._compressedSize) / this._originalSize) * 100)
          : 0;

      const stats = {
        originalSize: this._originalSize,
        compressedSize: this._compressedSize,
        reductionRate,
        originalUrl: this._originalUrl,
        compressedUrl: this._compressedUrl,
        quality: this._quality,
        format: this._format,
      };

      if (this._onStatsChange) {
        this._onStatsChange(stats);
      }

      return stats;
    });
  }

  /**
   * Set split line position
   * @param {number} percent - 0 to 100
   */
  setSplitPosition(percent) {
    if (this._compresszone) {
      this._compresszone.setSplitPercent(percent);
    }
  }

  /**
   * Get split line position
   * @returns {number}
   */
  getSplitPosition() {
    return this._compresszone ? this._compresszone.getSplitPercent() : 50;
  }

  /**
   * Apply compressed image to canvas background
   * @returns {Promise<Object>}
   */
  apply() {
    const prevUrl = this._originalUrl;
    const newUrl = this._compressedUrl || prevUrl;
    const newSize = this._compressedSize || this._originalSize;
    const newMime = this._format === 'auto' ? this._originalMimeType : this._format;

    return this._replaceBackgroundImage(newUrl).then((newImage) => {
      if (newImage) {
        newImage.__originalFileSize = newSize;
        newImage.__originalMimeType = newMime;
      }
      if (this.graphics) {
        this.graphics.__originalFileSize = newSize;
        this.graphics.__originalMimeType = newMime;
      }
      this.end();

      return {
        prevUrl,
        newUrl,
        prevSize: this._originalSize,
        quality: this._quality,
        format: this._format,
        newImage,
      };
    });
  }

  /**
   * Restore previous background image (used by Undo)
   * @param {Object} undoData
   * @returns {Promise}
   */
  restore(undoData) {
    if (!undoData || !undoData.prevUrl) {
      return Promise.resolve();
    }

    return this._replaceBackgroundImage(undoData.prevUrl).then((restoredImage) => {
      if (restoredImage && undoData.prevSize) {
        restoredImage.__originalFileSize = undoData.prevSize;
      }
      if (this.graphics && undoData.prevSize) {
        this.graphics.__originalFileSize = undoData.prevSize;
      }

      return restoredImage;
    });
  }

  /**
   * End compression mode
   */
  end() {
    this._isStarted = false;
    if (this._compresszone) {
      this._compresszone.destroy();
      this._compresszone = null;
    }
  }

  /**
   * Extract source image data URL from fabric Image
   * @param {fabric.Image} canvasImage
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line complexity
  _extractCanvasImageUrl(canvasImage) {
    if (!canvasImage) {
      return '';
    }
    const el = canvasImage.getElement ? canvasImage.getElement() : null;
    if (el && el.src) {
      return el.src;
    }
    if (canvasImage.toDataURL) {
      try {
        return canvasImage.toDataURL();
      } catch (e) {
        // Fallback
      }
    }

    return '';
  }

  /**
   * Resolve original image info (url, size, mimeType)
   * @param {fabric.Image} canvasImage
   * @returns {Promise<{ url: string, size: number, mimeType: string }>}
   * @private
   */
  // eslint-disable-next-line complexity
  _resolveOriginalInfo(canvasImage) {
    // eslint-disable-next-line complexity
    return new Promise((resolve) => {
      const el = canvasImage.getElement ? canvasImage.getElement() : null;
      const rawUrl = (el && el.src) || (canvasImage.toDataURL ? canvasImage.toDataURL() : '');
      const { graphics } = this;
      const storedSize =
        canvasImage.__originalFileSize || (graphics && graphics.__originalFileSize) || 0;
      const storedMime =
        canvasImage.__originalMimeType || (graphics && graphics.__originalMimeType) || '';

      const imageName = this.getImageName() || '';
      let mimeType = storedMime || this._detectMimeType(rawUrl, imageName);

      // 1. Data URL: direct byte size extraction
      if (rawUrl && rawUrl.startsWith('data:')) {
        const dataUrlSize = getByteLengthFromDataUrl(rawUrl);
        const dataUrlMime = storedMime || this._extractMimeFromDataUrl(rawUrl) || mimeType;
        resolve({
          url: rawUrl,
          size: storedSize > 0 ? storedSize : dataUrlSize,
          mimeType: dataUrlMime,
        });

        return;
      }

      // 2. Stored size from loaded File object
      if (storedSize > 0) {
        resolve({
          url: rawUrl,
          size: storedSize,
          mimeType,
        });

        return;
      }

      // 3. Try fetching HTTP/HTTPS/relative/blob URL to get exact binary file size
      if (rawUrl && typeof fetch === 'function') {
        fetch(rawUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error('fetch error');
            }
            const headerType = response.headers && response.headers.get('content-type');
            if (headerType && !storedMime) {
              mimeType = headerType;
            }

            return response.blob();
          })
          .then((blob) => {
            if (blob && blob.size > 0) {
              resolve({
                url: rawUrl,
                size: blob.size,
                mimeType: blob.type || mimeType,
              });
            } else {
              throw new Error('empty blob');
            }
          })
          ['catch'](() => {
            const fallback = this._getCanvasFallbackInfo(canvasImage, mimeType);
            resolve({
              url: rawUrl || fallback.url,
              size: fallback.size,
              mimeType,
            });
          });

        return;
      }

      // 4. Fallback if fetch is unavailable
      const fallback = this._getCanvasFallbackInfo(canvasImage, mimeType);
      resolve({
        url: rawUrl || fallback.url,
        size: fallback.size,
        mimeType,
      });
    });
  }

  /**
   * Detect mime type from url or name
   * @param {string} url
   * @param {string} name
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line complexity
  _detectMimeType(url, name) {
    const target = `${url || ''} ${name || ''}`.toLowerCase();
    if (/\.png($|\?)/i.test(target) || target.indexOf('image/png') !== -1) {
      return 'image/png';
    }
    if (/\.webp($|\?)/i.test(target) || target.indexOf('image/webp') !== -1) {
      return 'image/webp';
    }

    return 'image/jpeg';
  }

  /**
   * Extract mime type from Data URL
   * @param {string} dataUrl
   * @returns {string}
   * @private
   */
  _extractMimeFromDataUrl(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return '';
    }
    const match = dataUrl.match(/^data:([^;,]+)/);

    return match ? match[1] : '';
  }

  /**
   * Fallback to extract canvas data and size
   * @param {fabric.Image} canvasImage
   * @param {string} mimeType
   * @returns {{ url: string, size: number }}
   * @private
   */
  // eslint-disable-next-line complexity
  _getCanvasFallbackInfo(canvasImage, mimeType) {
    if (typeof document === 'undefined') {
      return { url: '', size: 0 };
    }

    try {
      const imgEl = canvasImage.getElement ? canvasImage.getElement() : null;
      const width = Math.round(canvasImage.width || (imgEl ? imgEl.width : 300));
      const height = Math.round(canvasImage.height || (imgEl ? imgEl.height : 200));
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext ? offscreen.getContext('2d') : null;

      if (!ctx) {
        return { url: '', size: 0 };
      }

      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      if (imgEl && (imgEl instanceof HTMLElement || imgEl.nodeType)) {
        try {
          ctx.drawImage(imgEl, 0, 0, width, height);
        } catch (e) {
          // cross-origin
        }
      }
      const dataUrl =
        mimeType === 'image/jpeg'
          ? offscreen.toDataURL(mimeType, 0.92)
          : offscreen.toDataURL(mimeType || 'image/png');

      return {
        url: dataUrl,
        size: getByteLengthFromDataUrl(dataUrl),
      };
    } catch (e) {
      return { url: '', size: 0 };
    }
  }

  /**
   * Quantize colors on canvas context for PNG lossy compression
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @param {number} quality - 1 to 100
   * @private
   */
  // eslint-disable-next-line complexity
  _quantizePngCanvas(ctx, width, height, quality) {
    if (quality >= 100 || !ctx || !ctx.getImageData) {
      return;
    }

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const { data } = imgData;
      const len = data.length;
      const factor = (100 - quality) / 100;
      const step = Math.max(2, Math.round(factor * 32));
      const halfStep = Math.floor(step / 2);

      for (let i = 0; i < len; i += 4) {
        if (data[i + 3] === 0) {
          continue;
        }

        data[i] = Math.min(255, Math.floor((data[i] + halfStep) / step) * step);
        data[i + 1] = Math.min(255, Math.floor((data[i + 1] + halfStep) / step) * step);
        data[i + 2] = Math.min(255, Math.floor((data[i + 2] + halfStep) / step) * step);
        if (data[i + 3] < 255) {
          data[i + 3] = Math.min(255, Math.floor((data[i + 3] + halfStep) / step) * step);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Ignore cross-origin security errors
    }
  }

  /**
   * Generate compressed bitmap data
   * @param {number} quality - 1 to 100
   * @param {string} format - 'auto', 'image/jpeg', 'image/webp', 'image/png'
   * @returns {Promise<{ dataUrl: string, size: number }>}
   * @private
   */
  // eslint-disable-next-line complexity
  _generateCompressedData(quality, format) {
    // eslint-disable-next-line complexity
    return new Promise((resolve) => {
      const canvasImage = this.getCanvasImage();
      if (!canvasImage) {
        resolve({ dataUrl: this._originalUrl, size: this._originalSize });

        return;
      }

      const imgEl = canvasImage.getElement ? canvasImage.getElement() : null;
      const width = Math.round(canvasImage.width || (imgEl ? imgEl.width : 300));
      const height = Math.round(canvasImage.height || (imgEl ? imgEl.height : 200));

      if (typeof document === 'undefined') {
        resolve({ dataUrl: this._originalUrl, size: this._originalSize });

        return;
      }

      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext ? offscreen.getContext('2d') : null;

      if (!ctx) {
        resolve({ dataUrl: this._originalUrl, size: this._originalSize });

        return;
      }

      // Determine output mime type
      let mimeType = 'image/jpeg';
      if (format === 'image/webp') {
        mimeType = 'image/webp';
      } else if (format === 'image/png') {
        mimeType = 'image/png';
      } else if (format === 'image/jpeg') {
        mimeType = 'image/jpeg';
      } else if (this._originalMimeType) {
        mimeType = this._originalMimeType;
      } else if (this._originalUrl && this._originalUrl.startsWith('data:image/png')) {
        mimeType = 'image/png';
      } else if (this._originalUrl && this._originalUrl.startsWith('data:image/webp')) {
        mimeType = 'image/webp';
      } else {
        mimeType = 'image/jpeg';
      }

      // Smart transparency handling: Fill white background for JPEG to prevent black artifacts
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw original image into offscreen canvas
      if (imgEl && (imgEl instanceof HTMLElement || imgEl.nodeType)) {
        try {
          ctx.drawImage(imgEl, 0, 0, width, height);
        } catch (e) {
          // Cross-origin fallback
        }
      }

      // Apply color quantization for PNG lossy compression when quality < 100
      if (mimeType === 'image/png' && quality < 100) {
        this._quantizePngCanvas(ctx, width, height, quality);
      }

      const q = quality / 100;
      let dataUrl = '';
      try {
        dataUrl = offscreen.toDataURL(mimeType, q);
      } catch (e) {
        dataUrl = this._originalUrl;
      }

      let size = getByteLengthFromDataUrl(dataUrl);

      // Guard against size inflation when quality is near original (>= 95)
      if (
        mimeType === 'image/png' &&
        this._originalSize > 0 &&
        size > this._originalSize &&
        quality >= 95
      ) {
        dataUrl = this._originalUrl;
        size = this._originalSize;
      }

      resolve({ dataUrl, size });
    });
  }

  /**
   * Replace background image with new URL while maintaining coordinates
   * @param {string} url
   * @returns {Promise<fabric.Image>}
   * @private
   */
  // eslint-disable-next-line complexity
  _replaceBackgroundImage(url) {
    const canvas = this.getCanvas();
    const prevImage = this.getCanvasImage();
    const prevProps = prevImage
      ? {
          scaleX: prevImage.scaleX,
          scaleY: prevImage.scaleY,
          left: prevImage.left,
          top: prevImage.top,
          angle: prevImage.angle,
          originX: prevImage.originX,
          originY: prevImage.originY,
        }
      : {};

    // eslint-disable-next-line complexity
    return new Promise((resolve) => {
      if (!canvas || !url) {
        resolve(null);

        return;
      }

      let fabricImg;
      if (url instanceof fabric.Image) {
        fabricImg = url;
      } else if (typeof Image !== 'undefined') {
        const imgEl = new Image();
        imgEl.src = url;
        fabricImg = new fabric.Image(imgEl);
      } else {
        fabricImg = new fabric.Image(null);
      }

      if (fabricImg && fabricImg.set) {
        fabricImg.set(prevProps);
      }
      this.setCanvasImage(this.getImageName(), fabricImg);

      if (canvas.setBackgroundImage) {
        canvas.setBackgroundImage(
          fabricImg,
          () => {
            if (canvas.renderAll) {
              canvas.renderAll();
            }
            resolve(fabricImg);
          },
          { padding: 0, crossOrigin: 'Anonymous' }
        );
      } else {
        resolve(fabricImg);
      }
    });
  }
}

export default Compress;
