import { fabric } from 'fabric';
import Component from '@/interface/component';
import { componentNames } from '@/consts';

/**
 * Lasso component class
 * @class Lasso
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class Lasso extends Component {
  constructor(graphics) {
    super(componentNames.LASSO, graphics);

    this._selectType = 'rectangular'; // 'rectangular' | 'freehand'
    this._startPoint = null;
    this._points = [];
    this._selectionHelper = null;

    this._listeners = {
      mousedown: this._onFabricMouseDown.bind(this),
      mousemove: this._onFabricMouseMove.bind(this),
      mouseup: this._onFabricMouseUp.bind(this),
    };
  }

  /**
   * Start lasso mode
   * @param {{selectType: ?string}} [options] - select type ('rectangular' | 'freehand')
   */
  start(options = {}) {
    const canvas = this.getCanvas();
    if (options.selectType) {
      this._selectType = options.selectType;
    }

    canvas.defaultCursor = 'crosshair';
    canvas.selection = false;

    // 让除背景图外的所有元素都变得可交互且可选择，这样可以移动、缩放已选择的元素
    canvas.forEachObject((obj) => {
      if (obj !== canvas.backgroundImage) {
        obj.set({
          selectable: true,
          evented: true,
        });
      }
    });

    canvas.on({
      'mouse:down': this._listeners.mousedown,
    });
  }

  /**
   * End lasso mode
   */
  end() {
    const canvas = this.getCanvas();

    canvas.defaultCursor = 'default';
    canvas.selection = true;

    canvas.off('mouse:down', this._listeners.mousedown);
    canvas.off('mouse:move', this._listeners.mousemove);
    canvas.off('mouse:up', this._listeners.mouseup);

    if (this._selectionHelper) {
      canvas.remove(this._selectionHelper);
      this._selectionHelper = null;
    }
  }

  /**
   * mouse:down event handler
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
   * @private
   */
  _onFabricMouseDown(fEvent) {
    const canvas = this.getCanvas();

    // 如果点中了一个已有对象（或者是当前的 activeSelection 缩放手柄），说明是要移动、旋转或缩放，不需要开启套索框选
    if (fEvent.target) {
      return;
    }

    // 在空白处点击，清除当前的选中对象
    canvas.discardActiveObject();

    const { x, y } = canvas.getPointer(fEvent.e);
    this._startPoint = { x, y };
    this._points = [{ x, y }];

    if (this._selectType === 'rectangular') {
      this._selectionHelper = new fabric.Rect({
        left: x,
        top: y,
        width: 0,
        height: 0,
        fill: 'rgba(0, 162, 232, 0.15)',
        stroke: 'rgba(0, 162, 232, 0.6)',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
    } else {
      this._selectionHelper = new fabric.Polyline(this._points, {
        fill: 'rgba(0, 162, 232, 0.15)',
        stroke: 'rgba(0, 162, 232, 0.6)',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
    }

    canvas.add(this._selectionHelper);

    canvas.on({
      'mouse:move': this._listeners.mousemove,
      'mouse:up': this._listeners.mouseup,
    });
  }

  /**
   * mouse:move event handler
   * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
   * @private
   */
  _onFabricMouseMove(fEvent) {
    const canvas = this.getCanvas();
    const { x, y } = canvas.getPointer(fEvent.e);

    if (this._selectType === 'rectangular') {
      const left = Math.min(this._startPoint.x, x);
      const top = Math.min(this._startPoint.y, y);
      const width = Math.abs(this._startPoint.x - x);
      const height = Math.abs(this._startPoint.y - y);

      this._selectionHelper.set({ left, top, width, height });
    } else {
      this._points.push({ x, y });
      this._selectionHelper.set({ points: this._points });
    }

    canvas.renderAll();
  }

  /**
   * mouse:up event handler
   * @private
   */
  _onFabricMouseUp() {
    const canvas = this.getCanvas();

    canvas.off({
      'mouse:move': this._listeners.mousemove,
      'mouse:up': this._listeners.mouseup,
    });

    if (!this._selectionHelper) {
      return;
    }

    const selectedObjects = [];
    const allObjects = canvas.getObjects();

    let polygon = [];
    if (this._selectType === 'rectangular') {
      const { left, top, width, height } = this._selectionHelper;
      const right = left + width;
      const bottom = top + height;
      polygon = [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
      ];
    } else {
      polygon = this._points;
    }

    if (polygon.length >= 3) {
      allObjects.forEach((obj) => {
        // 过滤掉背景图和我们自己的临时辅助图形
        if (obj === canvas.backgroundImage || obj === this._selectionHelper) {
          return;
        }
        // 只有 selectable !== false 的对象可被选中
        if (obj.selectable === false) {
          return;
        }

        // 判定对象的中心点是否在多边形内部
        const center = obj.getCenterPoint();
        if (this._isPointInPolygon(center, polygon)) {
          selectedObjects.push(obj);
        }
      });
    }

    canvas.remove(this._selectionHelper);
    this._selectionHelper = null;

    if (selectedObjects.length > 0) {
      if (selectedObjects.length === 1) {
        canvas.setActiveObject(selectedObjects[0]);
      } else {
        const activeSelection = new fabric.ActiveSelection(selectedObjects, {
          canvas,
        });
        canvas.setActiveObject(activeSelection);
      }
    } else {
      canvas.discardActiveObject();
    }

    canvas.requestRenderAll();
  }

  /**
   * Ray-casting algorithm to determine if a point is inside a polygon
   * @param {{x: number, y: number}} point - Target point
   * @param {Array.<{x: number, y: number}>} polygon - Polygon vertices
   * @returns {boolean} - true if the point is inside the polygon
   * @private
   */
  _isPointInPolygon(point, polygon) {
    const { x, y } = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Get current select type
   * @returns {string} - select type
   */
  getSelectType() {
    return this._selectType;
  }

  /**
   * Set current select type
   * @param {string} selectType - select type
   */
  setSelectType(selectType) {
    this._selectType = selectType;
  }
}

export default Lasso;
