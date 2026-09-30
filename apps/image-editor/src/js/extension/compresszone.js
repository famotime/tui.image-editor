const DEFAULT_SPLIT_PERCENT = 50;

/**
 * Compresszone comparison overlay component
 * Provides a split-screen slider for comparing before/after images
 */
class Compresszone {
  /**
   * @param {HTMLElement} wrapperEl - Canvas wrapper element
   * @param {Object} options - Options
   */
  constructor(wrapperEl, options = {}) {
    this._wrapperEl = wrapperEl;
    this._splitPercent = options.splitPercent || DEFAULT_SPLIT_PERCENT;
    this._originalUrl = options.originalUrl || '';
    this._compressedUrl = options.compressedUrl || '';
    this._locale = options.locale || null;
    this._onSplitChange = options.onSplitChange || null;

    this._container = null;
    this._beforeLayer = null;
    this._afterLayer = null;
    this._beforeImg = null;
    this._afterImg = null;
    this._divider = null;
    this._handle = null;
    this._isDragging = false;

    this._boundOnPointerDown = this._onPointerDown.bind(this);
    this._boundOnPointerMove = this._onPointerMove.bind(this);
    this._boundOnPointerUp = this._onPointerUp.bind(this);

    this._initDom();
  }

  /**
   * Initialize DOM elements
   * @private
   */
  // eslint-disable-next-line complexity
  _initDom() {
    if (!this._wrapperEl) {
      return;
    }

    const originalText = (this._locale && this._locale.localize('Original')) || '原图';
    const compressedText = (this._locale && this._locale.localize('Compressed')) || '压缩后';

    const container = document.createElement('div');
    container.className = 'tui-image-editor-compresszone';
    container.style.cssText = [
      'position: absolute',
      'left: 0',
      'top: 0',
      'width: 100%',
      'height: 100%',
      'overflow: hidden',
      'user-select: none',
      '-webkit-user-select: none',
      'z-index: 10',
      'cursor: ew-resize',
    ].join(';');

    // After (Compressed) Layer - Base layer on the right
    const afterLayer = document.createElement('div');
    afterLayer.className = 'tie-compress-layer tie-compress-after';
    afterLayer.style.cssText =
      'position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;';

    const afterImg = document.createElement('img');
    afterImg.className = 'tie-compress-img tie-compress-after-img';
    afterImg.style.cssText =
      'width: 100%; height: 100%; object-fit: contain; pointer-events: none; display: block;';
    if (this._compressedUrl) {
      afterImg.src = this._compressedUrl;
    }
    afterLayer.appendChild(afterImg);

    const afterBadge = document.createElement('span');
    afterBadge.className = 'tie-compress-badge tie-compress-badge-after';
    afterBadge.innerText = compressedText;
    afterBadge.style.cssText = [
      'position: absolute',
      'top: 14px',
      'right: 14px',
      'background: rgba(0, 0, 0, 0.65)',
      'color: #ffffff',
      'padding: 3px 10px',
      'border-radius: 4px',
      'font-size: 12px',
      'letter-spacing: 0.5px',
      'pointer-events: none',
      'box-shadow: 0 2px 6px rgba(0,0,0,0.3)',
      'backdrop-filter: blur(2px)',
    ].join(';');
    afterLayer.appendChild(afterBadge);

    // Before (Original) Layer - Clipped layer on the left
    const beforeLayer = document.createElement('div');
    beforeLayer.className = 'tie-compress-layer tie-compress-before';
    beforeLayer.style.cssText = [
      'position: absolute',
      'left: 0',
      'top: 0',
      'width: 100%',
      'height: 100%',
      'pointer-events: none',
      `clip-path: inset(0 ${100 - this._splitPercent}% 0 0)`,
      `-webkit-clip-path: inset(0 ${100 - this._splitPercent}% 0 0)`,
    ].join(';');

    const beforeImg = document.createElement('img');
    beforeImg.className = 'tie-compress-img tie-compress-before-img';
    beforeImg.style.cssText =
      'width: 100%; height: 100%; object-fit: contain; pointer-events: none; display: block;';
    if (this._originalUrl) {
      beforeImg.src = this._originalUrl;
    }
    beforeLayer.appendChild(beforeImg);

    const beforeBadge = document.createElement('span');
    beforeBadge.className = 'tie-compress-badge tie-compress-badge-before';
    beforeBadge.innerText = originalText;
    beforeBadge.style.cssText = [
      'position: absolute',
      'top: 14px',
      'left: 14px',
      'background: rgba(0, 0, 0, 0.65)',
      'color: #ffffff',
      'padding: 3px 10px',
      'border-radius: 4px',
      'font-size: 12px',
      'letter-spacing: 0.5px',
      'pointer-events: none',
      'box-shadow: 0 2px 6px rgba(0,0,0,0.3)',
      'backdrop-filter: blur(2px)',
    ].join(';');
    beforeLayer.appendChild(beforeBadge);

    // Divider Line & Center Handle
    const divider = document.createElement('div');
    divider.className = 'tie-compress-divider';
    divider.style.cssText = [
      'position: absolute',
      'top: 0',
      'bottom: 0',
      `left: ${this._splitPercent}%`,
      'width: 2px',
      'background-color: #ffffff',
      'box-shadow: 0 0 6px rgba(0, 0, 0, 0.5)',
      'transform: translateX(-50%)',
      'cursor: ew-resize',
      'pointer-events: auto',
      'z-index: 30',
    ].join(';');

    const handle = document.createElement('div');
    handle.className = 'tie-compress-handle';
    handle.style.cssText = [
      'position: absolute',
      'top: 50%',
      'left: 50%',
      'width: 34px',
      'height: 34px',
      'background-color: #ffffff',
      'border-radius: 50%',
      'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45)',
      'transform: translate(-50%, -50%)',
      'cursor: ew-resize',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'color: #333333',
    ].join(';');

    handle.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" style="pointer-events: none;">
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    divider.appendChild(handle);

    container.appendChild(afterLayer);
    container.appendChild(beforeLayer);
    container.appendChild(divider);

    container.addEventListener('mousedown', this._boundOnPointerDown);
    container.addEventListener('touchstart', this._boundOnPointerDown, { passive: false });

    this._container = container;
    this._beforeLayer = beforeLayer;
    this._afterLayer = afterLayer;
    this._beforeImg = beforeImg;
    this._afterImg = afterImg;
    this._divider = divider;
    this._handle = handle;

    this._wrapperEl.appendChild(container);
  }

