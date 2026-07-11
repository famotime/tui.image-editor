import Range from '@/ui/tools/range';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/mosaic';
import { assignmentForDestroy } from '@/util';
import { defaultMosaicSizeRangeValues, defaultMosaicBrushRangeValues } from '@/consts';

/**
 * Mosaic ui class
 * @class
 * @ignore
 */
class Mosaic extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'mosaic',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this._els = {
      mosaicTypeSelectButton: this.selector('.tie-mosaic-type-select-button'),
      mosaicSizeRange: new Range(
        {
          slider: this.selector('.tie-mosaic-size-range'),
          input: this.selector('.tie-mosaic-size-range-value'),
        },
        defaultMosaicSizeRangeValues
      ),
      mosaicBrushRange: new Range(
        {
          slider: this.selector('.tie-mosaic-brush-range'),
          input: this.selector('.tie-mosaic-brush-range-value'),
        },
        defaultMosaicBrushRangeValues
      ),
      brushPartition: this.selector('.tie-mosaic-brush-partition'),
      brushRangeWrap: this.selector('.tie-mosaic-brush-range-wrap'),
    };

    this.type = null;
    this.mosaicSize = this._els.mosaicSizeRange.value;
    this.brushWidth = this._els.mosaicBrushRange.value;
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    this._els.mosaicSizeRange.destroy();
    this._els.mosaicBrushRange.destroy();

    assignmentForDestroy(this);
  }

  /**
   * Add event for mosaic
   * @param {Object} actions - actions for mosaic
   */
  addEvent(actions) {
    this.eventHandler.changeMosaicType = this._changeMosaicTypeHandler.bind(this);
    this.actions = actions;

    this._els.mosaicTypeSelectButton.addEventListener('click', this.eventHandler.changeMosaicType);
    this._els.mosaicSizeRange.on('change', this._changeMosaicSize.bind(this));
    this._els.mosaicBrushRange.on('change', this._changeMosaicBrushWidth.bind(this));
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.mosaicTypeSelectButton.removeEventListener(
      'click',
      this.eventHandler.changeMosaicType
    );
    this._els.mosaicSizeRange.off();
    this._els.mosaicBrushRange.off();
  }

  /**
   * set mosaic mode - action runner
   */
  setMosaicMode() {
    this.actions.setMosaicMode(this.type, {
      size: this.mosaicSize,
      width: this.brushWidth,
    });
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.type = null;
    this.actions.stopDrawingMode();
    this.actions.changeSelectableAll(true);
    this._els.mosaicTypeSelectButton.classList.remove('rect');
    this._els.mosaicTypeSelectButton.classList.remove('brush');
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.actions.stopDrawingMode();
    this.actions.discardSelection();
    this.changeStandbyMode();

    // Default to box selection (rect)
    this._changeMosaicType('rect');
  }

  /**
   * Change mosaic type handler
   * @param {object} event - mosaic type select event
   * @private
   */
  _changeMosaicTypeHandler(event) {
    const button = event.target.closest('.tui-image-editor-button');
    if (button) {
      const mosaicType = this.getButtonType(button, ['rect', 'brush']);
      this.actions.discardSelection();

      if (this.type === mosaicType) {
        this.changeStandbyMode();

        return;
      }

      this._changeMosaicType(mosaicType);
    }
  }

  /**
   * Change mosaic type and update UI
   * @param {string} newType - new mosaic type
   * @private
   */
  _changeMosaicType(newType) {
    this.changeStandbyMode();
    this.type = newType;
    this._els.mosaicTypeSelectButton.classList.add(newType);

    // Show/hide brush elements depending on mode
    const isBrush = newType === 'brush';
    const displayValue = isBrush ? 'inline-block' : 'none';
    this._els.brushPartition.style.display = displayValue;
    this._els.brushRangeWrap.style.display = displayValue;

    if (newType === 'rect') {
      this.actions.changeSelectableAll(false);
    }

    this.setMosaicMode();
  }

  /**
   * Change mosaic size
   * @param {number} value - select mosaic range value
   * @private
   */
  _changeMosaicSize(value) {
    this.mosaicSize = value;
    if (!this.type) {
      this.changeStartMode();
    } else {
      this.actions.changeMosaicSize(this.type, value);
    }
  }

  /**
   * Change mosaic brush range
   * @param {number} value - select brush range value
   * @private
   */
  _changeMosaicBrushWidth(value) {
    this.brushWidth = value;
    if (this.type === 'brush') {
      this.actions.changeMosaicBrushWidth(value);
    }
  }
}

export default Mosaic;
