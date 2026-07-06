import { fabric } from 'fabric';
import Component from '@/interface/component';
import { componentNames, eventNames as events } from '@/consts';

/**
 * Annotation component
 * @class Annotation
 * @extends {Component}
 * @ignore
 */
class Annotation extends Component {
  constructor(graphics) {
    super(componentNames.ANNOTATION, graphics);

    this._step = 1;
    this._shape = 'circle'; // circle, rect, triangle
    this._color = '#ff4d4f';
    this._textColor = '#ffffff';
    this._fontSize = 20;

    this._listeners = {
      mousedown: this._onMouseDown.bind(this),
      mouseup: this._onMouseUp.bind(this),
      moving: this._onObjectMoving.bind(this),
      cleared: this._onSelectionCleared.bind(this),
    };

    this._startX = 0;
    this._startY = 0;
    this._isMouseDown = false;
    this._lastClearedTime = 0;
  }

  /**
   * Set next step value
   * @param {number} step - next step
   */
  setStep(step) {
    this._step = Math.max(1, parseInt(step, 10) || 1);
  }

  /**
   * Get current step
   * @returns {number} step
   */
  getStep() {
    return this._step;
  }

  /**
   * Set shape type
   * @param {string} shape - circle, rect, triangle
   */
  setShape(shape) {
    this._shape = shape;
  }

  /**
   * Set background fill color
   * @param {string} color - HEX color
   */
  setColor(color) {
    this._color = color;
  }

  /**
   * Set text color
   * @param {string} textColor - HEX color
   */
  setTextColor(textColor) {
    this._textColor = textColor;
  }

  /**
   * Set step font size
   * @param {number} fontSize - font size
   */
  setFontSize(fontSize) {
    this._fontSize = parseInt(fontSize, 10) || 20;
  }

  /**
   * Start drawing mode
   */
  start() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'move';

    canvas.on({
      'selection:cleared': this._listeners.cleared,
      'mouse:down': this._listeners.mousedown,
      'mouse:up': this._listeners.mouseup,
      'object:moving': this._listeners.moving,
    });

    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  /**
   * End drawing mode
   */
  end() {
    const canvas = this.getCanvas();
    if (!canvas) return;

    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'default';

    canvas.off({
      'selection:cleared': this._listeners.cleared,
      'mouse:down': this._listeners.mousedown,
      'mouse:up': this._listeners.mouseup,
      'object:moving': this._listeners.moving,
    });
  }

  _onSelectionCleared() {
    this._lastClearedTime = Date.now();
  }

  _onMouseDown(options) {
    this._isMouseDown = true;
    const canvas = this.getCanvas();
    const pointer = canvas.getPointer(options.e);
    this._startX = pointer.x;
    this._startY = pointer.y;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.lastLeft = activeObject.left;
      activeObject.lastTop = activeObject.top;
      if (activeObject.relatedObj) {
        activeObject.relatedObj.lastLeft = activeObject.relatedObj.left;
        activeObject.relatedObj.lastTop = activeObject.relatedObj.top;
      }
    }
  }

  _onMouseUp(options) {
    if (!this._isMouseDown) return;
    this._isMouseDown = false;

    const canvas = this.getCanvas();
    const pointer = canvas.getPointer(options.e);
    const endX = pointer.x;
    const endY = pointer.y;

    const dist = Math.sqrt((endX - this._startX) ** 2 + (endY - this._startY) ** 2);
    const hasJustCleared = Date.now() - this._lastClearedTime < 300;

    if (options.target || dist > 5 || hasJustCleared) {
      return;
    }

    this.addAnnotationAt(endX, endY);
  }

  _onObjectMoving(e) {
    const activeObject = e.target;
    if (!activeObject) return;

    if (activeObject.relatedObj) {
      const related = activeObject.relatedObj;
      if (
        typeof activeObject.lastLeft !== 'undefined' &&
        typeof activeObject.lastTop !== 'undefined'
      ) {
        const dx = activeObject.left - activeObject.lastLeft;
        const dy = activeObject.top - activeObject.lastTop;
        related.set({
          left: related.left + dx,
          top: related.top + dy,
        });
        related.setCoords();
      }
    }
    activeObject.lastLeft = activeObject.left;
    activeObject.lastTop = activeObject.top;
  }

  /**
   * Add background shape and text step annotation
   * @param {number} x - x coordinate
   * @param {number} y - y coordinate
   */
  // eslint-disable-next-line complexity
  addAnnotationAt(x, y) {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const currentStep = this._step;
    this._step += 1;

    // Fire event to update UI step value
    this.fire('annotationStepChanged', this._step);

    const fontSize = this._fontSize;
    let shapeSize = fontSize * 1.5;
    if (this._shape === 'triangle') {
      shapeSize = fontSize * 1.8;
    } else if (this._shape === 'rect') {
      shapeSize = fontSize * 1.4;
    }

    let shapeObj = null;
    const shapeOptions = {
      fill: this._color,
      originX: 'center',
      originY: 'center',
      left: x,
      top: y,
    };

    if (this._shape === 'circle') {
      shapeObj = new fabric.Circle(
        Object.assign(shapeOptions, {
          radius: shapeSize / 2,
        })
      );
    } else if (this._shape === 'rect') {
      shapeObj = new fabric.Rect(
        Object.assign(shapeOptions, {
          width: shapeSize,
          height: shapeSize,
          rx: 3,
          ry: 3,
        })
      );
    } else if (this._shape === 'triangle') {
      shapeObj = new fabric.Triangle(
        Object.assign(shapeOptions, {
          width: shapeSize,
          height: shapeSize,
        })
      );
    }

    let textOffsetY = 0;
    if (this._shape === 'circle' || this._shape === 'rect') {
      textOffsetY = -fontSize * 0.05;
    } else if (this._shape === 'triangle') {
      textOffsetY = fontSize * 0.12;
    }

    const textObj = new fabric.Text(String(currentStep), {
      fill: this._textColor,
      fontSize,
      fontWeight: 'bold',
      fontFamily: 'Noto Sans, sans-serif',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      left: x,
      top: y + textOffsetY,
    });

    const setHandleStyle = (obj) => {
      obj.set({
        cornerSize: 8,
        borderScaleFactor: 1,
        borderColor: '#007aff',
        cornerColor: '#007aff',
        cornerStrokeColor: '#ffffff',
        transparentCorners: false,
        hasRotatingPoint: false,
      });
    };

    setHandleStyle(shapeObj);
    setHandleStyle(textObj);

    shapeObj.relatedObj = textObj;
    textObj.relatedObj = shapeObj;

    // Add to canvas
    this.graphics.add(shapeObj);
    this.graphics.add(textObj);

    // Save commands in undo stack
    this.fire(events.ADD_OBJECT, this.graphics.createObjectProperties(shapeObj));
    this.fire(events.ADD_OBJECT, this.graphics.createObjectProperties(textObj));

    canvas.discardActiveObject();
    canvas.renderAll();

    setTimeout(() => {
      canvas.discardActiveObject();
      canvas.renderAll();
    }, 50);
  }
}

export default Annotation;
