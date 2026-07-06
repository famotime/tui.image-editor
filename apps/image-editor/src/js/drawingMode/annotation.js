import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * AnnotationDrawingMode class
 * @class
 * @ignore
 */
class AnnotationDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.ANNOTATION);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  start(graphics) {
    const annotation = graphics.getComponent(components.ANNOTATION);
    annotation.start();
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const annotation = graphics.getComponent(components.ANNOTATION);
    annotation.end();
  }
}

export default AnnotationDrawingMode;
