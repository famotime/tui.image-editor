import { fabric } from 'fabric';
import Component from '@/interface/component';
import { componentNames } from '@/consts';

/**
 * FreeDrawing
 * @class FreeDrawing
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class FreeDrawing extends Component {
  constructor(graphics) {
    super(componentNames.FREE_DRAWING, graphics);

    /**
     * Brush width
     * @type {number}
     */
    this.width = 12;

    /**
     * fabric.Color instance for brush color
     * @type {fabric.Color}
     */
    this.oColor = new fabric.Color('rgba(0, 0, 0, 0.5)');
  }

  /**
   * Start free drawing mode
   * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
   */
  start(setting) {
    const canvas = this.getCanvas();

    canvas.isDrawingMode = true;
    // 确保画笔为标准的 PencilBrush（排除 EraserBrush、PatternBrush 等继承自 PencilBrush 的子类）
    if (!canvas.freeDrawingBrush || canvas.freeDrawingBrush.constructor !== fabric.PencilBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    this.setBrush(setting);
  }

  /**
   * Set brush
   * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
   */
  setBrush(setting) {
    const canvas = this.getCanvas();

    if (!canvas.freeDrawingBrush || canvas.freeDrawingBrush.constructor !== fabric.PencilBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }
    const brush = canvas.freeDrawingBrush;

    setting = setting || {};
    this.width = setting.width || this.width;
    if (setting.color) {
      this.oColor = new fabric.Color(setting.color);
    }
    brush.width = this.width;
    brush.color = this.oColor.toRgba();
  }

  /**
   * End free drawing mode
   */
  end() {
    const canvas = this.getCanvas();

    canvas.isDrawingMode = false;
  }
}

export default FreeDrawing;
