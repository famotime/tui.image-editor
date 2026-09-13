import DrawingMode from '@/interface/drawingMode';
import { drawingModes, componentNames as components } from '@/consts';

/**
 * ResizeDrawingMode class
 * @class
 * @ignore
 */
class ResizeDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.RESIZE);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  start(graphics) {
    // 启动调整尺寸绘图模式前重置视图缩放
    if (graphics && graphics.resetZoom) {
      graphics.resetZoom();
    }
    const resize = graphics.getComponent(components.RESIZE);
    resize.start();
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const resize = graphics.getComponent(components.RESIZE);
    resize.end();
  }
}

export default ResizeDrawingMode;
