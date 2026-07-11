import { componentNames as components, drawingModes } from '@/consts';
import Graphics from '@/graphics';
import {
  createComponentInstances,
  createDrawingModeInstances,
} from '@/graphicsRegistry';

describe('graphicsRegistry', () => {
  it('creates every drawing mode used by Graphics', () => {
    const modes = createDrawingModeInstances();
    const names = modes.map((mode) => mode.getName());

    expect(names).toEqual([
      drawingModes.CROPPER,
      drawingModes.FREE_DRAWING,
      drawingModes.LINE_DRAWING,
      drawingModes.SHAPE,
      drawingModes.TEXT,
      drawingModes.ICON,
      drawingModes.ZOOM,
      drawingModes.RESIZE,
      drawingModes.ANNOTATION,
      drawingModes.ERASER,
    ]);
  });

  it('creates every component used by Graphics', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const graphics = new Graphics(wrapper);
    const componentInstances = createComponentInstances(graphics);
    const names = componentInstances.map((component) => component.getName());

    expect(names).toEqual([
      components.IMAGE_LOADER,
      components.CROPPER,
      components.FLIP,
      components.ROTATION,
      components.FREE_DRAWING,
      components.LINE,
      components.TEXT,
      components.ICON,
      components.FILTER,
      components.SHAPE,
      components.ZOOM,
      components.RESIZE,
      components.ANNOTATION,
      components.ERASER,
    ]);

    graphics.destroy();
  });
});
