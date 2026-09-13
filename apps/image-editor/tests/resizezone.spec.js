import { fabric } from 'fabric';
import Resizezone from '@/extension/resizezone';

describe('Resizezone', () => {
  let canvas, resizezone;

  beforeEach(() => {
    canvas = new fabric.Canvas(document.createElement('canvas'));
    resizezone = new Resizezone(canvas, {
      width: 200,
      height: 150,
      left: 10,
      top: 20,
    });
  });

  afterEach(() => {
    canvas.dispose();
  });

  it('should initialize with correct dimensions and type', () => {
    expect(resizezone.type).toBe('resizezone');
    expect(resizezone.width).toBe(200);
    expect(resizezone.height).toBe(150);
    expect(resizezone.hasControls).toBe(true);
    expect(resizezone.hasBorders).toBe(true);
    expect(resizezone.lockRotation).toBe(true);
  });

  it('should support updateDimensions', () => {
    resizezone.updateDimensions({ width: 300, height: 250, left: 50, top: 60 });

    expect(resizezone.width).toBe(300);
    expect(resizezone.height).toBe(250);
    expect(resizezone.left).toBe(50);
    expect(resizezone.top).toBe(60);
    expect(resizezone.scaleX).toBe(1);
    expect(resizezone.scaleY).toBe(1);
  });

  it('should trigger onResizing callback on scaling', () => {
    const resizingSpy = jest.fn();
    resizezone.setResizingCallback(resizingSpy);

    resizezone.scaleX = 1.5;
    resizezone.scaleY = 1.2;
    resizezone._onScaling();

    expect(resizingSpy).toHaveBeenCalledWith({
      width: 300,
      height: 180,
    });
  });

  it('should trigger onModified callback and normalize scale on modified', () => {
    const modifiedSpy = jest.fn();
    resizezone.setModifiedCallback(modifiedSpy);

    resizezone.scaleX = 2;
    resizezone.scaleY = 2;
    resizezone._onModified();

    expect(resizezone.width).toBe(400);
    expect(resizezone.height).toBe(300);
    expect(resizezone.scaleX).toBe(1);
    expect(resizezone.scaleY).toBe(1);
    expect(modifiedSpy).toHaveBeenCalledWith({
      width: 400,
      height: 300,
    });
  });

  it('should support setLockAspectRatio', () => {
    expect(resizezone.lockUniScaling).toBe(false);

    resizezone.setLockAspectRatio(true);
    expect(resizezone.lockUniScaling).toBe(true);

    resizezone.setLockAspectRatio(false);
    expect(resizezone.lockUniScaling).toBe(false);
  });
});
