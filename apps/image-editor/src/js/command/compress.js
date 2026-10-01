import commandFactory from '@/factory/command';
import { componentNames, commandNames } from '@/consts';

const { COMPRESS } = componentNames;

const command = {
  name: commandNames.COMPRESS_IMAGE,

  /**
   * Compress image command
   * @param {Graphics} graphics - Graphics instance
   * @param {Object} [options] - Compress options
   * @returns {Promise}
   */
  execute(graphics, options) {
    const compressComp = graphics.getComponent(COMPRESS);

    return compressComp.apply(options).then((result) => {
      this.undoData = {
        prevUrl: result.prevUrl,
        newUrl: result.newUrl,
        prevSize: result.prevSize,
      };

      return result;
    });
  },

  /**
   * Undo compress image
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const compressComp = graphics.getComponent(COMPRESS);

    return compressComp.restore(this.undoData);
  },
};

commandFactory.register(command);

export default command;
