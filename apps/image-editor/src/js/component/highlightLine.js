import { fabric } from 'fabric';
import extend from 'tui-code-snippet/object/extend';
import Component from '@/interface/component';
import ArrowLine from '@/extension/arrowLine';
import { eventNames, componentNames, fObjectOptions } from '@/consts';

/**
 * Highlights
 * @class Highlights
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class HighlightLine extends Component {
  constructor(graphics) {
    super(componentNames.HIGHLIGHT_LINE, graphics);

    /**
     * Brush width
     * @type {number}
     * @private
     */
    this._width = 12;

    /**
     * fabric.Color instance for brush color
     * @type {fabric.Color}
     * @private
     */
    this._oColor = new fabric.Color('rgba(0, 0, 0, 0.5)');

    /**
     * Listeners
     * @type {object.<string, function>}
     * @private
     */
    this._listeners = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  /**
   * Start drawing Highlights mode
   * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
   */
  setHeadOption(setting) {
    const {
      arrowType = {
        head: null,
        tail: null,
      },
    } = setting;

    this._arrowType = arrowType;
  }

  /**
   * Start drawing Highlights mode
   * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
   */
  start(setting = {}) {
    const canvas = this.getCanvas();

    canvas.defaultCursor = 'pointer';
    canvas.selection = false;

    this.setHeadOption(setting);
    this.setBrush(setting);

    canvas.forEachObject((obj) => {
      obj.set({
        evented: false,
      });
    });

    canvas.on({
      'mouse:down': this._listeners.mousedown,
    });
  }

  /**
   * Set brush
   * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
   */
  setBrush(setting) {
    const brush = this.getCanvas().freeDrawingBrush;

    setting = setting || {};
    this._width = setting.width || this._width;

    if (setting.color) {
      this._oColor = new fabric.Color(setting.color);
    }
    brush.width = this._width;
    brush.color = this._oColor.toRgba();
  }

  /**
   * End drawing Highlights mode
   */
  end() {
    const canvas = this.getCanvas();

    canvas.defaultCursor = 'default';
    canvas.selection = true;

    canvas.forEachObject((obj) => {
      obj.set({
        evented: true,
      });
    });

    canvas.off('mouse:down', this._listeners.mousedown);
  }

  /**
   * Mousedown event handler in fabric canvas
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
   * @private
   */
  _onFabricMouseDown(fEvent) {
    const canvas = this.getCanvas();
    const { x, y } = canvas.getPointer(fEvent.e);
    const points = [x, y, x, y];

    this._highlightLine = new ArrowLine(points, {
      stroke: this._oColor.toRgba(),
      strokeWidth: this._width,
      arrowType: this._arrowType,
      evented: false,
    });
    if (this._highlightLine.type === 'line') {
      this._highlightLine.type = 'highlight-line';
    }
    this._highlightLine.set(fObjectOptions.SELECTION_STYLE);

    canvas.add(this._highlightLine);

    canvas.on({
      'mouse:move': this._listeners.mousemove,
      'mouse:up': this._listeners.mouseup,
    });

    this.fire(eventNames.ADD_OBJECT, this._createHighlightsEventObjectProperties());
  }

  /**
   * Mousemove event handler in fabric canvas
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
   * @private
   */
  _onFabricMouseMove(fEvent) {
    const canvas = this.getCanvas();
    const pointer = canvas.getPointer(fEvent.e);

    this._highlightLine.set({
      x2: pointer.x,
      y2: pointer.y,
    });

    this._highlightLine.setCoords();

    canvas.renderAll();
  }

  /**
   * Mouseup event handler in fabric canvas
   * @private
   */
  _onFabricMouseUp() {
    const canvas = this.getCanvas();

    const line = this._createHighlightsEventObjectProperties();
    if (line.width <= 0 && line.height <= 0) {
      canvas.remove(this._highlightLine);
    } else {
      this.fire(eventNames.OBJECT_ADDED, line);
    }

    this._highlightLine = null;

    canvas.off({
      'mouse:move': this._listeners.mousemove,
      'mouse:up': this._listeners.mouseup,
    });
  }

  /**
   * create Highlights event object properties
   * @returns {Object} properties Highlights object
   * @private
   */
  _createHighlightsEventObjectProperties() {
    const params = this.graphics.createObjectProperties(this._highlightLine);
    const { x1, x2, y1, y2 } = this._highlightLine;

    return extend({}, params, {
      startPosition: {
        x: x1,
        y: y1,
      },
      endPosition: {
        x: x2,
        y: y2,
      },
    });
  }
}

export default HighlightLine;
