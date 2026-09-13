import Component from '@/interface/component';
import { componentNames } from '@/consts';
import Resizezone from '@/extension/resizezone';

/**
 * Resize components
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @class Resize
 * @ignore
 */
class Resize extends Component {
  constructor(graphics) {
    super(componentNames.RESIZE, graphics);

    /**
     * Current dimensions
     * @type {Object}
     * @private
     */
    this._dimensions = null;

    /**
     * Original dimensions
     * @type {Object}
     * @private
     */
    this._originalDimensions = null;

    /**
     * Resizezone object
     * @type {Resizezone}
     * @private
     */
    this._resizezone = null;
  }

  /**
   * Get current dimensions
   * @returns {object}
   */
  getCurrentDimensions() {
    const canvasImage = this.getCanvasImage();
    if (canvasImage) {
      const { width, height, scaleX = 1, scaleY = 1 } = canvasImage;
      this._dimensions = {
        width: Math.round(width * scaleX),
        height: Math.round(height * scaleY),
      };
    }

    return this._dimensions;
  }

  /**
   * Get original dimensions
   * @returns {object}
   */
  getOriginalDimensions() {
    return this._originalDimensions;
  }

  /**
   * Set original dimensions
   * @param {object} dimensions - Dimensions
   */
  setOriginalDimensions(dimensions) {
    this._originalDimensions = dimensions;
  }

  /**
   * Resize Image
   * @param {Object} dimensions - Resize dimensions
   * @param {boolean} [adjustCanvas=true] - Whether to adjust canvas dimensions
   * @returns {Promise}
   */
  resize(dimensions, adjustCanvas = true) {
    const canvasImage = this.getCanvasImage();
    if (!canvasImage) {
      return Promise.resolve();
    }

    const { width, height, scaleX, scaleY } = canvasImage;
    const { width: dimensionsWidth, height: dimensionsHeight } = dimensions;

    const scaleValues = {
      scaleX: dimensionsWidth ? dimensionsWidth / width : scaleX,
      scaleY: dimensionsHeight ? dimensionsHeight / height : scaleY,
    };

    if (scaleX !== scaleValues.scaleX || scaleY !== scaleValues.scaleY) {
      canvasImage.set(scaleValues).setCoords();

      this._dimensions = {
        width: Math.round(canvasImage.width * canvasImage.scaleX),
        height: Math.round(canvasImage.height * canvasImage.scaleY),
      };
    }

    if (adjustCanvas) {
      this.adjustCanvasDimensionBase();
    } else {
      const canvas = this.getCanvas();
      if (canvas) {
        canvas.renderAll();
      }
    }

    return Promise.resolve();
  }

  /**
   * Start resizing
   */
  // eslint-disable-next-line complexity
  start() {
    // 进入调整尺寸模式前重置缩放，保证图像完整显示且控制边框贴合边缘
    if (this.graphics && this.graphics.resetZoom) {
      this.graphics.resetZoom();
    }

    const canvas = this.getCanvas();
    if (!canvas) {
      return;
    }

    if (canvas.setViewportTransform) {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    }

    const dimensions = this.getCurrentDimensions();
    if (dimensions) {
      this.setOriginalDimensions(dimensions);
    }

    if (!dimensions) {
      return;
    }

    const lowerEl = canvas.lowerCanvasEl;
    const initialCssWidth =
      lowerEl && lowerEl.getBoundingClientRect
        ? lowerEl.getBoundingClientRect().width
        : dimensions.width;
    this._displayScale =
      dimensions.width && initialCssWidth ? initialCssWidth / dimensions.width : 1;

    if (!this._resizezone) {
      canvas.forEachObject((obj) => {
        obj.evented = false;
      });

      const canvasImage = this.getCanvasImage();
      if (canvasImage) {
        canvasImage
          .set({
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
          })
          .setCoords();
      }

      this._resizezone = new Resizezone(canvas, {
        width: dimensions.width,
        height: dimensions.height,
        left: 0,
        top: 0,
        onResizing: (dim) => this._onZoneResizing(dim),
        onModified: (dim) => this._onZoneModified(dim),
      });

      canvas.discardActiveObject();
      canvas.add(this._resizezone);
      canvas.setActiveObject(this._resizezone);
      canvas.selection = false;
      canvas.renderAll();
    }
  }

