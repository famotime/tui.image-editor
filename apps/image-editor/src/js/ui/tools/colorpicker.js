import forEach from 'tui-code-snippet/collection/forEach';
import CustomEvents from 'tui-code-snippet/customEvents/customEvents';
import tuiColorPicker from 'tui-color-picker';

const PICKER_COLOR = [
  '#000000',
  '#2a2a2a',
  '#545454',
  '#7e7e7e',
  '#a8a8a8',
  '#d2d2d2',
  '#ffffff',
  '',
  '#ff4040',
  '#ff6518',
  '#ffbb3b',
  '#03bd9e',
  '#00a9ff',
  '#515ce6',
  '#9e5fff',
  '#ff5583',
];

/**
 * Colorpicker control class
 * @class
 * @ignore
 */
class Colorpicker {
  constructor(
    colorpickerElement,
    { defaultColor = '#7e7e7e', toggleDirection = 'down', usageStatistics } = {}
  ) {
    this.colorpickerElement = colorpickerElement;
    this.usageStatistics = usageStatistics;

    this._show = false;

    this._colorpickerElement = colorpickerElement;
    this._toggleDirection = toggleDirection;
    this._makePickerButtonElement(defaultColor);
    this._makePickerLayerElement(colorpickerElement, colorpickerElement.getAttribute('title'));
    this._color = defaultColor;

    // Create hidden native color input for eyedropper & spectrum
    this._hiddenColorInput = document.createElement('input');
    this._hiddenColorInput.type = 'color';
    this._hiddenColorInput.style.position = 'absolute';
    this._hiddenColorInput.style.width = '0';
    this._hiddenColorInput.style.height = '0';
    this._hiddenColorInput.style.opacity = '0';
    this._hiddenColorInput.style.pointerEvents = 'none';
    this.colorpickerElement.appendChild(this._hiddenColorInput);

    const handleNativeColorChange = (e) => {
      const { value } = e.target;
      if (this._color !== value) {
        this.color = value;
        this.picker.setColor(value);
        this.fire('change', value);
      }
    };
    this._hiddenColorInput.addEventListener('input', handleNativeColorChange);
    this._hiddenColorInput.addEventListener('change', handleNativeColorChange);

    this.picker = tuiColorPicker.create({
      container: this.pickerElement,
      preset: PICKER_COLOR,
      color: defaultColor,
      usageStatistics: this.usageStatistics,
    });

    this._makeCustomColorButton();
    this._addEvent();
  }

  /**
   * Make custom color palette trigger button in hex input bar
   * @private
   */
  _makeCustomColorButton() {
    const hexInput = this.pickerElement.querySelector(
      '.tui-colorpicker-palette-container .tui-colorpicker-palette-hex'
    );
    const inputBar = hexInput ? hexInput.parentElement : null;
    if (!inputBar || inputBar.querySelector('.tie-colorpicker-custom-btn')) {
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tie-colorpicker-custom-btn';
    btn.title = '调色板自选色';
    btn.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="13.5" cy="6.5" r="1" fill="currentColor"/>' +
      '<circle cx="17.5" cy="10.5" r="1" fill="currentColor"/>' +
      '<circle cx="8.5" cy="7.5" r="1" fill="currentColor"/>' +
      '<circle cx="6.5" cy="12.5" r="1" fill="currentColor"/>' +
      '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.66 1.5-1.5 0-.39-.15-.74-.39-1.04-.24-.3-.39-.65-.39-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-9.92-10-9.92z"/>' +
      '</svg>';

    this._onCustomBtnClick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      const validHex =
        this._color && /^#[0-9a-fA-F]{6}$/.test(this._color) ? this._color : '#00a9ff';
      this._hiddenColorInput.value = validHex;
      this._hiddenColorInput.click();
    };

    btn.addEventListener('click', this._onCustomBtnClick);
    inputBar.appendChild(btn);
    this._customColorButton = btn;
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    if (this._customColorButton && this._onCustomBtnClick) {
      this._customColorButton.removeEventListener('click', this._onCustomBtnClick);
    }
    this.picker.destroy();
    this.colorpickerElement.innerHTML = '';
    forEach(this, (value, key) => {
      this[key] = null;
    });
  }

  /**
   * Get color
   * @returns {Number} color value
   */
  get color() {
    return this._color;
  }

  /**
   * Set color
   * @param {string} color color value
   */
  set color(color) {
    if (color && typeof color === 'object' && typeof color.color !== 'undefined') {
      color = color.color;
    }
    this._color = color;
    this._changeColorElement(color);
  }

  /**
   * Change color element
   * @param {string} color color value
   * #private
   */
  _changeColorElement(color) {
    if (color && color !== 'transparent') {
      this.colorElement.classList.remove('transparent');
      this.colorElement.style.backgroundColor = color;
    } else {
      this.colorElement.style.backgroundColor = '';
      this.colorElement.classList.add('transparent');
    }
  }

  /**
   * Make picker button element
   * @param {string} defaultColor color value
   * @private
   */
  _makePickerButtonElement(defaultColor) {
    this.colorpickerElement.classList.add('tui-image-editor-button');

    this.colorElement = document.createElement('div');
    this.colorElement.className = 'color-picker-value';
    if (defaultColor && defaultColor !== 'transparent') {
      this.colorElement.style.backgroundColor = defaultColor;
    } else {
      this.colorElement.classList.add('transparent');
    }
  }

