import commandFactory from '@/factory/command';
import { commandNames } from '@/consts';
import 'fabric/src/mixins/eraser_brush.mixin';

const command = {
  name: commandNames.APPLY_ERASER,

  /**
   * Apply eraser on paths
   * @param {Graphics} graphics - Graphics instance
   * @param {Array.<{id: number, oldEraser: Object, newEraser: Object}>} eraseData - objects info
   * @returns {Promise}
   */
  execute(graphics, eraseData) {
    this.undoData.eraseData = eraseData.map((item) => ({
      id: item.id,
      eraser: item.oldEraser,
    }));

    eraseData.forEach((item) => {
      const obj = graphics.getObject(item.id);
      if (obj) {
        obj.set({
          eraser: item.newEraser,
          dirty: true,
        });
      }
    });
    graphics.getCanvas().requestRenderAll();

    return Promise.resolve();
  },

  /**
   * Undo apply eraser
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const { eraseData } = this.undoData;
    eraseData.forEach((item) => {
      const obj = graphics.getObject(item.id);
      if (obj) {
        obj.set({
          eraser: item.eraser,
          dirty: true,
        });
      }
    });
    graphics.getCanvas().requestRenderAll();

    return Promise.resolve();
  },
};

commandFactory.register(command);

export default command;
