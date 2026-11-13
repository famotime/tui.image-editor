import { fabric } from 'fabric';
import Graphics from '@/graphics';
import Cropper from '@/component/cropper';
import Line from '@/component/line';
import Shape from '@/component/shape';
import Zoom from '@/component/zoom';
import Lasso from '@/component/lasso';
import { drawingModes } from '@/consts';

describe('State Machine Edge Cases & Lifecycle Robustness', () => {
  let graphics, canvas, container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    graphics = new Graphics(container, { cssMaxWidth: 800, cssMaxHeight: 600 });
    canvas = graphics.getCanvas();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Layer Lock Preservation Across Modes', () => {
    let lockedObj, normalObj;

    beforeEach(() => {
      lockedObj = new fabric.Rect({
        width: 50,
        height: 50,
        selectable: false,
        evented: false,
      });
      lockedObj.locked = true;
      lockedObj.__isLayerLocked = true;

      normalObj = new fabric.Rect({
        width: 100,
        height: 100,
        selectable: true,
        evented: true,
      });

      canvas.add(lockedObj, normalObj);
    });

    it('should keep locked object non-evented when Cropper starts and ends', () => {
      const cropper = graphics.getComponent('CROPPER');
      cropper.start();

      expect(lockedObj.evented).toBe(false);
      expect(normalObj.evented).toBe(false);

      cropper.end();

      expect(lockedObj.evented).toBe(false);
      expect(lockedObj.selectable).toBe(false);
      expect(normalObj.evented).toBe(true);
    });

    it('should keep locked object non-evented when Line starts and ends', () => {
      const line = graphics.getComponent('LINE');
      line.start();

      expect(lockedObj.evented).toBe(false);
      expect(normalObj.evented).toBe(false);

      line.end();

      expect(lockedObj.evented).toBe(false);
      expect(lockedObj.selectable).toBe(false);
      expect(normalObj.evented).toBe(true);
    });

    it('should keep locked object non-evented when Zoom hand mode starts and ends', () => {
      const zoom = graphics.getComponent('ZOOM');
      zoom.startHandMode();

      expect(lockedObj.evented).toBe(false);
      expect(normalObj.evented).toBe(false);

      zoom.endHandMode();

      expect(lockedObj.evented).toBe(false);
      expect(lockedObj.selectable).toBe(false);
      expect(normalObj.evented).toBe(true);
    });

    it('should keep locked object non-evented when Resize starts and ends', () => {
      graphics.setCanvasImage('mockImage', new fabric.Image(null, { width: 100, height: 100 }));
      const resize = graphics.getComponent('RESIZE');
      resize.start();

      expect(lockedObj.evented).toBe(false);
      expect(normalObj.evented).toBe(false);

      resize.end();

      expect(lockedObj.evented).toBe(false);
      expect(lockedObj.selectable).toBe(false);
      expect(normalObj.evented).toBe(true);
    });

    it('should not force locked object to become selectable/evented in Lasso mode', () => {
      const lasso = graphics.getComponent('LASSO');
      lasso.start();

      expect(lockedObj.selectable).toBe(false);
      expect(lockedObj.evented).toBe(false);
      expect(normalObj.selectable).toBe(true);
      expect(normalObj.evented).toBe(true);

      lasso.end();
    });
  });

  describe('Mid-drag Component Termination Safety', () => {
    it('Cropper: should not throw if mousemove/mouseup occurs after early end()', () => {
      const cropper = graphics.getComponent('CROPPER');
      cropper.start();

      cropper._onFabricMouseDown({ e: { clientX: 10, clientY: 10 } });

      // Premature end while dragging
      expect(() => cropper.end()).not.toThrow();

      // Subsequent mouse events must not throw null pointer errors
      expect(() => {
        cropper._onFabricMouseMove({ e: { clientX: 50, clientY: 50 } });
      }).not.toThrow();

      expect(() => {
        cropper._onFabricMouseUp();
      }).not.toThrow();
    });

    it('Line: should not throw if mousemove/mouseup occurs after early end()', () => {
      const line = graphics.getComponent('LINE');
      line.start();

      line._onFabricMouseDown({ e: { clientX: 20, clientY: 20 } });

      expect(() => line.end()).not.toThrow();

      expect(() => {
        line._onFabricMouseMove({ e: { clientX: 80, clientY: 80 } });
      }).not.toThrow();

      expect(() => {
        line._onFabricMouseUp();
      }).not.toThrow();
    });

    it('Shape: should not throw if mousemove/mouseup occurs after early end()', () => {
      const shape = graphics.getComponent('SHAPE');
      shape.start();

      shape._handlers.mousedown({ e: { clientX: 10, clientY: 10 } });

      expect(() => shape.end()).not.toThrow();

      expect(() => {
        shape._handlers.mousemove({ e: { clientX: 100, clientY: 100 } });
      }).not.toThrow();

      expect(() => {
        shape._handlers.mouseup();
      }).not.toThrow();
    });

    it('Zoom: should not throw if mousemove occurs after early endHandMode()', () => {
      const zoom = graphics.getComponent('ZOOM');
      zoom.zoomLevel = 2.0; // Hand mode allowed when zoomLevel > 0.1
      zoom.startHandMode();

      zoom._onMouseDownWithHandMode({ e: { clientX: 50, clientY: 50 } });

      expect(() => zoom.endHandMode()).not.toThrow();

      expect(() => {
        zoom._onMouseMoveWithHandMode({ e: { clientX: 80, clientY: 80 } });
      }).not.toThrow();

      expect(() => {
        zoom._onMouseUpWithHandMode();
      }).not.toThrow();
    });
  });

  describe('Graphics State Machine Integration', () => {
    it('should track drawing mode and options through StateMachine', () => {
      const opts = { width: 20, color: '#0000ff' };
      graphics.startDrawingMode(drawingModes.FREE_DRAWING, opts);

      expect(graphics.getDrawingMode()).toBe(drawingModes.FREE_DRAWING);
      expect(graphics.getDrawingModeOptions()).toEqual(opts);

      graphics.stopDrawingMode();
      expect(graphics.getDrawingMode()).toBe(drawingModes.NORMAL);
      expect(graphics.getDrawingModeOptions()).toBeNull();
    });

    it('should support suspending and restoring drawing mode with options', () => {
      const opts = { type: 'circle', fill: '#ffff00' };
      graphics.startDrawingMode(drawingModes.SHAPE, opts);

      const suspended = graphics.suspendDrawingMode();
      expect(suspended).toBe(true);
      expect(graphics.getDrawingMode()).toBe(drawingModes.NORMAL);

      const restored = graphics.restoreDrawingMode();
      expect(restored).toEqual({
        mode: drawingModes.SHAPE,
        options: opts,
      });
      expect(graphics.getDrawingMode()).toBe(drawingModes.SHAPE);
    });
  });
});
