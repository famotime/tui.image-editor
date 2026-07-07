import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * HighlightLineMode class
 * @class
 * @ignore
 */
class HighlightLineMode extends DrawingMode {
  constructor() {
    super(drawingModes.HIGHLIGHT_LINE);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @param {{width: ?number, color: ?string}} [options] - Brush width & color
   * @override
   */
  start(graphics, options) {
    const lineDrawing = graphics.getComponent(components.HIGHLIGHT_LINE);
    lineDrawing.start(options);
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const lineDrawing = graphics.getComponent(components.HIGHLIGHT_LINE);
    lineDrawing.end();
  }
}

export default HighlightLineMode;
