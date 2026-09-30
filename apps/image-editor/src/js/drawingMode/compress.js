import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * CompressDrawingMode class
 * @class
 * @ignore
 */
class CompressDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.COMPRESS);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  start(graphics) {
    if (graphics && graphics.resetZoom) {
      graphics.resetZoom();
    }
    const compress = graphics.getComponent(components.COMPRESS);
    if (compress) {
      compress.start();
    }
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const compress = graphics.getComponent(components.COMPRESS);
    if (compress) {
      compress.end();
    }
  }
}

export default CompressDrawingMode;
