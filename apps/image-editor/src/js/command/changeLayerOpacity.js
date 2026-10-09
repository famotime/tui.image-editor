import commandFactory from '@/factory/command';
import { commandNames } from '@/consts';

const command = {
  name: commandNames.CHANGE_LAYER_OPACITY,

  /**
   * Change layer opacity
   * @param {Graphics} graphics - Graphics instance
   * @param {number|string} objectId - Object id or 'background'
   * @param {number} opacity - Target opacity (0 to 1)
   * @returns {Promise}
   */
  execute(graphics, objectId, opacity) {
    const canvas = graphics.getCanvas();
    let target = null;

    if (objectId === 'background') {
      target = graphics.getCanvasImage();
    } else {
      target =
        graphics.getObject(objectId) ||
        graphics.getObject(Number(objectId)) ||
        (canvas &&
          canvas.getObjects().find((item) => String(item.id || item.__fe_id) === String(objectId)));
    }

    if (!target) {
      return Promise.reject(new Error('Target layer not found'));
    }

    const prevOpacity = typeof target.opacity === 'number' ? target.opacity : 1;
    target.set('opacity', opacity);
    canvas.renderAll();

    this.undoData = {
      objectId,
      prevOpacity,
      nextOpacity: opacity,
    };

    return Promise.resolve({
      objectId,
      opacity,
    });
  },

  /**
   * Undo opacity change
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const canvas = graphics.getCanvas();
    let target = null;

    if (this.undoData.objectId === 'background') {
      target = graphics.getCanvasImage();
    } else {
      target =
        graphics.getObject(this.undoData.objectId) ||
        graphics.getObject(Number(this.undoData.objectId)) ||
        (canvas &&
          canvas
            .getObjects()
            .find((item) => String(item.id || item.__fe_id) === String(this.undoData.objectId)));
    }

    if (target) {
      target.set('opacity', this.undoData.prevOpacity);
      canvas.renderAll();
    }

    return Promise.resolve();
  },
};

commandFactory.register(command);

export default command;
