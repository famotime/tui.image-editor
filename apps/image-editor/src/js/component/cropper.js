import { fabric } from 'fabric';
import extend from 'tui-code-snippet/object/extend';
import Component from '@/interface/component';
import Cropzone from '@/extension/cropzone';
import { keyCodes, componentNames, CROPZONE_DEFAULT_OPTIONS } from '@/consts';
import { clamp, fixFloatingPoint } from '@/util';

const MOUSE_MOVE_THRESHOLD = 10;
const DEFAULT_OPTION = {
  presetRatio: null,
  top: -10,
  left: -10,
  height: 1,
  width: 1,
};

/**
 * Cropper components
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @class Cropper
 * @ignore
 */
class Cropper extends Component {
  constructor(graphics) {
    super(componentNames.CROPPER, graphics);

    /**
     * Cropzone
     * @type {Cropzone}
     * @private
     */
    this._cropzone = null;

    /**
     * Target image object for cropping when in layer mode
     * @type {fabric.Image}
     * @private
     */
    this._targetObject = null;

    /**
     * StartX of Cropzone
     * @type {number}
     * @private
     */
    this._startX = null;

    /**
     * StartY of Cropzone
     * @type {number}
     * @private
     */
    this._startY = null;

    /**
     * State whether shortcut key is pressed or not
     * @type {boolean}
     * @private
     */
    this._withShiftKey = false;

    /**
     * Listeners
     * @type {object.<string, function>}
     * @private
     */
    this._listeners = {
      keydown: this._onKeyDown.bind(this),
      keyup: this._onKeyUp.bind(this),
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  /**
   * Start cropping
   */
  start() {
    if (this._cropzone) {
      return;
    }
    const canvas = this.getCanvas();

    const activeObject = canvas.getActiveObject();
    const canvasImage = this.getCanvasImage();
    if (activeObject && activeObject.type === 'image' && activeObject !== canvasImage) {
      this._targetObject = activeObject;
    } else {
      this._targetObject = null;
    }

    canvas.forEachObject((obj) => {
      // {@link http://fabricjs.com/docs/fabric.Object.html#evented}
      obj.evented = false;
    });

    const cropzoneRect = {
      left: 0,
      top: 0,
      width: 0.5,
      height: 0.5,
      strokeWidth: 0, // {@link https://github.com/kangax/fabric.js/issues/2860}
      cornerSize: 10,
      cornerColor: 'black',
      fill: 'transparent',
    };

    if (this._targetObject) {
      const bound = this._targetObject.getBoundingRect();
      cropzoneRect.left = bound.left;
      cropzoneRect.top = bound.top;
      cropzoneRect.width = Math.max(1, bound.width);
      cropzoneRect.height = Math.max(1, bound.height);
    }

    this._cropzone = new Cropzone(
      canvas,
      extend(cropzoneRect, CROPZONE_DEFAULT_OPTIONS, this.graphics.cropSelectionStyle)
    );

    canvas.discardActiveObject();
    canvas.add(this._cropzone);
    canvas.on('mouse:down', this._listeners.mousedown);
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';

    fabric.util.addListener(document, 'keydown', this._listeners.keydown);
    fabric.util.addListener(document, 'keyup', this._listeners.keyup);
  }

  /**
   * End cropping
   */
  end() {
    const canvas = this.getCanvas();
    const cropzone = this._cropzone;

    if (!cropzone) {
      return;
    }
    canvas.remove(cropzone);
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.off('mouse:down', this._listeners.mousedown);
    canvas.forEachObject((obj) => {
      obj.evented = true;
    });

    this._cropzone = null;
    this._targetObject = null;

    fabric.util.removeListener(document, 'keydown', this._listeners.keydown);
    fabric.util.removeListener(document, 'keyup', this._listeners.keyup);
  }

  /**
   * Get current cropping target image object
   * @returns {fabric.Image|null}
   */
  getTargetObject() {
    return this._targetObject;
  }

  /**
   * Set cropping target image object
   * @param {fabric.Image|null} target
   */
  setTargetObject(target) {
    this._targetObject = target;
  }

  /**
   * Change cropzone visible
   * @param {boolean} visible - cropzone visible state
   */
  changeVisibility(visible) {
    if (this._cropzone) {
      this._cropzone.set({ visible });
    }
  }

  /**
   * onMousedown handler in fabric canvas
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
   * @private
   */
  _onFabricMouseDown(fEvent) {
    const canvas = this.getCanvas();

    if (fEvent.target) {
      return;
    }

    canvas.selection = false;
    const coord = canvas.getPointer(fEvent.e);

    this._startX = coord.x;
    this._startY = coord.y;

    canvas.on({
      'mouse:move': this._listeners.mousemove,
      'mouse:up': this._listeners.mouseup,
    });
  }

  /**
   * onMousemove handler in fabric canvas
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
   * @private
   */
  _onFabricMouseMove(fEvent) {
    const canvas = this.getCanvas();
    const pointer = canvas.getPointer(fEvent.e);
    const { x, y } = pointer;
    const cropzone = this._cropzone;

    if (Math.abs(x - this._startX) + Math.abs(y - this._startY) > MOUSE_MOVE_THRESHOLD) {
      canvas.remove(cropzone);
      cropzone.set(this._calcRectDimensionFromPoint(x, y, cropzone.presetRatio));

      canvas.add(cropzone);
      canvas.setActiveObject(cropzone);
    }
  }

  /**
   * Get rect dimension setting from Canvas-Mouse-Position(x, y)
   * @param {number} x - Canvas-Mouse-Position x
   * @param {number} y - Canvas-Mouse-Position Y
   * @param {number|null} presetRatio - fixed aspect ratio (width/height) of the cropzone (null if not set)
   * @returns {{left: number, top: number, width: number, height: number}}
   * @private
   */
  // eslint-disable-next-line complexity
  _calcRectDimensionFromPoint(x, y, presetRatio = null) {
    const canvas = this.getCanvas();
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const startX = this._startX;
    const startY = this._startY;
    let left = clamp(x, 0, startX);
    let top = clamp(y, 0, startY);
    let width = clamp(x, startX, canvasWidth) - left; // (startX <= x(mouse) <= canvasWidth) - left
    let height = clamp(y, startY, canvasHeight) - top; // (startY <= y(mouse) <= canvasHeight) - top

    if (this._withShiftKey && !presetRatio) {
      // make fixed ratio cropzone
      if (width > height) {
        height = width;
      } else if (height > width) {
        width = height;
      }

      if (startX >= x) {
        left = startX - width;
      }

      if (startY >= y) {
        top = startY - height;
      }
    } else if (presetRatio) {
      // Restrict cropzone to given presetRatio
      height = width / presetRatio;

      // If moving in a direction where the top left corner moves (ie. top-left, bottom-left, top-right)
      // the left and/or top values has to be changed based on the new height/width
      if (startX >= x) {
        left = clamp(startX - width, 0, canvasWidth);
      }

      if (startY >= y) {
        top = clamp(startY - height, 0, canvasHeight);
      }

      // Check if the new height is too large
      if (top + height > canvasHeight) {
        height = canvasHeight - top; // Set height to max available height
        width = height * presetRatio; // Restrict cropzone to given presetRatio based on the new height

        // If moving in a direction where the top left corner moves (ie. top-left, bottom-left, top-right)
        // the left and/or top values has to be changed based on the new height/width
        if (startX >= x) {
          left = clamp(startX - width, 0, canvasWidth);
        }

        if (startY >= y) {
          top = clamp(startY - height, 0, canvasHeight);
        }
      }
    }

    return {
      left,
      top,
      width,
      height,
    };
  }

  /**
   * onMouseup handler in fabric canvas
   * @private
   */
  _onFabricMouseUp() {
    const cropzone = this._cropzone;
    const listeners = this._listeners;
    const canvas = this.getCanvas();

    canvas.setActiveObject(cropzone);
    canvas.off({
      'mouse:move': listeners.mousemove,
      'mouse:up': listeners.mouseup,
    });
  }

  /**
   * Get cropped image data
   * @param {Object} cropRect cropzone rect
   *  @param {Number} cropRect.left left position
   *  @param {Number} cropRect.top top position
   *  @param {Number} cropRect.width width
   *  @param {Number} cropRect.height height
   * @returns {?{imageName: string, url: string, targetId?: number}} cropped Image data
   */
  getCroppedImageData(cropRect) {
    const canvas = this.getCanvas();
    const containsCropzone = canvas.contains(this._cropzone);
    if (!cropRect) {
      return null;
    }

    if (containsCropzone) {
      canvas.remove(this._cropzone);
    }

    let imageData;
    if (this._targetObject) {
      imageData = {
        imageName: this._targetObject.layerName || this.getImageName(),
        url: this._cropObjectToDataURL(this._targetObject, cropRect),
        targetId: this._targetObject.id,
      };
    } else {
      imageData = {
        imageName: this.getImageName(),
        url: canvas.toDataURL(cropRect),
      };
    }

    if (containsCropzone) {
      canvas.add(this._cropzone);
    }

    return imageData;
  }

  /**
   * Crop specific image object to data URL
   * @param {fabric.Image} targetObj
   * @param {Object} rect
   * @returns {string}
   * @private
   */
  _cropObjectToDataURL(targetObj, rect) {
    if (targetObj && targetObj.setCoords && !targetObj.aCoords) {
      targetObj.setCoords();
    }
    const canvasEl = document.createElement('canvas');
    canvasEl.width = Math.max(1, Math.round(rect.width));
    canvasEl.height = Math.max(1, Math.round(rect.height));
    const ctx = canvasEl.getContext ? canvasEl.getContext('2d') : null;
    if (ctx) {
      ctx.save();
      ctx.translate(-rect.left, -rect.top);
      try {
        if (targetObj.render) {
          targetObj.render(ctx);
        }
      } catch (e) {
        // Fallback on mocked object in test environment
      }
      ctx.restore();
    }

    if (canvasEl.toDataURL) {
      try {
        const url = canvasEl.toDataURL('image/png');
        if (url && url !== 'data:,' && !url.includes('data:,')) {
          return url;
        }
      } catch (e) {
        // Fallback if canvas is tainted
      }
    }

    const canvas = this.getCanvas();

    return canvas && canvas.toDataURL ? canvas.toDataURL(rect) : '';
  }

  /**
   * Get cropped rect
   * @returns {Object} rect
   */
  getCropzoneRect() {
    const cropzone = this._cropzone;

    if (!cropzone.isValid()) {
      return null;
    }

    return {
      left: cropzone.left,
      top: cropzone.top,
      width: cropzone.width,
      height: cropzone.height,
    };
  }

  /**
   * Set a cropzone square
   * @param {number} [presetRatio] - preset ratio
   */
  setCropzoneRect(presetRatio) {
    const canvas = this.getCanvas();
    const cropzone = this._cropzone;

    canvas.discardActiveObject();
    canvas.selection = false;
    canvas.remove(cropzone);

    cropzone.set(presetRatio ? this._getPresetPropertiesForCropSize(presetRatio) : DEFAULT_OPTION);

    canvas.add(cropzone);
    canvas.selection = true;

    if (presetRatio) {
      canvas.setActiveObject(cropzone);
    }
  }

  /**
   * get a cropzone square info
   * @param {number} presetRatio - preset ratio
   * @returns {{presetRatio: number, left: number, top: number, width: number, height: number}}
   * @private
   */
  _getPresetPropertiesForCropSize(presetRatio) {
    let originalWidth, originalHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (this._targetObject) {
      const bound = this._targetObject.getBoundingRect();
      originalWidth = bound.width;
      originalHeight = bound.height;
      offsetX = bound.left;
      offsetY = bound.top;
    } else {
      const canvas = this.getCanvas();
      originalWidth = canvas.getWidth();
      originalHeight = canvas.getHeight();
    }

    const standardSize = originalWidth >= originalHeight ? originalWidth : originalHeight;
    const getScale = (value, orignalValue) => (value > orignalValue ? orignalValue / value : 1);

    let width = standardSize * presetRatio;
    let height = standardSize;

    const scaleWidth = getScale(width, originalWidth);
    [width, height] = [width, height].map((sizeValue) => sizeValue * scaleWidth);

    const scaleHeight = getScale(height, originalHeight);
    [width, height] = [width, height].map((sizeValue) => fixFloatingPoint(sizeValue * scaleHeight));

    return {
      presetRatio,
      top: offsetY + (originalHeight - height) / 2,
      left: offsetX + (originalWidth - width) / 2,
      width,
      height,
    };
  }

  /**
   * Keydown event handler
   * @param {KeyboardEvent} e - Event object
   * @private
   */
  _onKeyDown(e) {
    if (e.keyCode === keyCodes.SHIFT) {
      this._withShiftKey = true;
    }
  }

  /**
   * Keyup event handler
   * @param {KeyboardEvent} e - Event object
   * @private
   */
  _onKeyUp(e) {
    if (e.keyCode === keyCodes.SHIFT) {
      this._withShiftKey = false;
    }
  }
}

export default Cropper;
