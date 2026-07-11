import Range from '@/ui/tools/range';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/eraser';
import { assignmentForDestroy } from '@/util';

const defaultEraserRangeValues = {
  min: 5,
  max: 150,
  value: 30,
};

/**
 * Eraser ui class
 * @class Eraser
 * @extends {Submenu}
 * @ignore
 */
class Eraser extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'eraser',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this._els = {
      eraserRange: new Range(
        {
          slider: this.selector('.tie-eraser-range'),
          input: this.selector('.tie-eraser-range-value'),
        },
        defaultEraserRangeValues
      ),
    };

    this.width = this._els.eraserRange.value;
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    this._els.eraserRange.destroy();
    assignmentForDestroy(this);
  }

  /**
   * Add event for eraser
   * @param {Object} actions - actions for eraser
   */
  addEvent(actions) {
    this.actions = actions;
    this._els.eraserRange.on('change', this._changeEraserRange.bind(this));
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.eraserRange.off();
  }

  /**
   * Set eraser mode
   */
  setEraserMode() {
    this.actions.setEraserMode(this.width);
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.actions.stopDrawingMode();
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.setEraserMode();
  }

  /**
   * Change eraser range
   * @param {number} value - range value
   * @private
   */
  _changeEraserRange(value) {
    this.width = value;
    this.actions.changeEraserWidth(value);
  }
}

export default Eraser;
