import { fabric } from 'fabric';
import Graphics from '@/graphics';
import Resize from '@/component/resize';

describe('Resize', () => {
  let graphics, resize, mockImage;

  beforeAll(() => {
    graphics = new Graphics(document.createElement('canvas'));
    resize = new Resize(graphics);
  });

  beforeEach(() => {
    mockImage = new fabric.Image(null, { width: 100, height: 100 });
    graphics.setCanvasImage('mockImage', mockImage);
  });

  it('should return current image dimensions', () => {
    let currentDimensions = resize.getCurrentDimensions();

    expect(currentDimensions).toEqual({ width: 100, height: 100 });

    const newDimensions = { width: 20, height: 20 };

    resize.resize(newDimensions);
    currentDimensions = resize.getCurrentDimensions();

    expect(newDimensions).toEqual(currentDimensions);
  });

  it('should return original image dimensions after resizing', () => {
    const originalDimensionsBeforeResizing = resize.getOriginalDimensions();
    const newDimensions = { width: 20, height: 20 };

    resize.resize(newDimensions);
    const originalDimensionsAfterResizing = resize.getOriginalDimensions();

    expect(originalDimensionsBeforeResizing).toEqual(originalDimensionsAfterResizing);
  });

  it('should set original dimensions', () => {
    const newDimensions = { width: 20, height: 20 };

    resize.setOriginalDimensions(newDimensions);
    const originalDimensions = resize.getOriginalDimensions();

    expect(newDimensions).toEqual(originalDimensions);
  });

  it('should resize image', () => {
    const originalDimensions = resize.getOriginalDimensions();
    const newDimensions = { width: 20, height: 20 };

    resize.resize(newDimensions);
    let currentDimensions = resize.getCurrentDimensions();

    expect(newDimensions).toEqual(currentDimensions);

    resize.resize(originalDimensions);
    currentDimensions = resize.getCurrentDimensions();

    expect(originalDimensions).toEqual(currentDimensions);
  });

  it('should set original dimensions when drawing mode is started', () => {
    resize.setOriginalDimensions(null);

    resize.start();

    expect(resize.getOriginalDimensions()).not.toBeNull();
  });

  it('should have end method', () => {
    expect(typeof resize.end === 'function').toBe(true);
  });

  it('should return promise', async () => {
    const newDimensions = { width: 20, height: 20 };

    const obj = await resize.resize(newDimensions);

    expect(obj).toBeUndefined();
  });

  it('should create Resizezone on canvas and remove it on end', () => {
    resize.start();

    expect(resize._resizezone).not.toBeNull();
    expect(graphics.getCanvas().contains(resize._resizezone)).toBe(true);

    resize.end();
    expect(resize._resizezone).toBeNull();
  });

  it('should scale canvasImage and expand canvas on zone resizing and modified', () => {
    resize.start();
    const canvas = graphics.getCanvas();
    const canvasImage = graphics.getCanvasImage();

    resize._onZoneResizing({ width: 200, height: 180 });
    expect(canvasImage.left).toBe(0);
    expect(canvasImage.top).toBe(0);
    expect(canvas.width).toBeGreaterThanOrEqual(200);
    expect(canvas.height).toBeGreaterThanOrEqual(180);
    expect(resize.getCurrentDimensions()).toEqual({ width: 200, height: 180 });

    resize._onZoneModified({ width: 250, height: 220 });
    expect(canvasImage.left).toBe(0);
    expect(canvasImage.top).toBe(0);
    expect(canvas.width).toBe(250);
    expect(canvas.height).toBe(220);
    expect(resize.getCurrentDimensions()).toEqual({ width: 250, height: 220 });

    resize.end();
  });

  it('should sync dimensions and lock aspect ratio with Resizezone', () => {
    resize.start();

    resize.syncDimensions({ width: 150, height: 120 });
    expect(resize._resizezone.width).toBe(150);
    expect(resize._resizezone.height).toBe(120);

    resize.setLockAspectRatio(true);
    expect(resize._resizezone.lockUniScaling).toBe(true);

    resize.setLockAspectRatio(false);
    expect(resize._resizezone.lockUniScaling).toBe(false);

    resize.end();
  });
});
