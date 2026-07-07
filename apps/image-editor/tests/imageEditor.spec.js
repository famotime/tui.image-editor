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
});
