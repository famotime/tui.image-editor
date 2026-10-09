import commandFactory from '@/factory/command';
import { commandNames } from '@/consts';

const command = {
  name: commandNames.CHANGE_LAYER_ORDER,

  /**
   * Change layer order
   * @param {Graphics} graphics - Graphics instance
   * @param {number|string} objectId - Object id
   * @param {number} toIndex - Target z-index
   * @returns {Promise}
   */
  execute(graphics, objectId, toIndex) {
    const canvas = graphics.getCanvas();
    const object =
      graphics.getObject(objectId) ||
      graphics.getObject(Number(objectId)) ||
      (canvas &&
        canvas.getObjects().find((item) => String(item.id || item.__fe_id) === String(objectId)));

    if (!object) {
      return Promise.reject(new Error('Object not found'));
    }

    const fromIndex = canvas.getObjects().indexOf(object);
    if (fromIndex === -1) {
      return Promise.reject(new Error('Object not in canvas objects'));
    }

    canvas.moveTo(object, toIndex);
    canvas.renderAll();

    this.undoData = {
      objectId,
      fromIndex,
      toIndex,
    };

    return Promise.resolve({
      objectId,
      fromIndex,
      toIndex,
    });
  },

  /**
   * Undo layer order change
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const canvas = graphics.getCanvas();
    const object =
      graphics.getObject(this.undoData.objectId) ||
      graphics.getObject(Number(this.undoData.objectId)) ||
      (canvas &&
        canvas
          .getObjects()
          .find((item) => String(item.id || item.__fe_id) === String(this.undoData.objectId)));

    if (object) {
      canvas.moveTo(object, this.undoData.fromIndex);
      canvas.renderAll();
    }

    return Promise.resolve();
  },
};

commandFactory.register(command);

export default command;
