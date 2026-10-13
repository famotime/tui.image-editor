import commandFactory from '@/factory/command';
import { commandNames, rejectMessages } from '@/consts';

const command = {
  name: commandNames.CROP_IMAGE_OBJECT,

  /**
   * Crop an image object
   * @param {Graphics} graphics - Graphics instance
   * @param {number} id - object id
   * @param {Object} rect - crop rect {left, top, width, height}
   * @param {string} croppedUrl - cropped image data URL
   * @returns {Promise}
   */
  execute(graphics, id, rect, croppedUrl) {
    const targetObj = graphics.getObject(id);
    if (!targetObj) {
      return Promise.reject(rejectMessages.noObject);
    }

    if (!this.isRedo) {
      const el = targetObj.getElement ? targetObj.getElement() : targetObj._element;
      let src = '';
      if (targetObj.toDataURL) {
        src = targetObj.toDataURL();
      } else if (el && el.src) {
        src = el.src;
      }

      this.undoData = {
        src,
        left: targetObj.left,
        top: targetObj.top,
        width: targetObj.width,
        height: targetObj.height,
        scaleX: targetObj.scaleX,
        scaleY: targetObj.scaleY,
        angle: targetObj.angle,
        flipX: targetObj.flipX,
        flipY: targetObj.flipY,
        rect,
        croppedUrl,
      };
    }

    return new Promise((resolve) => {
      const applyCrop = () => {
        targetObj.set({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          flipX: false,
          flipY: false,
        });
        targetObj.setCoords();
        graphics.getCanvas().renderAll();
        resolve(targetObj);
      };

      if (croppedUrl && targetObj.setSrc) {
        let isResolved = false;
        targetObj.setSrc(croppedUrl, () => {
          if (!isResolved) {
            isResolved = true;
            applyCrop();
          }
        });
        // 防御：在无 DOM/测试 mock 环境下 setSrc 回调未被调用时兜底
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            applyCrop();
          }
        }, 50);
      } else {
        applyCrop();
      }
    });
  },

  /**
   * Undo crop
   * @param {Graphics} graphics - Graphics instance
   * @param {number} id - object id
   * @returns {Promise}
   */
  undo(graphics, id) {
    const targetObj = graphics.getObject(id);
    if (!targetObj || !this.undoData) {
      return Promise.reject(rejectMessages.noObject);
    }

    const { undoData } = this;

    return new Promise((resolve) => {
      const restoreProps = () => {
        targetObj.set({
          left: undoData.left,
          top: undoData.top,
          width: undoData.width,
          height: undoData.height,
          scaleX: undoData.scaleX,
          scaleY: undoData.scaleY,
          angle: undoData.angle,
          flipX: undoData.flipX,
          flipY: undoData.flipY,
        });
        targetObj.setCoords();
        graphics.getCanvas().renderAll();
        resolve(targetObj);
      };

      if (undoData.src && targetObj.setSrc) {
        let isResolved = false;
        targetObj.setSrc(undoData.src, () => {
          if (!isResolved) {
            isResolved = true;
            restoreProps();
          }
        });
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            restoreProps();
          }
        }, 50);
      } else {
        restoreProps();
      }
    });
  },
};

commandFactory.register(command);

export default command;