  /**
   * Make picker layer element
   * @param {HTMLElement} colorpickerElement color picker element
   * @param {string} title picker title
   * @private
   */
  _makePickerLayerElement(colorpickerElement, title) {
    const label = document.createElement('label');
    const triangle = document.createElement('div');

    this.pickerControl = document.createElement('div');
    this.pickerControl.className = 'color-picker-control';

    this.pickerElement = document.createElement('div');
    this.pickerElement.className = 'color-picker';

    label.innerHTML = title;
    triangle.className = 'triangle';

    this.pickerControl.appendChild(this.pickerElement);
    this.pickerControl.appendChild(triangle);

    colorpickerElement.appendChild(this.pickerControl);
    colorpickerElement.appendChild(this.colorElement);
    colorpickerElement.appendChild(label);
  }

  _addEvent() {
    this.picker.on('selectColor', (value) => {
      const color = value && typeof value === 'object' ? value.color : value;
      if (color && this._color !== color) {
        this._changeColorElement(color);
        this._color = color;
        this.fire('change', color);
      }
    });

    this.eventHandler = {
      pickerToggle: this._pickerToggleEventHandler.bind(this),
      pickerHide: () => this.hide(),
    };

    this.colorpickerElement.addEventListener('click', this.eventHandler.pickerToggle);
    document.body.addEventListener('click', this.eventHandler.pickerHide);

    // Click bottom preview to open native color picker via event delegation on pickerElement
    this._onPickerClick = (event) => {
      const { target } = event;
      const previewEl = target.closest('.tui-colorpicker-palette-preview');
      if (previewEl) {
        event.stopPropagation();
        this._hiddenColorInput.value = this._color || '#ffffff';
        this._hiddenColorInput.click();
      }
    };
    this._onPickerMouseOver = (event) => {
      const { target } = event;
      const previewEl = target.closest('.tui-colorpicker-palette-preview');
      if (previewEl && !previewEl.title) {
        previewEl.title = 'Click to open color spectrum / eyedropper';
      }
    };
    this.pickerElement.addEventListener('click', this._onPickerClick);
    this.pickerElement.addEventListener('mouseover', this._onPickerMouseOver);
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this.colorpickerElement.removeEventListener('click', this.eventHandler.pickerToggle);
    document.body.removeEventListener('click', this.eventHandler.pickerHide);

    if (this._onPickerClick) {
      this.pickerElement.removeEventListener('click', this._onPickerClick);
    }
    if (this._onPickerMouseOver) {
      this.pickerElement.removeEventListener('mouseover', this._onPickerMouseOver);
    }

    this.picker.off();
  }

  /**
   * Picker toggle event handler
   * @param {object} event - change event
   * @private
   */
  _pickerToggleEventHandler(event) {
    const { target } = event;
    const isInPickerControl = target && this._isElementInColorPickerControl(target);

    if (!isInPickerControl || (isInPickerControl && this._isPaletteButton(target))) {
      this._show = !this._show;
      this.pickerControl.style.display = this._show ? 'block' : 'none';
      this._setPickerControlPosition();
      this.fire('changeShow', this);
    }
    event.stopPropagation();
  }

  /**
   * Check hex input or not
   * @param {Element} target - Event target element
   * @returns {boolean}
   * @private
   */
  _isPaletteButton(target) {
    return target.className === 'tui-colorpicker-palette-button';
  }

  /**
   * Check given element is in pickerControl element
   * @param {Element} element - element to check
   * @returns {boolean}
   * @private
   */
  _isElementInColorPickerControl(element) {
    let parentNode = element;

    while (parentNode !== document.body) {
      if (!parentNode) {
        break;
      }

      if (parentNode === this.pickerControl) {
        return true;
      }

      parentNode = parentNode.parentNode;
    }

    return false;
  }

  hide() {
    this._show = false;
    this.pickerControl.style.display = 'none';
  }

  /**
   * Set picker control position
   * @private
   */
  _setPickerControlPosition() {
    const controlStyle = this.pickerControl.style;
    const halfPickerWidth = this._colorpickerElement.clientWidth / 2 + 2;
    const top = this._toggleDirection === 'down' ? 32 : (this.pickerControl.offsetHeight + 10) * -1;
    const left = this._calculatePickerLeft(halfPickerWidth);

    controlStyle.top = `${top}px`;
    controlStyle.left = `-${left}px`;
  }

  /**
   * Calculate picker left position and prevent clipping at left viewport boundary
   * @param {number} halfPickerWidth - half picker width
   * @returns {number}
   * @private
   */
  _calculatePickerLeft(halfPickerWidth) {
    let left = this.pickerControl.offsetWidth / 2 - halfPickerWidth;
    const el = this._colorpickerElement;

    if (el && typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect();
      if (rect && rect.left > 0 && rect.left < left) {
        left = Math.max(0, rect.left - 8);
      }
    }

    return left;
  }
}

CustomEvents.mixin(Colorpicker);

export default Colorpicker;
