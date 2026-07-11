import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * LassoDrawingMode class
 * @class
 * @ignore
 */
class LassoDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.LASSO);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @param {{selectType: ?string}} [options] - selectType
   * @override
   */
  start(graphics, options) {
    const lasso = graphics.getComponent(components.LASSO);
    lasso.start(options);
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const lasso = graphics.getComponent(components.LASSO);
    lasso.end();
  }
}

export default LassoDrawingMode;
