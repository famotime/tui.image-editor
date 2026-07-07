import { fabric } from 'fabric';
import Graphics from '@/graphics';
import HighlightLine from '@/component/highlightLine';
import { eventNames } from '@/consts';

describe('HighlightLine', () => {
  let canvas, graphics, mockImage, highlightLine, fEvent;

  beforeEach(() => {
    graphics = new Graphics(document.createElement('canvas'));
    canvas = graphics.getCanvas();
    jest.spyOn(canvas, 'getPointer').mockReturnValue({ x: 30, y: 60 });
    highlightLine = new HighlightLine(graphics);
    highlightLine._highlightLine = new fabric.Line([10, 20, 30, 40]);
    mockImage = new fabric.Image();
    graphics.setCanvasImage('mockImage', mockImage);
    fEvent = { e: {} };
  });

  afterEach(() => {
    canvas.forEachObject((obj) => {
      canvas.remove(obj);
    });
  });

  it('should insert the highlightLine', () => {
    highlightLine._onFabricMouseDown(fEvent);

    expect(canvas.getObjects()).toHaveLength(1);
  });

  it('should draw highlightLine located by mouse pointer', () => {
    canvas.add(highlightLine._highlightLine);
    const [object] = canvas.getObjects();

    expect(object).toMatchObject({ x2: 30, y2: 40 });

    highlightLine._onFabricMouseMove(fEvent);

    expect(object).toMatchObject({ x2: 30, y2: 60 });
  });

  it('should restore all drawing objects activated', () => {
    const path = new fabric.Path();
    canvas.add(path);
    const [object] = canvas.getObjects();

    highlightLine.start();

    expect(object.evented).toBe(false);

    highlightLine.end();

    expect(object.evented).toBe(true);
  });

  it('should fire after the highlightLine is drawn', () => {
    highlightLine.fire = jest.fn();

    highlightLine._onFabricMouseUp(fEvent);

    expect(highlightLine.fire).toHaveBeenCalledWith(eventNames.OBJECT_ADDED, expect.any(Object));
  });
});
