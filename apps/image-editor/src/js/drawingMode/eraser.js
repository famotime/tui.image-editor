import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * EraserDrawingMode class
 * @class
 * @ignore
 */
class EraserDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.ERASER);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @param {{width: ?number}} [options] - brush width
   * @override
   */
  start(graphics, options) {
    const eraser = graphics.getComponent(components.ERASER);
    eraser.start(options);
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const eraser = graphics.getComponent(components.ERASER);
    eraser.end();
  }
}

export default EraserDrawingMode;
