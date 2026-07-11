import { fabric } from 'fabric';
import 'fabric/src/mixins/eraser_brush.mixin';
import Component from '@/interface/component';
import { commandNames, componentNames } from '@/consts';

/**
 * Eraser component class
 * @class Eraser
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class Eraser extends Component {
  constructor(graphics) {
    super(componentNames.ERASER, graphics);

    this.width = 30; // 默认橡皮擦宽度
    this._erasableStates = null;
    this._eraserUndoData = null;
    this._listeners = {
      beforePathCreated: this._onBeforePathCreated.bind(this),
      erasingStart: this._onErasingStart.bind(this),
      erasingEnd: this._onErasingEnd.bind(this),
    };
  }

  /**
   * Start eraser mode
   * @param {{width: ?number}} [setting] - Brush width
   */
  start(setting = {}) {
    const canvas = this.getCanvas();
    this.width = setting.width || this.width;

    this._setOnlyPathsErasable();

    canvas.isDrawingMode = true;
    if (!(canvas.freeDrawingBrush instanceof fabric.EraserBrush)) {
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    }

    canvas.freeDrawingBrush.width = this.width;

    canvas.on('before:path:created', this._listeners.beforePathCreated);
    canvas.on('erasing:start', this._listeners.erasingStart);
    canvas.on('erasing:end', this._listeners.erasingEnd);
  }

  /**
   * End eraser mode
   */
  end() {
    const canvas = this.getCanvas();

    canvas.isDrawingMode = false;
    canvas.off('before:path:created', this._listeners.beforePathCreated);
    canvas.off('erasing:start', this._listeners.erasingStart);
    canvas.off('erasing:end', this._listeners.erasingEnd);
    this._restoreErasableStates();
  }

  /**
   * before:path:created event handler
   * @param {{path: fabric.Path}} fEvent - Fabric event object
   * @private
   */
  _onBeforePathCreated(fEvent) {
    fEvent.path._isEraserPath = true;
  }

  /**
   * erasing:start event handler
   * @private
   */
  _onErasingStart() {
    this._eraserUndoData = this.getCanvas()
      .getObjects()
      .reduce((undoData, obj) => {
        const id = this.graphics.getObjectId(obj);

        if (id !== null) {
          undoData[id] = obj.eraser ? fabric.util.object.clone(obj.eraser) : null;
        }

        return undoData;
      }, {});
  }

  /**
   * erasing:end event handler
   * @param {{targets: fabric.Object[]}} fEvent - Fabric event object
   * @private
   */
  _onErasingEnd(fEvent = {}) {
    const eraseData = (fEvent.targets || [])
      .map((obj) => {
        const id = this.graphics.getObjectId(obj);

        if (id === null) {
          return null;
        }

        return {
          id,
          oldEraser: this._eraserUndoData[id],
          newEraser: obj.eraser ? fabric.util.object.clone(obj.eraser) : null,
        };
      })
      .filter(Boolean);

    this._eraserUndoData = null;

    if (eraseData.length > 0) {
      this.getEditor().execute(commandNames.APPLY_ERASER, eraseData);
    }
  }

  /**
   * Make only drawing paths erasable while eraser mode is active
   * @private
   */
  _setOnlyPathsErasable() {
    this._restoreErasableStates();
    this._erasableStates = [];

    ['backgroundImage', 'overlayImage'].forEach((prop) => {
      const obj = this.getCanvas()[prop];

      if (obj) {
        this._erasableStates.push({
          obj,
          erasable: obj.erasable,
        });
        obj.erasable = false;
      }
    });

    this.getCanvas()
      .getObjects()
      .forEach((obj) => {
        this._erasableStates.push({
          obj,
          erasable: obj.erasable,
        });
        obj.erasable = obj.type === 'path' && !obj._isMosaicPath && !obj._isEraserPath;
      });
  }

  /**
   * Restore object erasable states
   * @private
   */
  _restoreErasableStates() {
    if (!this._erasableStates) {
      return;
    }

    this._erasableStates.forEach(({ obj, erasable }) => {
      obj.erasable = erasable;
    });
    this._erasableStates = null;
  }
}

export default Eraser;
