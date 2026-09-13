import { fabric } from 'fabric';
import extend from 'tui-code-snippet/object/extend';

const DEFAULT_OPTIONS = {
  fill: 'transparent',
  stroke: 'rgba(255, 255, 255, 0.85)',
  strokeWidth: 1.5,
  strokeDashArray: [4, 4],
  cornerColor: '#ffffff',
  cornerStrokeColor: '#2563eb',
  cornerSize: 10,
  cornerStyle: 'circle',
  transparentCorners: false,
  hasRotatingPoint: false,
  lockRotation: true,
  hasBorders: true,
  hasControls: true,
  lockUniScaling: false,
  originX: 'left',
  originY: 'top',
  lockMovementX: true,
  lockMovementY: true,
  left: 0,
  top: 0,
};

/**
 * Resizezone fabric object
 * @class Resizezone
 * @extends {fabric.Rect}
 * @ignore
 */
const Resizezone = fabric.util.createClass(
  fabric.Rect,
  /** @lends Resizezone.prototype */ {
    /**
     * Constructor
     * @param {fabric.Canvas} canvas - Fabric canvas
     * @param {Object} options - Options object
     */
    initialize(canvas, options = {}) {
      options = extend({}, DEFAULT_OPTIONS, options);
      options.type = 'resizezone';

      this.callSuper('initialize', options);
      this.canvas = canvas;
      this._onResizingCallback = options.onResizing || null;
      this._onModifiedCallback = options.onModified || null;
      this._aspectRatio = options.width && options.height ? options.width / options.height : 1;

      this.on({
        scaling: this._onScaling.bind(this),
        modified: this._onModified.bind(this),
      });
    },

    /**
     * Set resizing callback
     * @param {Function} callback - Callback function
     */
    setResizingCallback(callback) {
      this._onResizingCallback = callback;
    },

    /**
     * Set modified callback
     * @param {Function} callback - Callback function
     */
    setModifiedCallback(callback) {
      this._onModifiedCallback = callback;
    },

    /**
     * Set lock aspect ratio
     * @param {boolean} lock - Lock state
     */
    setLockAspectRatio(lock) {
      this.lockUniScaling = lock;
      if (this.width && this.height) {
        this._aspectRatio = this.width / this.height;
      }
    },

    /**
     * Update dimensions and reset scale
     * @param {{width: number, height: number, left?: number, top?: number}} dimensions - Dimensions
     */
    updateDimensions({ width, height, left = 0, top = 0 }) {
      this.set({
        width,
        height,
        left,
        top,
        scaleX: 1,
        scaleY: 1,
      });

      if (width && height) {
        this._aspectRatio = width / height;
      }

      this.setCoords();
    },

    /**
     * Scaling event listener
     * @param {Object} [fEvent] - Fabric event object
     * @private
     */
    _onScaling(fEvent) {
      const selectedCorner = fEvent && fEvent.transform ? fEvent.transform.corner : null;
      let targetWidth = Math.max(Math.round(this.width * this.scaleX), 1);
      let targetHeight = Math.max(Math.round(this.height * this.scaleY), 1);

      if (this.lockUniScaling && this._aspectRatio) {
        if (selectedCorner === 'mt' || selectedCorner === 'mb') {
          targetWidth = Math.max(Math.round(targetHeight * this._aspectRatio), 1);
        } else {
          targetHeight = Math.max(Math.round(targetWidth / this._aspectRatio), 1);
        }
      }

      this.set({
        left: 0,
        top: 0,
        scaleX: targetWidth / this.width,
        scaleY: targetHeight / this.height,
      });
      this.setCoords();

      if (this._onResizingCallback) {
        this._onResizingCallback({
          width: targetWidth,
          height: targetHeight,
        });
      }
    },

    /**
     * Modified event listener
     * @private
     */
    _onModified() {
      const targetWidth = Math.max(Math.round(this.width * this.scaleX), 1);
      const targetHeight = Math.max(Math.round(this.height * this.scaleY), 1);

      this.updateDimensions({
        width: targetWidth,
        height: targetHeight,
        left: 0,
        top: 0,
      });

      if (this._onModifiedCallback) {
        this._onModifiedCallback({
          width: targetWidth,
          height: targetHeight,
        });
      }
    },

    /**
     * Custom render for 3x3 rule-of-thirds grid
     * @param {CanvasRenderingContext2D} ctx - Context
     * @override
     */
    _render(ctx) {
      this.callSuper('_render', ctx);

      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      const thirdWidth = this.width / 3;
      const thirdHeight = this.height / 3;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      if (ctx.setLineDash) {
        ctx.setLineDash([3, 3]);
      }

      ctx.beginPath();
      // 2 vertical lines
      ctx.moveTo(-halfWidth + thirdWidth, -halfHeight);
      ctx.lineTo(-halfWidth + thirdWidth, halfHeight);
      ctx.moveTo(-halfWidth + thirdWidth * 2, -halfHeight);
      ctx.lineTo(-halfWidth + thirdWidth * 2, halfHeight);

      // 2 horizontal lines
      ctx.moveTo(-halfWidth, -halfHeight + thirdHeight);
      ctx.lineTo(halfWidth, -halfHeight + thirdHeight);
      ctx.moveTo(-halfWidth, -halfHeight + thirdHeight * 2);
      ctx.lineTo(halfWidth, -halfHeight + thirdHeight * 2);

      ctx.stroke();
      ctx.restore();
    },
  }
);

export default Resizezone;
