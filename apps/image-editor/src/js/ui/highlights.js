import Colorpicker from '@/ui/tools/colorpicker';
import Range from '@/ui/tools/range';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/highlights';
import { assignmentForDestroy, getRgb } from '@/util';
import { defaultHighlightsRangeValues, eventNames, selectorNames } from '@/consts';

const HIGHLIGHTS_OPACITY = 0.35;

/**
 * Highlights ui class
 * @class
 * @ignore
 */
class Highlights extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'highlights',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this._els = {
      lineSelectButton: this.selector('.tie-highlights-line-select-button'),
      highlightsColorPicker: new Colorpicker(this.selector('.tie-highlights-color'), {
        defaultColor: '#00a9ff',
        toggleDirection: this.toggleDirection,
        usageStatistics: this.usageStatistics,
      }),
      highlightsRange: new Range(
        {
          slider: this.selector('.tie-highlights-range'),
          input: this.selector('.tie-highlights-range-value'),
        },
        defaultHighlightsRangeValues
      ),
    };

    this.type = null;
    this.color = this._els.highlightsColorPicker.color;
    this.width = this._els.highlightsRange.value;

    this.colorPickerInputBox = this._els.highlightsColorPicker.colorpickerElement.querySelector(
      selectorNames.COLOR_PICKER_INPUT_BOX
    );
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    this._els.highlightsColorPicker.destroy();
    this._els.highlightsRange.destroy();

    assignmentForDestroy(this);
  }

  /**
   * Add event for Highlights
   * @param {Object} actions - actions for crop
   *   @param {Function} actions.setHighlightsMode - set Highlights mode
   */
  addEvent(actions) {
    this.eventHandler.changeHighlightsType = this._changeHighlightsType.bind(this);

    this.actions = actions;
    this._els.lineSelectButton.addEventListener('click', this.eventHandler.changeHighlightsType);
    this._els.highlightsColorPicker.on('change', this._changeHighlightsColor.bind(this));
    this._els.highlightsRange.on('change', this._changeHighlightsRange.bind(this));

    this.colorPickerInputBox.addEventListener(
      eventNames.FOCUS,
      this._onStartEditingInputBox.bind(this)
    );
    this.colorPickerInputBox.addEventListener(
      eventNames.BLUR,
      this._onStopEditingInputBox.bind(this)
    );
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.lineSelectButton.removeEventListener('click', this.eventHandler.changeHighlightsType);
    this._els.highlightsColorPicker.off();
    this._els.highlightsRange.off();

    this.colorPickerInputBox.removeEventListener(
      eventNames.FOCUS,
      this._onStartEditingInputBox.bind(this)
    );
    this.colorPickerInputBox.removeEventListener(
      eventNames.BLUR,
      this._onStopEditingInputBox.bind(this)
    );
  }

  /**
   * set Highlights mode - action runner
   */
  setDrawMode() {
    this.actions.setHighlightsMode(this.type, {
      width: this.width,
      color: getRgb(this.color, HIGHLIGHTS_OPACITY),
    });
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.type = null;
    this.actions.stopDrawingMode();
    this.actions.changeSelectableAll(true);
    this._els.lineSelectButton.classList.remove('free');
    this._els.lineSelectButton.classList.remove('line');
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.type = 'highlight-draw';
    this._els.lineSelectButton.classList.add('free');
    this.setDrawMode();
  }

  /**
   * Change Highlights type event
   * @param {object} event - line select event
   * @private
   */
  _changeHighlightsType(event) {
    const button = event.target.closest('.tui-image-editor-button');
    if (button) {
      const highlightType = this.getButtonType(button, ['free', 'line']);
      this.actions.discardSelection();
      let lineType = '';
      if (highlightType === 'free') lineType = 'highlight-drawing';
      if (highlightType === 'line') lineType = 'highlight-line';

      if (this.type === lineType) {
        this.changeStandbyMode();

        return;
      }

      this.changeStandbyMode();
      this.type = lineType;
      this._els.lineSelectButton.classList.add(lineType);
      this.setDrawMode();
    }
  }

  _setHighlightsType() {
    this.actions.discardSelection();
    this.changeStandbyMode();
    this.type = 'highlight-line';
    this._els.lineSelectButton.classList.add('highlight-line');
    this.setDrawMode();
  }

  /**
   * Change Highlightsing color
   * @param {string} color - select Highlightsing color
   * @private
   */
  _changeHighlightsColor(color) {
    this.color = color || 'transparent';
    if (!this.type) {
      this.changeStartMode();
    } else {
      this.setDrawMode();
    }
  }

  /**
   * Change Highlightsing Range
   * @param {number} value - select Highlightsing range
   * @private
   */
  _changeHighlightsRange(value) {
    this.width = value;
    if (!this.type) {
      this.changeStartMode();
    } else {
      this.setDrawMode();
    }
  }
}

export default Highlights;
