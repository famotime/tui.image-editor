import { fabric } from 'fabric';
import ImageEditor from '@/imageEditor';
import * as util from '@/util';
import { eventNames, keyCodes } from '@/consts';

const { OBJECT_ROTATED } = eventNames;

describe('ImageEditor', () => {
  describe('constructor', () => {
    let imageEditor, el, sendHostNameSpy;

    beforeEach(() => {
      el = document.createElement('div');

      imageEditor = new ImageEditor(el, { usageStatistics: false });
      sendHostNameSpy = jest.spyOn(util, 'sendHostName');
    });

    afterEach(() => {
      imageEditor.destroy();
    });

    it('should send hostname by default', () => {
      imageEditor = new ImageEditor(el);

      expect(sendHostNameSpy).toHaveBeenCalled();
    });

    it('should not send hostname on usageStatistics option false', () => {
      imageEditor = new ImageEditor(el, { usageStatistics: false });

      expect(sendHostNameSpy).not.toHaveBeenCalled();
    });

    it('should not be executed when object is selected state', () => {
      const preventDefaultSpy = jest.fn();
      jest.spyOn(imageEditor._graphics, 'getActiveObject').mockReturnValue(null);

      imageEditor._onKeyDown({ keyCode: keyCodes.BACKSPACE, preventDefault: preventDefaultSpy });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should be fire at object is rotated', () => {
      const canvas = imageEditor._graphics.getCanvas();
      const obj = new fabric.Object({});
      canvas.add(obj);
      imageEditor.fire = jest.fn();

      canvas.fire('object:rotating', { target: obj });

      expect(imageEditor.fire).toHaveBeenCalledWith(OBJECT_ROTATED, expect.any(Object));
    });
  });

  describe('Visibility Control', () => {
    let imageEditor, el;

    beforeEach(() => {
      el = document.createElement('div');
      imageEditor = new ImageEditor(el, { usageStatistics: false });
    });

    afterEach(() => {
      imageEditor.destroy();
    });

    it('should hide all objects', () => {
      const spy = jest.spyOn(imageEditor._graphics, 'changeVisibilityAll');
      imageEditor.hideAllObjects();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should show all objects', () => {
      const spy = jest.spyOn(imageEditor._graphics, 'changeVisibilityAll');
      imageEditor.showAllObjects();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should toggle all objects visibility', () => {
      const spy = jest.spyOn(imageEditor._graphics, 'toggleVisibilityAll');
      imageEditor.toggleAllObjectsVisibility();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onKeyDown arrow keys movement', () => {
    let imageEditor, el, rectObj;

    beforeEach(() => {
      el = document.createElement('div');
      imageEditor = new ImageEditor(el, { usageStatistics: false });

      rectObj = new fabric.Rect({
        left: 100,
        top: 100,
        width: 50,
        height: 50,
      });
      imageEditor._graphics.getCanvas().add(rectObj);
      imageEditor._graphics.getCanvas().setActiveObject(rectObj);
    });

    afterEach(() => {
      imageEditor.destroy();
    });

    it('should move active object by 1px on ArrowLeft keydown', () => {
      const preventDefaultSpy = jest.fn();

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_LEFT,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(rectObj.left).toBe(99);
      expect(rectObj.top).toBe(100);
    });

    it('should move active object by 1px on ArrowRight keydown', () => {
      const preventDefaultSpy = jest.fn();

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_RIGHT,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(rectObj.left).toBe(101);
      expect(rectObj.top).toBe(100);
    });

    it('should move active object by 1px on ArrowUp keydown', () => {
      const preventDefaultSpy = jest.fn();

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_UP,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(rectObj.left).toBe(100);
      expect(rectObj.top).toBe(99);
    });

    it('should move active object by 1px on ArrowDown keydown', () => {
      const preventDefaultSpy = jest.fn();

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_DOWN,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(rectObj.left).toBe(100);
      expect(rectObj.top).toBe(101);
    });

    it('should not move object when focused inside an input element', () => {
      const preventDefaultSpy = jest.fn();
      const inputEl = document.createElement('input');

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_LEFT,
        target: inputEl,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(rectObj.left).toBe(100);
    });

    it('should not move object when active object is editing', () => {
      const preventDefaultSpy = jest.fn();
      rectObj.isEditing = true;

      imageEditor._onKeyDown({
        keyCode: keyCodes.ARROW_LEFT,
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(rectObj.left).toBe(100);
    });
  });
});
