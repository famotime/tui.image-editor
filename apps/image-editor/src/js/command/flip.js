import commandFactory from '@/factory/command';
import { componentNames, commandNames } from '@/consts';

const { FLIP } = componentNames;

const command = {
  name: commandNames.FLIP_IMAGE,

  /**
   * flip an image
   * @param {Graphics} graphics - Graphics instance
   * @param {string} type - 'flipX' or 'flipY' or 'reset'
   * @returns {Promise}
   */
  execute(graphics, type) {
    const flipComp = graphics.getComponent(FLIP);

    if (!this.isRedo) {
      this.undoData.setting = flipComp.getCurrentSetting();
    }

    const targetId = this.undoData && this.undoData.setting ? this.undoData.setting.targetId : null;

    return flipComp[type](targetId);
  },

  /**
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const flipComp = graphics.getComponent(FLIP);

    return flipComp.set(this.undoData.setting);
  },
};

commandFactory.register(command);

export default command;
