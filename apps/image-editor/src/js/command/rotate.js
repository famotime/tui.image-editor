import commandFactory from '@/factory/command';
import { componentNames, commandNames } from '@/consts';

const { ROTATION } = componentNames;

/**
 * Cached data for undo
 * @type {Object}
 */
let cachedUndoDataForSilent = null;

/**
 * Make undo data
 * @param {Component} rotationComp - rotation component
 * @returns {object} - undodata
 */
function makeUndoData(rotationComp) {
  const target = rotationComp._getTarget ? rotationComp._getTarget() : null;

  return {
    angle: rotationComp.getCurrentAngle(target ? target.id : null),
    targetId: target ? target.id : null,
  };
}

const command = {
  name: commandNames.ROTATE_IMAGE,

  /**
   * Rotate an image
   * @param {Graphics} graphics - Graphics instance
   * @param {string} type - 'rotate' or 'setAngle'
   * @param {number} angle - angle value (degree)
   * @param {boolean} isSilent - is silent execution or not
   * @returns {Promise}
   */
  execute(graphics, type, angle, isSilent) {
    const rotationComp = graphics.getComponent(ROTATION);

    if (!this.isRedo) {
      const undoData = makeUndoData(rotationComp);

      cachedUndoDataForSilent = this.setUndoData(undoData, cachedUndoDataForSilent, isSilent);
    }

    const targetId = this.undoData ? this.undoData.targetId : null;

    return rotationComp[type](angle, targetId);
  },

  /**
   * @param {Graphics} graphics - Graphics instance
   * @returns {Promise}
   */
  undo(graphics) {
    const rotationComp = graphics.getComponent(ROTATION);
    const [, type, angle] = this.args;
    const targetId = this.undoData ? this.undoData.targetId : null;

    if (type === 'setAngle') {
      return rotationComp[type](this.undoData.angle, targetId);
    }

    return rotationComp.rotate(-angle, targetId);
  },
};

commandFactory.register(command);

export default command;
