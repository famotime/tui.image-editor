import { fabric } from 'fabric';
import Graphics from '@/graphics';
import { stamp } from '@/util';
import { drawingModes, componentNames as components } from '@/consts';

describe('Graphics', () => {
  const cssMaxWidth = 900;
  const cssMaxHeight = 700;
  let graphics, canvas;

  beforeEach(() => {
    graphics = new Graphics(document.createElement('canvas'), { cssMaxWidth, cssMaxHeight });
    canvas = graphics.getCanvas();
  });

  afterEach(() => {
    graphics.stopDrawingMode();
  });

  it('should have several properties', () => {
    expect(canvas).not.toBeNull();
    expect(canvas).toEqual(expect.any(fabric.Canvas));
    expect(graphics.cssMaxWidth).toBe(900);
    expect(graphics.cssMaxHeight).toBe(700);
    expect(graphics.canvasImage).toBeNull();
    expect(graphics.imageName).toBe('');
    expect(graphics._drawingMode).toBe(drawingModes.NORMAL);
    expect(graphics._componentMap).not.toBeNull();
  });

  it('should be changed after the path has been drawn', () => {
    const pathObj = new fabric.Path('M 0 0 L 100 0 L 100 100 L 0 100 z');
    const { x, y } = pathObj.getCenterPoint();

    graphics._onPathCreated({ path: pathObj });

    expect(pathObj.originX).toBe('center');
    expect(pathObj.originY).toBe('center');
    expect(pathObj.left).toBe(x);
    expect(pathObj.top).toBe(y);
  });

  it('should ignore eraser paths when path has been drawn', () => {
    const pathObj = new fabric.Path('M 0 0 L 100 0 L 100 100 L 0 100 z');
    pathObj._isEraserPath = true;
    const addObjectSpy = jest.fn();

    graphics.on('addObject', addObjectSpy);
    graphics._onPathCreated({ path: pathObj });

    expect(addObjectSpy).not.toHaveBeenCalled();
  });

  it('should register path object in _objects when path is created', () => {
    const pathObj = new fabric.Path('M 0 0 L 100 0 L 100 100 L 0 100 z');
    const addObjectSpy = jest.fn();

    graphics.on('addObject', addObjectSpy);
    graphics._onPathCreated({ path: pathObj });

    const pathId = graphics.getObjectId(pathObj);
    expect(graphics.getObject(pathId)).toBe(pathObj);
    expect(addObjectSpy).toHaveBeenCalled();
  });

  it('should attach canvas events', () => {
    const onMousedown = jest.fn();
    const onObjectAdded = jest.fn();
    const onObjectSelected = jest.fn();

    graphics.on({ mousedown: onMousedown, 'object:added': onObjectAdded });
    graphics.once('object:selected', onObjectSelected);
    graphics.fire('mousedown');
    graphics.fire('mousedown');
    graphics.fire('object:added');
    graphics.fire('object:added');
    graphics.fire('object:selected');
    graphics.fire('object:selected');

    expect(onMousedown).toHaveBeenCalledTimes(2);
    expect(onObjectAdded).toHaveBeenCalledTimes(2);
    expect(onObjectSelected).toHaveBeenCalledTimes(1);
  });

  it('should deactivate all objects', () => {
    const triangle = new fabric.Triangle({ width: 20, height: 30 });

    canvas.add(triangle).setActiveObject(triangle);
    expect(canvas.getActiveObject()).not.toBeNull();

    graphics.deactivateAll();
    expect(canvas.getActiveObject()).toBeNull();
  });

  it('should render objects', () => {
    let beforeRender = false;
    const triangle = new fabric.Triangle({ width: 20, height: 30 });

    canvas.add(triangle);
    canvas.on('before:render', () => {
      beforeRender = true;
    });
    canvas.on('after:render', () => expect(beforeRender).toBe(true));
    graphics.renderAll();
  });

  it('should remove a object or group by id', () => {
    const triangle = new fabric.Triangle({ width: 20, height: 30 });

    graphics.add(triangle);
    const objectId = stamp(triangle);
    graphics.removeObjectById(objectId);

    expect(graphics.getObjects()).toHaveLength(0);
  });

  it('should switch drawing modes', () => {
    Object.keys(drawingModes).forEach((modeName) => {
      graphics.startDrawingMode(modeName);
      expect(graphics.getDrawingMode()).toBe(modeName);

      graphics.stopDrawingMode();
      expect(graphics.getDrawingMode()).toBe(drawingModes.NORMAL);
    });
  });

  it('should get the cropped image data', () => {
    const cropper = graphics.getComponent(components.CROPPER);
    graphics.startDrawingMode(drawingModes.CROPPER);
    jest.spyOn(cropper._cropzone, 'isValid').mockReturnValue(true);
    const cropzoneRect = graphics.getCropzoneRect();

    expect(cropzoneRect).not.toBeNull();
    expect(graphics.getCroppedImageData(cropzoneRect)).toEqual({
      imageName: expect.any(String),
      url: expect.any(String),
    });
  });

  it('should be hidden initially and then redisplayed after completion at toDataURL is executed with a cropzone present', () => {
    const cropper = graphics.getComponent(components.CROPPER);
    const changeVisibilitySpy = jest.spyOn(cropper, 'changeVisibility');

    graphics.startDrawingMode(drawingModes.CROPPER);
    graphics.toDataURL();

    expect(changeVisibilitySpy).toHaveBeenNthCalledWith(1, false);
    expect(changeVisibilitySpy).toHaveBeenNthCalledWith(2, true);
  });

  it('should set brush setting into LINE_DRAWING, FREE_DRAWING', () => {
    graphics.startDrawingMode(drawingModes.LINE_DRAWING);
    graphics.setBrush({ width: 12, color: 'FFFF00' });
    const brush = canvas.freeDrawingBrush;

    expect(brush).toMatchObject({ width: 12, color: 'rgba(255,255,0,1)' });
  });

  it('should use fabric eraser brush in ERASER drawing mode', () => {
    graphics.startDrawingMode(drawingModes.ERASER, { width: 18 });

    expect(canvas.freeDrawingBrush).toEqual(expect.any(fabric.EraserBrush));
    expect(canvas.freeDrawingBrush.width).toBe(18);
  });

  it('should restore pencil brush when switching from ERASER to FREE_DRAWING', () => {
    graphics.startDrawingMode(drawingModes.ERASER, { width: 18 });
    expect(canvas.freeDrawingBrush).toEqual(expect.any(fabric.EraserBrush));

    graphics.startDrawingMode(drawingModes.FREE_DRAWING, { width: 10, color: '#00a9ff' });
    expect(canvas.freeDrawingBrush.constructor).toBe(fabric.PencilBrush);
    expect(canvas.freeDrawingBrush).not.toEqual(expect.any(fabric.EraserBrush));
    expect(canvas.freeDrawingBrush.color).toBe('rgba(0,169,255,1)');
    expect(canvas.freeDrawingBrush.width).toBe(10);
  });

  it('should change a drawing shape', () => {
    const shapeComp = graphics.getComponent(components.SHAPE);
    graphics.setDrawingShape('circle', {
      fill: 'transparent',
      stroke: 'blue',
      strokeWidth: 3,
      rx: 10,
      ry: 100,
    });

    expect(shapeComp._type).toBe('circle');
    expect(shapeComp._options).toEqual({
      strokeWidth: 3,
      stroke: 'blue',
      fill: 'transparent',
      width: 1,
      height: 1,
      rx: 10,
      ry: 100,
      lockSkewingX: true,
      lockSkewingY: true,
      bringForward: true,
      isRegular: false,
    });
  });

  it('should register custom icon', () => {
    const pathMap = { customIcon: 'M 0 0 L 20 20 L 10 10 Z' };
    const iconComp = graphics.getComponent(components.ICON);
    graphics.registerPaths(pathMap);

    expect(iconComp._pathMap).toMatchObject(pathMap);
  });

  it('should not have the filter', () => {
    expect(graphics.hasFilter('Grayscale')).toBe(false);
  });

  describe('pasteObject()', () => {
    let targetObject1, targetObject2;

    beforeEach(() => {
      targetObject1 = new fabric.Object({});
      targetObject2 = new fabric.Object({});

      canvas.add(targetObject1);
      canvas.add(targetObject2);
    });

    it('should be duplicated as many as the number of objects in the group', async () => {
      const groupObject = graphics.getActiveSelectionFromObjects(canvas.getObjects());
      graphics.setActiveObject(groupObject);
      graphics.resetTargetObjectForCopyPaste();

      await graphics.pasteObject();

      expect(canvas.getObjects()).toHaveLength(4);
    });

    it('should be duplicated', async () => {
      graphics.setActiveObject(targetObject1);
      graphics.resetTargetObjectForCopyPaste();

      await graphics.pasteObject();

      expect(canvas.getObjects()).toHaveLength(3);
    });

    it('should duplicate paired annotation objects and link relatedObj', async () => {
      targetObject1.relatedObj = targetObject2;
      targetObject2.relatedObj = targetObject1;

      graphics.setActiveObject(targetObject1);
      graphics.resetTargetObjectForCopyPaste();

      await graphics.pasteObject();

      // Original 2 objects + 2 cloned objects = 4
      expect(canvas.getObjects()).toHaveLength(4);
      const clonedShape = canvas.getActiveObject();
      expect(clonedShape).not.toBe(targetObject1);
      expect(clonedShape.relatedObj).toBeDefined();
      expect(clonedShape.relatedObj).not.toBe(targetObject2);
      expect(clonedShape.relatedObj.relatedObj).toBe(clonedShape);
    });
  });

  describe('Drag interactions (Shift axis lock & Ctrl drag copy)', () => {
    let rect;

    beforeEach(() => {
      rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 50,
        height: 50,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
    });

    it('should constrain movement to horizontal axis when shiftKey is pressed and |dx| >= |dy|', () => {
      // Simulate mousedown at (100, 100)
      graphics._onMouseDown({
        target: rect,
        e: { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
      });

      // Move to (150, 120) with shiftKey (dx=50, dy=20 => horizontal lock)
      rect.set({ left: 150, top: 120 });
      graphics._onObjectMoved({
        target: rect,
        e: { shiftKey: true },
      });

      expect(rect.left).toBe(150);
      expect(rect.top).toBe(100);
    });

    it('should constrain movement to vertical axis when shiftKey is pressed and |dy| > |dx|', () => {
      graphics._onMouseDown({
        target: rect,
        e: { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
      });

      // Move to (120, 160) with shiftKey (dx=20, dy=60 => vertical lock)
      rect.set({ left: 120, top: 160 });
      graphics._onObjectMoved({
        target: rect,
        e: { shiftKey: true },
      });

      expect(rect.left).toBe(100);
      expect(rect.top).toBe(160);
    });

    it('should clone object when ctrlKey is pressed and drag exceeds 3px', () => {
      const addObjectSpy = jest.fn();
      graphics.on('addObject', addObjectSpy);

      graphics._onMouseDown({
        target: rect,
        e: { ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
      });

      // Move to (130, 130) -> dist > 3px
      rect.set({ left: 130, top: 130 });
      graphics._onObjectMoved({
        target: rect,
        e: { ctrlKey: true },
      });

      // Original object should stay at start (100, 100)
      expect(rect.left).toBe(100);
      expect(rect.top).toBe(100);

      // Cloned object should have been added
      expect(canvas.getObjects().length).toBeGreaterThan(1);
      const cloned = canvas.getActiveObject();
      expect(cloned).not.toBe(rect);

      // Finish drag
      graphics._onObjectModified({ target: cloned });
      expect(addObjectSpy).toHaveBeenCalled();
    });

    it('should support both clone and axis lock on Ctrl + Shift + drag', () => {
      graphics._onMouseDown({
        target: rect,
        e: { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false },
      });

      // Move to (150, 110) with Ctrl + Shift (dx=50, dy=10 => horizontal lock)
      rect.set({ left: 150, top: 110 });
      graphics._onObjectMoved({
        target: rect,
        e: { ctrlKey: true, shiftKey: true },
      });

      const cloned = canvas.getActiveObject();
      expect(cloned).not.toBe(rect);
      expect(cloned.left).toBe(150);
      expect(cloned.top).toBe(100); // axis-locked to startTop
      expect(rect.left).toBe(100);
      expect(rect.top).toBe(100);
    });
  });

  describe('Visibility Control', () => {
    it('changeVisibilityAll should change visibility of all non-cropzone objects', () => {
      canvas = graphics.getCanvas();
      const obj1 = new fabric.Object({ type: 'rect', visible: true });
      const obj2 = new fabric.Object({ type: 'text', visible: true });
      const cropzone = new fabric.Object({ type: 'cropzone', visible: true });

      canvas.add(obj1, obj2, cropzone);

      graphics.changeVisibilityAll(false);

      expect(obj1.visible).toBe(false);
      expect(obj2.visible).toBe(false);
      expect(cropzone.visible).toBe(true);
    });

    it('toggleVisibilityAll should toggle visibility based on current state', () => {
      canvas = graphics.getCanvas();
      const obj1 = new fabric.Object({ type: 'rect', visible: true });
      canvas.add(obj1);

      let newState = graphics.toggleVisibilityAll();
      expect(newState).toBe(false);
      expect(obj1.visible).toBe(false);

      newState = graphics.toggleVisibilityAll();
      expect(newState).toBe(true);
      expect(obj1.visible).toBe(true);
    });
  });
});
