import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/annotation';
import { assignmentForDestroy } from '@/util';

/**
 * Annotation ui class
 * @class
 * @ignore
 */
class Annotation extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'annotation',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this.shape = 'circle';
    this.color = '#ff4d4f';
    this.textColor = '#ffffff';
    this.fontSize = 20;
    this.step = 1;
    this.activePicker = null; // 'text' | 'bg' | null

    this._els = {
      // 形状按钮
      shapeCircle: this.selector('.circle'),
      shapeRect: this.selector('.rect'),
      shapeTriangle: this.selector('.triangle'),

      // 文字色
      textColorPreview: this.selector('.tie-annotation-textcolor-preview'),
      textColorPopup: this.selector('.tie-annotation-textcolor-popup'),
      textColorInput: this.selector('.tie-annotation-textcolor-input'),
      textColorCustom: this.selector('.tie-annotation-textcolor-custom'),

      // 背景色
      bgColorPreview: this.selector('.tie-annotation-bgcolor-preview'),
      bgColorPopup: this.selector('.tie-annotation-bgcolor-popup'),
      bgColorInput: this.selector('.tie-annotation-bgcolor-input'),
      bgColorCustom: this.selector('.tie-annotation-bgcolor-custom'),

      // 序号与滑块
      stepInput: this.selector('.tie-annotation-step-input'),
      resetBtn: this.selector('.tie-annotation-reset-btn'),
      fontSizeRange: this.selector('.tie-annotation-fontsize-range'),
      fontSizeInput: this.selector('.tie-annotation-fontsize-input'),
    };

    this._globalClickBind = this._onGlobalClick.bind(this);
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    assignmentForDestroy(this);
  }

  /**
   * Add event for annotation submenu
   * @param {Object} actions - actions for annotation
   */
  addEvent(actions) {
    this.actions = actions;

    // 1. 形状按钮事件
    this._els.shapeCircle.addEventListener('click', () => this._changeShape('circle'));
    this._els.shapeRect.addEventListener('click', () => this._changeShape('rect'));
    this._els.shapeTriangle.addEventListener('click', () => this._changeShape('triangle'));

    // 2. 颜色预览区点击事件（显示/隐藏预设色卡）
    this._els.textColorPreview.addEventListener('click', (e) => this._togglePicker('text', e));
    this._els.bgColorPreview.addEventListener('click', (e) => this._togglePicker('bg', e));

    // 3. 预设色盘中色块点击事件
    this._bindPresetColors(this._els.textColorPopup, 'text');
    this._bindPresetColors(this._els.bgColorPopup, 'bg');

    // 4. 自定义色盘 🎨 点击事件
    this._els.textColorCustom.addEventListener('click', () => this._els.textColorInput.click());
    this._els.bgColorCustom.addEventListener('click', () => this._els.bgColorInput.click());

    // 5. 颜色输入框 change 事件
    this._els.textColorInput.addEventListener('change', (e) =>
      this._onCustomColorChange('text', e.target.value)
    );
    this._els.bgColorInput.addEventListener('change', (e) =>
      this._onCustomColorChange('bg', e.target.value)
    );

    // 6. 序号微调与重置
    this._els.stepInput.addEventListener('change', (e) => {
      const step = Math.max(1, parseInt(e.target.value, 10) || 1);
      this.step = step;
      this._els.stepInput.value = step;
      this.actions.setStep(step);
    });
    this._els.stepInput.addEventListener('keydown', (e) => {
      if (e.keyCode === 13) {
        e.target.blur();
      }
    });
    this._els.resetBtn.addEventListener('click', () => {
      this.step = 1;
      this._els.stepInput.value = 1;
      this.actions.setStep(1);
    });

    // 7. 字号大小滑块与输入联动
    this._els.fontSizeRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 20;
      this.fontSize = val;
      this._els.fontSizeInput.value = val;
      this.actions.setFontSize(val);
    });
    this._els.fontSizeInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10) || 20;
      val = Math.max(12, Math.min(60, val));
      this.fontSize = val;
      this._els.fontSizeRange.value = val;
      this._els.fontSizeInput.value = val;
      this.actions.setFontSize(val);
    });
    this._els.fontSizeInput.addEventListener('keydown', (e) => {
      if (e.keyCode === 13) {
        e.target.blur();
      }
    });

    // 8. 监听组件中因画笔添加而触发的自增序号同步事件
    this.actions.onStepChanged((newStep) => {
      this.step = newStep;
      this._els.stepInput.value = newStep;
    });

    // 9. 全局点击用于收起色盘
    window.addEventListener('click', this._globalClickBind);
  }

  /**
   * Remove events
   * @private
   */
  _removeEvent() {
    window.removeEventListener('click', this._globalClickBind);
  }

  /**
   * Change shape selection UI and state
   * @param {string} shape - circle, rect, triangle
   * @private
   */
  _changeShape(shape) {
    this.shape = shape;
    this._els.shapeCircle.classList.remove('active');
    this._els.shapeRect.classList.remove('active');
    this._els.shapeTriangle.classList.remove('active');

    if (shape === 'circle') {
      this._els.shapeCircle.classList.add('active');
    } else if (shape === 'rect') {
      this._els.shapeRect.classList.add('active');
    } else if (shape === 'triangle') {
      this._els.shapeTriangle.classList.add('active');
    }

    this.actions.setShape(shape);
  }

  /**
   * Toggle color picker popups
   * @param {string} type - text, bg
   * @param {Event} event - click event
   * @private
   */
  _togglePicker(type, event) {
    event.stopPropagation();
    if (this.activePicker === type) {
      this._closePickers();
    } else {
      this._closePickers();
      this.activePicker = type;
      if (type === 'text') {
        this._els.textColorPopup.style.display = 'block';
      } else {
        this._els.bgColorPopup.style.display = 'block';
      }
    }
  }

  /**
   * Close all pickers
   * @private
   */
  _closePickers() {
    this._els.textColorPopup.style.display = 'none';
    this._els.bgColorPopup.style.display = 'none';
    this.activePicker = null;
  }

  /**
   * Bind preset color clicks
   * @param {HTMLElement} popup - popup container
   * @param {string} type - text, bg
   * @private
   */
  _bindPresetColors(popup, type) {
    const dots = popup.querySelectorAll('.preset-color-dot');
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = dot.getAttribute('title');
        if (type === 'text') {
          this.textColor = color;
          this._els.textColorPreview.style.backgroundColor = color;
          this.actions.setTextColor(color);
        } else {
          this.color = color;
          this._els.bgColorPreview.style.backgroundColor = color;
          this.actions.setColor(color);
        }
        this._closePickers();
      });
    });
  }

  /**
   * Handle color input custom color changes
   * @param {string} type - text, bg
   * @param {string} color - hex color
   * @private
   */
  _onCustomColorChange(type, color) {
    if (type === 'text') {
      this.textColor = color;
      this._els.textColorPreview.style.backgroundColor = color;
      this.actions.setTextColor(color);
    } else {
      this.color = color;
      this._els.bgColorPreview.style.backgroundColor = color;
      this.actions.setColor(color);
    }
  }

  _onGlobalClick(e) {
    if (this.activePicker) {
      const { target } = e;
      if (!target.closest('.color-item-wrapper')) {
        this._closePickers();
      }
    }
  }

  /**
   * Standby mode handler
   */
  changeStandbyMode() {
    this.actions.stopDrawingMode();
  }

  /**
   * Start mode handler
   */
  changeStartMode() {
    this.actions.modeChange('annotation');
  }
}

export default Annotation;
