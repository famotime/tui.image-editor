import { fabric } from 'fabric';
import Component from '@/interface/component';
import { componentNames } from '@/consts';

/**
 * Image Rotation component
 * @class Rotation
 * @extends {Component}
 * @param {Graphics} graphics - Graphics instance
 * @ignore
 */
class Rotation extends Component {
  constructor(graphics) {
    super(componentNames.ROTATION, graphics);
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
   * Get current angle
   * @param {number} [targetId] - target object id
   * @returns {Number}
   */
  getCurrentAngle(targetId) {
    const target = this._getTarget(targetId);
    if (target) {
      return target.angle || 0;
    }

    const canvasImage = this.getCanvasImage();

    return canvasImage ? canvasImage.angle : 0;
  }

  /**
   * Set angle of the image
   *
   *  Do not call "this.setImageProperties" for setting angle directly.
   *  Before setting angle, The originX,Y of image should be set to center.
   *      See "http://fabricjs.com/docs/fabric.Object.html#setAngle"
   *
   * @param {number} angle - Angle value
   * @param {number} [targetId] - target object id
   * @returns {Promise}
   */
  setAngle(angle, targetId) {
    const target = this._getTarget(targetId);
    if (target) {
      angle %= 360;
      target.set({ angle }).setCoords();
      this.getCanvas().renderAll();

      return Promise.resolve(angle);
    }

    const oldAngle = this.getCurrentAngle() % 360; // The angle is lower than 2*PI(===360 degrees)

    angle %= 360;

    const canvasImage = this.getCanvasImage();
    const oldImageCenter = canvasImage.getCenterPoint();
    canvasImage.set({ angle }).setCoords();
    this.adjustCanvasDimension();
    const newImageCenter = canvasImage.getCenterPoint();
    this._rotateForEachObject(oldImageCenter, newImageCenter, angle - oldAngle);

    return Promise.resolve(angle);
  }

  /**
   * Rotate for each object
   * @param {fabric.Point} oldImageCenter - Image center point before rotation
   * @param {fabric.Point} newImageCenter - Image center point after rotation
   * @param {number} angleDiff - Image angle difference after rotation
   * @private
   */
  _rotateForEachObject(oldImageCenter, newImageCenter, angleDiff) {
    const canvas = this.getCanvas();
    const centerDiff = {
      x: oldImageCenter.x - newImageCenter.x,
      y: oldImageCenter.y - newImageCenter.y,
    };

    canvas.forEachObject((obj) => {
      const objCenter = obj.getCenterPoint();
      const radian = fabric.util.degreesToRadians(angleDiff);
      const newObjCenter = fabric.util.rotatePoint(objCenter, oldImageCenter, radian);

      obj.set({
        left: newObjCenter.x - centerDiff.x,
        top: newObjCenter.y - centerDiff.y,
        angle: (obj.angle + angleDiff) % 360,
      });
      obj.setCoords();
    });
    canvas.renderAll();
  }

  /**
   * Rotate the image
   * @param {number} additionalAngle - Additional angle
   * @param {number} [targetId] - target object id
   * @returns {Promise}
   */
  rotate(additionalAngle, targetId) {
    const current = this.getCurrentAngle(targetId);

    return this.setAngle(current + additionalAngle, targetId);
  }
}

export default Rotation;
