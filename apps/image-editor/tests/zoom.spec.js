import { fabric } from 'fabric';
import ImageEditor from '@/imageEditor';

import '@/command/loadImage';

import img from 'fixtures/sampleImage.jpg';

describe('Zoom', () => {
  let imageEditor, x, y, zoomLevel;

  beforeEach(async () => {
    imageEditor = new ImageEditor(document.createElement('div'), {
      cssMaxWidth: 700,
      cssMaxHeight: 500,
    });
    const image = new fabric.Image(img);
    await imageEditor.loadImageFromURL(image, 'sampleImage');
    x = 0;
    y = 0;
    zoomLevel = 1.0;
  });

  afterEach(() => {
    imageEditor.destroy();
  });

  it('should change zoom of image', () => {
    zoomLevel += 1;
    imageEditor.zoom({ x, y, zoomLevel });

    const canvas = imageEditor._graphics.getCanvas();

    expect(canvas.getZoom()).toBe(zoomLevel);
  });

  it('should reset zoom of image', () => {
    zoomLevel += 1;
    imageEditor.zoom({ x, y, zoomLevel });
    imageEditor.resetZoom();

    const canvas = imageEditor._graphics.getCanvas();

    expect(canvas.getZoom()).toBe(1.0);
  });

  it('should keep the whole zoomed image inside canvas bounds when zoomed in', async () => {
    const largeImage = new fabric.Image(img, {
      width: 700,
      height: 500,
    });

    await imageEditor.loadImageFromURL(largeImage, 'largeImage');

    const canvas = imageEditor._graphics.getCanvas();
    const initialWidth = canvas.getWidth();
    const initialHeight = canvas.getHeight();

    imageEditor.zoom({ x, y, zoomLevel: 2 });

    expect(canvas.getWidth()).toBeGreaterThanOrEqual(initialWidth * 2);
    expect(canvas.getHeight()).toBeGreaterThanOrEqual(initialHeight * 2);

    imageEditor.zoom({ x, y, zoomLevel: 5 });

    expect(canvas.getWidth()).toBeGreaterThanOrEqual(initialWidth * 5);
    expect(canvas.getHeight()).toBeGreaterThanOrEqual(initialHeight * 5);
  });

  it('should resize includeUI editor area gradually to the available display space when zoomed in', async () => {
    const wrapper = document.createElement('div');
    const largeImage = new fabric.Image(img, {
      width: 700,
      height: 500,
    });
    const editorWithUI = new ImageEditor(wrapper, {
      includeUI: {
        menu: [],
        uiSize: {
          width: '1000px',
          height: '700px',
        },
      },
      cssMaxWidth: 700,
      cssMaxHeight: 500,
      usageStatistics: false,
    });

    await editorWithUI.loadImageFromURL(largeImage, 'largeImage');
    const initialWidth = parseFloat(editorWithUI.ui.getEditorArea().style.width);
    const initialHeight = parseFloat(editorWithUI.ui.getEditorArea().style.height);

    Object.defineProperty(editorWithUI.ui._editorElementWrap, 'clientWidth', {
      value: 900,
      configurable: true,
    });
    Object.defineProperty(editorWithUI.ui._editorElementWrap, 'clientHeight', {
      value: 650,
      configurable: true,
    });

    editorWithUI.zoom({ x, y, zoomLevel: 2 });

    expect(parseFloat(editorWithUI.ui.getEditorArea().style.width)).toBeGreaterThanOrEqual(
      initialWidth * 2
    );
    expect(parseFloat(editorWithUI.ui.getEditorArea().style.height)).toBeGreaterThanOrEqual(
      initialHeight * 2
    );

    editorWithUI.zoom({ x, y, zoomLevel: 5 });

    expect(parseFloat(editorWithUI.ui.getEditorArea().style.width)).toBeGreaterThanOrEqual(
      initialWidth * 5
    );
    expect(parseFloat(editorWithUI.ui.getEditorArea().style.height)).toBeGreaterThanOrEqual(
      initialHeight * 5
    );

    editorWithUI.destroy();
  });
});