  /**
   * Pointer down handler
   * @param {MouseEvent|TouchEvent} e
   * @private
   */
  _onPointerDown(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
    this._isDragging = true;
    this._updatePositionFromEvent(e);

    document.addEventListener('mousemove', this._boundOnPointerMove);
    document.addEventListener('touchmove', this._boundOnPointerMove, { passive: false });
    document.addEventListener('mouseup', this._boundOnPointerUp);
    document.addEventListener('touchend', this._boundOnPointerUp);
  }

  /**
   * Pointer move handler
   * @param {MouseEvent|TouchEvent} e
   * @private
   */
  _onPointerMove(e) {
    if (!this._isDragging) {
      return;
    }
    if (e.cancelable) {
      e.preventDefault();
    }
    this._updatePositionFromEvent(e);
  }

  /**
   * Pointer up handler
   * @private
   */
  _onPointerUp() {
    this._isDragging = false;
    document.removeEventListener('mousemove', this._boundOnPointerMove);
    document.removeEventListener('touchmove', this._boundOnPointerMove);
    document.removeEventListener('mouseup', this._boundOnPointerUp);
    document.removeEventListener('touchend', this._boundOnPointerUp);
  }

  /**
   * Calculate and update split percent from event coordinate
   * @param {MouseEvent|TouchEvent} e
   * @private
   */
  _updatePositionFromEvent(e) {
    if (!this._container) {
      return;
    }
    const rect = this._container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    let percent = (offsetX / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    this.setSplitPercent(percent);

    if (this._onSplitChange) {
      this._onSplitChange(percent);
    }
  }

  /**
   * Set split percent
   * @param {number} percent - Position in percentage (0 - 100)
   */
  setSplitPercent(percent) {
    this._splitPercent = Math.max(0, Math.min(100, percent));
    if (this._divider) {
      this._divider.style.left = `${this._splitPercent}%`;
    }
    if (this._beforeLayer) {
      const insetVal = `inset(0 ${100 - this._splitPercent}% 0 0)`;
      this._beforeLayer.style.clipPath = insetVal;
      this._beforeLayer.style.webkitClipPath = insetVal;
    }
  }

  /**
   * Get split percent
   * @returns {number}
   */
  getSplitPercent() {
    return this._splitPercent;
  }

  /**
   * Set original image URL
   * @param {string} url
   */
  setOriginalImage(url) {
    this._originalUrl = url;
    if (this._beforeImg) {
      this._beforeImg.src = url;
    }
  }

  /**
   * Set compressed image URL
   * @param {string} url
   */
  setCompressedImage(url) {
    this._compressedUrl = url;
    if (this._afterImg) {
      this._afterImg.src = url;
    }
  }

  /**
   * Destroy and clean up DOM and listeners
   */
  destroy() {
    this._isDragging = false;
    document.removeEventListener('mousemove', this._boundOnPointerMove);
    document.removeEventListener('touchmove', this._boundOnPointerMove);
    document.removeEventListener('mouseup', this._boundOnPointerUp);
    document.removeEventListener('touchend', this._boundOnPointerUp);

    if (this._container) {
      this._container.removeEventListener('mousedown', this._boundOnPointerDown);
      this._container.removeEventListener('touchstart', this._boundOnPointerDown);
      if (this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      this._container = null;
    }
    this._beforeLayer = null;
    this._afterLayer = null;
    this._beforeImg = null;
    this._afterImg = null;
    this._divider = null;
    this._handle = null;
  }
}

export default Compresszone;
