import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/lasso';
import { assignmentForDestroy } from '@/util';

/**
 * Lasso ui class
 * @class Lasso
 * @extends {Submenu}
 * @ignore
 */
class Lasso extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'lasso',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this._els = {
      lassoSelectButton: this.selector('.tie-lasso-select-button'),
    };

    this.type = null; // 'rectangular' | 'freehand'
    this.selectedType = 'rectangular';
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    assignmentForDestroy(this);
  }

  /**
   * Add event for lasso
   * @param {Object} actions - actions for lasso
   *   @param {Function} actions.setLassoMode - set lasso mode
   *   @param {Function} actions.stopDrawingMode - stop drawing mode
   *   @param {Function} actions.discardSelection - discard selection
   */
  addEvent(actions) {
    this.eventHandler.changeLassoType = this._changeLassoType.bind(this);
    this.actions = actions;
    this._els.lassoSelectButton.addEventListener('click', this.eventHandler.changeLassoType);
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.lassoSelectButton.removeEventListener('click', this.eventHandler.changeLassoType);
  }

  /**
   * Set lasso mode
   */
  setLassoMode() {
    this.actions.setLassoMode(this.type);
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.type = null;
    this.actions.stopDrawingMode();
    this._els.lassoSelectButton.querySelectorAll('.tui-image-editor-button').forEach((btn) => {
      btn.classList.remove('active');
    });
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.type = this.actions.getLassoMode() || this.selectedType || 'rectangular';
    this._els.lassoSelectButton.querySelectorAll('.tui-image-editor-button').forEach((btn) => {
      btn.classList.remove('active');
    });
    const activeButton = this._els.lassoSelectButton.querySelector(
      `.${this.type} .tui-image-editor-button`
    );
    if (activeButton) {
      activeButton.classList.add('active');
    }
    this.setLassoMode();
  }

  /**
   * Change lasso type event
   * @param {object} event - lasso select event
   * @private
   */
  _changeLassoType(event) {
    const button = event.target.closest('.tui-image-editor-button');
    if (button) {
      const type = this.getButtonType(button, ['rectangular', 'freehand']);
      this.actions.discardSelection();

      const allButtons = this._els.lassoSelectButton.querySelectorAll('.tui-image-editor-button');
      allButtons.forEach((btn) => btn.classList.remove('active'));

      if (this.type === type) {
        return;
      }

      this.type = type;
      this.selectedType = type;
      button.classList.add('active');
      this.setLassoMode();
    }
  }
}

export default Lasso;