  /**
   * End resizing
   */
  end() {
    const canvas = this.getCanvas();
    if (!canvas) {
      return;
    }

    if (this._resizezone) {
      canvas.remove(this._resizezone);
      this._resizezone = null;
      canvas.selection = true;

      canvas.forEachObject((obj) => {
        obj.evented = true;
      });
      canvas.renderAll();
    }
  }

  /**
   * Zone resizing listener
   * @param {{width: number, height: number}} dim - Dimensions
   * @private
   */
  _onZoneResizing({ width, height }) {
    const canvasImage = this.getCanvasImage();
    const canvas = this.getCanvas();

    if (canvasImage) {
      canvasImage
        .set({
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0,
          scaleX: width / canvasImage.width,
          scaleY: height / canvasImage.height,
        })
        .setCoords();

      this._dimensions = { width, height };
    }

    if (canvas) {
      canvas.setDimensions(
        {
          width: Math.max(canvas.width, width),
          height: Math.max(canvas.height, height),
        },
        { backstoreOnly: true }
      );
      canvas.renderAll();
    }

    this.graphics.fire('resizing', { width, height });
  }

  /**
   * Apply updated dimensions to canvas, image, resizezone and sync CSS display dimension
   * @param {number} width - Target width
   * @param {number} height - Target height
   * @private
   */
  _applyDimensions(width, height) {
    const canvasImage = this.getCanvasImage();
    const canvas = this.getCanvas();

    if (canvasImage) {
      canvasImage
        .set({
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0,
          scaleX: width / canvasImage.width,
          scaleY: height / canvasImage.height,
        })
        .setCoords();

      this._dimensions = { width, height };
    }

    if (canvas) {
      canvas.setDimensions({ width, height }, { backstoreOnly: true });

      const displayScale = this._displayScale || 1;
      const cssWidth = Math.round(width * displayScale);
      const cssHeight = Math.round(height * displayScale);

      this.graphics.setCanvasCssDimension({
        width: `${cssWidth}px`,
        height: `${cssHeight}px`,
        'max-width': `${cssWidth}px`,
        'max-height': `${cssHeight}px`,
      });

      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.width = `${cssWidth}px`;
        canvas.wrapperEl.style.height = `${cssHeight}px`;
        canvas.wrapperEl.style.maxWidth = `${cssWidth}px`;
        canvas.wrapperEl.style.maxHeight = `${cssHeight}px`;
      }
      if (canvas.lowerCanvasEl) {
        canvas.lowerCanvasEl.style.width = `${cssWidth}px`;
        canvas.lowerCanvasEl.style.height = `${cssHeight}px`;
        canvas.lowerCanvasEl.style.maxWidth = `${cssWidth}px`;
        canvas.lowerCanvasEl.style.maxHeight = `${cssHeight}px`;
      }
      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.width = `${cssWidth}px`;
        canvas.upperCanvasEl.style.height = `${cssHeight}px`;
        canvas.upperCanvasEl.style.maxWidth = `${cssWidth}px`;
        canvas.upperCanvasEl.style.maxHeight = `${cssHeight}px`;
      }

      if (canvas.wrapperEl && canvas.wrapperEl.closest) {
        const editorArea = canvas.wrapperEl.closest('.tui-image-editor');
        if (editorArea) {
          editorArea.style.width = `${cssWidth}px`;
          editorArea.style.height = `${cssHeight}px`;
        }
      }

      canvas.calcOffset();
      canvas.renderAll();
    }

    if (this._resizezone) {
      this._resizezone.updateDimensions({ width, height, left: 0, top: 0 });
    }

    this.graphics.fire('resizing', { width, height });
  }

  /**
   * Zone modified listener
   * @param {{width: number, height: number}} dim - Dimensions
   * @private
   */
  _onZoneModified({ width, height }) {
    this._applyDimensions(width, height);
  }

  /**
   * Sync dimensions with external UI inputs
   * @param {{width: number, height: number}} dimensions - Dimensions
   */
  syncDimensions(dimensions) {
    const { width, height } = dimensions;
    this._applyDimensions(width, height);
  }

  /**
   * Set lock aspect ratio
   * @param {boolean} lockState - Lock state
   */
  setLockAspectRatio(lockState) {
    if (this._resizezone) {
      this._resizezone.setLockAspectRatio(lockState);
    }
  }
}

export default Resize;
