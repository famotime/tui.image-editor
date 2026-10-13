import extend from 'tui-code-snippet/object/extend';
import Component from '@/interface/component';
import { componentNames, rejectMessages } from '@/consts';

/**
 * Flip
 * @class Flip
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class Flip extends Component {
  constructor(graphics) {
    super(componentNames.FLIP, graphics);
  }

  /**
   * Get target image object (layer object if active, otherwise null for background)
   * @param {number} [targetId] - target object id
   * @returns {fabric.Image|null}
   * @private
   */
  _getTarget(targetId) {
    if (typeof targetId !== 'undefined' && targetId !== null) {
      return this.graphics ? this.graphics.getObject(targetId) : null;
    }
    const canvas = this.getCanvas();
    const activeObject = canvas ? canvas.getActiveObject() : null;
    const canvasImage = this.getCanvasImage();
    if (activeObject && activeObject.type === 'image' && activeObject !== canvasImage) {
      return activeObject;
    }

    return null;
  }

  /**
   * Get current flip settings
   * @param {number} [targetId] - target object id
   * @returns {{flipX: Boolean, flipY: Boolean, targetId?: number|null}}
   */
  getCurrentSetting(targetId) {
    const target = this._getTarget(targetId);
    if (target) {
      return {
        flipX: !!target.flipX,
        flipY: !!target.flipY,
        targetId: target.id,
      };
    }

    const canvasImage = this.getCanvasImage();

    return {
      flipX: canvasImage ? !!canvasImage.flipX : false,
      flipY: canvasImage ? !!canvasImage.flipY : false,
    };
  }

  /**
   * Set flipX, flipY
   * @param {{flipX: Boolean, flipY: Boolean, targetId?: number|null}} newSetting - Flip setting
   * @returns {Promise}
   */
  set(newSetting) {
    const target = this._getTarget(newSetting.targetId);
    if (target) {
      const isChangingFlipX = !!target.flipX !== !!newSetting.flipX;
      const isChangingFlipY = !!target.flipY !== !!newSetting.flipY;

      if (!isChangingFlipX && !isChangingFlipY) {
        return Promise.reject(rejectMessages.flip);
      }

      target.set({
        flipX: newSetting.flipX,
        flipY: newSetting.flipY,
      });
      target.setCoords();
      this.getCanvas().renderAll();

      return Promise.resolve({
        flipX: target.flipX,
        flipY: target.flipY,
        angle: target.angle,
      });
    }

    const setting = this.getCurrentSetting();
    const isChangingFlipX = setting.flipX !== newSetting.flipX;
    const isChangingFlipY = setting.flipY !== newSetting.flipY;

    if (!isChangingFlipX && !isChangingFlipY) {
      return Promise.reject(rejectMessages.flip);
    }

    extend(setting, newSetting);
    this.setImageProperties(setting, true);
    this._invertAngle(isChangingFlipX, isChangingFlipY);
    this._flipObjects(isChangingFlipX, isChangingFlipY);

    return Promise.resolve({
      flipX: setting.flipX,
      flipY: setting.flipY,
      angle: this.getCanvasImage().angle,
    });
  }

  /**
   * Invert image angle for flip
   * @param {boolean} isChangingFlipX - Change flipX
   * @param {boolean} isChangingFlipY - Change flipY
   */
  _invertAngle(isChangingFlipX, isChangingFlipY) {
    const canvasImage = this.getCanvasImage();
    let { angle } = canvasImage;

    if (isChangingFlipX) {
      angle *= -1;
    }
    if (isChangingFlipY) {
      angle *= -1;
    }
    canvasImage.rotate(parseFloat(angle)).setCoords(); // parseFloat for -0 to 0
  }

  /**
   * Flip objects
   * @param {boolean} isChangingFlipX - Change flipX
   * @param {boolean} isChangingFlipY - Change flipY
   * @private
   */
  _flipObjects(isChangingFlipX, isChangingFlipY) {
    const canvas = this.getCanvas();

    if (isChangingFlipX) {
      canvas.forEachObject((obj) => {
        obj
          .set({
            angle: parseFloat(obj.angle * -1), // parseFloat for -0 to 0
            flipX: !obj.flipX,
            left: canvas.width - obj.left,
          })
          .setCoords();
      });
    }
    if (isChangingFlipY) {
      canvas.forEachObject((obj) => {
        obj
          .set({
            angle: parseFloat(obj.angle * -1), // parseFloat for -0 to 0
            flipY: !obj.flipY,
            top: canvas.height - obj.top,
          })
          .setCoords();
      });
    }
    canvas.renderAll();
  }

  /**
   * Reset flip settings
   * @returns {Promise}
   */
  reset() {
    const current = this.getCurrentSetting();

    return this.set({
      flipX: false,
      flipY: false,
      targetId: current.targetId,
    });
  }

  /**
   * Flip x
   * @returns {Promise}
   */
  flipX() {
    const current = this.getCurrentSetting();

    return this.set({
      flipX: !current.flipX,
      flipY: current.flipY,
      targetId: current.targetId,
    });
  }

  /**
   * Flip y
   * @returns {Promise}
   */
  flipY() {
    const current = this.getCurrentSetting();

    return this.set({
      flipX: current.flipX,
      flipY: !current.flipY,
      targetId: current.targetId,
    });
  }
}

export default Flip;
