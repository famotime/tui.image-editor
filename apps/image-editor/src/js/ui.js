import CustomEvents from 'tui-code-snippet/customEvents/customEvents';
import extend from 'tui-code-snippet/object/extend';
import forEach from 'tui-code-snippet/collection/forEach';
import { getSelector, assignmentForDestroy, cls, getHistoryTitle, isSilentCommand } from '@/util';
import { ZOOM_HELP_MENUS, eventNames, HELP_MENUS } from '@/consts';
import mainContainer from '@/ui/template/mainContainer';
import controls from '@/ui/template/controls';

import Theme from '@/ui/theme/theme';
import Shape from '@/ui/shape';
import Crop from '@/ui/crop';
import Resize from '@/ui/resize';
import Flip from '@/ui/flip';
import Rotate from '@/ui/rotate';
import Text from '@/ui/text';
import Mask from '@/ui/mask';
import Icon from '@/ui/icon';
import Draw from '@/ui/draw';
import Filter from '@/ui/filter';
import Annotation from '@/ui/annotation';
import Mosaic from '@/ui/mosaic';
import Lasso from '@/ui/lasso';
import Eraser from '@/ui/eraser';
import History from '@/ui/history';
import Locale from '@/ui/locale/locale';
import { makeHelpMenuWithPartitions } from '@/ui/helpMenu';

const SUB_UI_COMPONENT = {
  Shape,
  Crop,
  Resize,
  Flip,
  Rotate,
  Text,
  Mask,
  Icon,
  Draw,
  Filter,
  Annotation,
  Mosaic,
  Lasso,
  Eraser,
};

const BI_EXPRESSION_MINSIZE_WHEN_TOP_POSITION = '1300';
const HISTORY_MENU = 'history';
const HISTORY_PANEL_CLASS_NAME = 'tie-panel-history';

const CLASS_NAME_ON = 'on';
const ZOOM_BUTTON_TYPE = {
  ZOOM_IN: 'zoomIn',
  HAND: 'hand',
};

// 工具分组定义：构图与选区、绘制与修饰、矢量与标注、效果与蒙版
const TOOL_GROUPS = [
  ['crop', 'resize', 'rotate', 'flip', 'lasso'],
  ['draw', 'eraser', 'mosaic'],
  ['text', 'shape', 'icon', 'annotation'],
  ['mask', 'filter'],
];

/**
 * 获取工具所属分类索引
 * @param {string} toolName - 工具名称
 * @returns {number} 分组索引，未找到返回 -1
 */
function getToolGroupIndex(toolName) {
  for (let i = 0; i < TOOL_GROUPS.length; i += 1) {
    if (TOOL_GROUPS[i].indexOf(toolName) > -1) {
      return i;
    }
  }

  return -1;
}

/**
 * 获取当前激活工具的展示信息（标题和图标HTML）
 * @param {string} [menuName] - 工具菜单名称
 * @param {Object} locale - 本地化语言包实例
 * @param {Object} buttonElements - 工具按钮元素映射
 * @returns {Object} 包含 title 与 iconHtml 的展示对象
 */
function getActiveToolDisplayInfo(menuName, locale, buttonElements) {
  if (!menuName) {
    return {
      title: locale.localize('Tool'),
      iconHtml: '',
    };
  }

  const capitalized = menuName.charAt(0).toUpperCase() + menuName.slice(1);
  const btn = buttonElements[menuName];

  return {
    title: locale.localize(capitalized),
    iconHtml: btn ? btn.innerHTML : '',
  };
}

/**
 * Ui class
 * @class
 * @param {string|HTMLElement} element - Wrapper's element or selector
 * @param {Object} [options] - Ui setting options
 *   @param {number} options.loadImage - Init default load image
 *   @param {number} options.initMenu - Init start menu
 *   @param {Boolean} [options.menuBarPosition=bottom] - Let
 *   @param {Boolean} [options.applyCropSelectionStyle=false] - Let
 *   @param {Boolean} [options.usageStatistics=false] - Use statistics or not
 *   @param {Object} [options.uiSize] - ui size of editor
 *     @param {string} options.uiSize.width - width of ui
 *     @param {string} options.uiSize.height - height of ui
 * @param {Object} actions - ui action instance
 */
class Ui {
  constructor(element, options, actions) {
    this.options = this._initializeOption(options);
    this._actions = actions;
    this.submenu = false;
    this.imageSize = {};
    this.uiSize = {};
    this._locale = new Locale(this.options.locale);
    this.theme = new Theme(this.options.theme);
    this.eventHandler = {};
    this._submenuChangeTransection = false;
    this._selectedElement = null;
    this._mainElement = null;
    this._editorElementWrap = null;
    this._editorElement = null;
    this._menuBarElement = null;
    this._subMenuElement = null;
    this._makeUiElement(element);
    this._setUiSize();
    this._initMenuEvent = false;

    this._makeSubMenu();

    this._attachHistoryEvent();
    this._attachZoomEvent();
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeUiEvent();
    this._destroyAllMenu();
    this._selectedElement.innerHTML = '';

    assignmentForDestroy(this);
  }

  /**
   * Set Default Selection for includeUI
   * @param {Object} option - imageEditor options
   * @returns {Object} - extends selectionStyle option
   * @ignore
   */
  setUiDefaultSelectionStyle(option) {
    return extend(
      {
        applyCropSelectionStyle: true,
        applyGroupSelectionStyle: true,
        selectionStyle: {
          cornerStyle: 'circle',
          cornerSize: 16,
          cornerColor: '#fff',
          cornerStrokeColor: '#fff',
          transparentCorners: false,
          lineWidth: 2,
          borderColor: '#fff',
        },
      },
      option
    );
  }

  /**
   * Change editor size
   * @param {Object} resizeInfo - ui & image size info
   *   @param {Object} [resizeInfo.uiSize] - image size dimension
   *     @param {string} resizeInfo.uiSize.width - ui width
   *     @param {string} resizeInfo.uiSize.height - ui height
   *   @param {Object} [resizeInfo.imageSize] - image size dimension
   *     @param {Number} resizeInfo.imageSize.oldWidth - old width
   *     @param {Number} resizeInfo.imageSize.oldHeight - old height
   *     @param {Number} resizeInfo.imageSize.newWidth - new width
   *     @param {Number} resizeInfo.imageSize.newHeight - new height
   * @example
   * // Change the image size and ui size, and change the affected ui state together.
   * imageEditor.ui.resizeEditor({
   *     imageSize: {oldWidth: 100, oldHeight: 100, newWidth: 700, newHeight: 700},
   *     uiSize: {width: 1000, height: 1000}
   * });
   * @example
   * // Apply the ui state while preserving the previous attribute (for example, if responsive Ui)
   * imageEditor.ui.resizeEditor();
   */
  // eslint-disable-next-line complexity
  resizeEditor({ uiSize, imageSize = this.imageSize } = {}) {
    if (imageSize !== this.imageSize) {
      this.imageSize = imageSize;
    }
    if (uiSize) {
      this._setUiSize(uiSize);
    }

    if (this._actions && this._actions.main && this._actions.main.adjustCanvasDimension) {
      this._actions.main.adjustCanvasDimension();
    }

    const { width, height } = this._getCanvasMaxDimension();
    const editorElementStyle = this._editorElement.style;
    const { menuBarPosition } = this.options;

    editorElementStyle.height = `${height}px`;
    editorElementStyle.width = `${width}px`;

    this._setEditorPosition(menuBarPosition);

    this._editorElementWrap.style.bottom = `0px`;
    this._editorElementWrap.style.top = `0px`;
    this._editorElementWrap.style.left = `0px`;
    this._editorElementWrap.style.width = `100%`;

    const selectElementClassList = this._selectedElement.classList;

    if (
      menuBarPosition === 'top' &&
      this._selectedElement.offsetWidth < BI_EXPRESSION_MINSIZE_WHEN_TOP_POSITION
    ) {
      selectElementClassList.add('tui-image-editor-top-optimization');
    } else {
      selectElementClassList.remove('tui-image-editor-top-optimization');
    }
  }

  /**
   * Toggle zoom button status
   * @param {string} type - type of zoom button
   */
  toggleZoomButtonStatus(type) {
    const targetClassList = this._buttonElements[type].classList;

    targetClassList.toggle(CLASS_NAME_ON);

    if (type === ZOOM_BUTTON_TYPE.ZOOM_IN) {
      this._buttonElements[ZOOM_BUTTON_TYPE.HAND].classList.remove(CLASS_NAME_ON);
    } else {
      this._buttonElements[ZOOM_BUTTON_TYPE.ZOOM_IN].classList.remove(CLASS_NAME_ON);
    }
  }

  /**
   * Turn off zoom-in button status
   */
  offZoomInButtonStatus() {
    const zoomInClassList = this._buttonElements[ZOOM_BUTTON_TYPE.ZOOM_IN].classList;

    zoomInClassList.remove(CLASS_NAME_ON);
  }

  /**
   * Change hand button status
   * @param {boolean} enabled - status to change
   */
  changeHandButtonStatus(enabled) {
    const handClassList = this._buttonElements[ZOOM_BUTTON_TYPE.HAND].classList;

    handClassList[enabled ? 'add' : 'remove'](CLASS_NAME_ON);
  }

  /**
   * Change help button status
   * @param {string} buttonType - target button type
   * @param {Boolean} enableStatus - enabled status
   * @ignore
   */
  changeHelpButtonEnabled(buttonType, enableStatus) {
    const buttonClassList = this._buttonElements[buttonType].classList;

    buttonClassList[enableStatus ? 'add' : 'remove']('enabled');
  }

  /**
   * Change delete button status
   * @param {Object} [options] - Ui setting options
   *   @param {object} [options.loadImage] - Init default load image
   *   @param {string} [options.initMenu] - Init start menu
   *   @param {string} [options.menuBarPosition=bottom] - Let
   *   @param {boolean} [options.applyCropSelectionStyle=false] - Let
   *   @param {boolean} [options.usageStatistics=false] - Send statistics ping or not
   * @returns {Object} initialize option
   * @private
   */
  _initializeOption(options) {
    return extend(
      {
        loadImage: {
          path: '',
          name: '',
        },
        locale: {},
        menuIconPath: '',
        menu: [
          'resize',
          'crop',
          'flip',
          'rotate',
          'draw',
          'eraser',
          'lasso',
          'shape',
          'icon',
          'text',
          'mask',
          'filter',
          'mosaic',
          'annotation',
        ],
        initMenu: '',
        uiSize: {
          width: '100%',
          height: '100%',
        },
        menuBarPosition: 'bottom',
      },
      options
    );
  }

  /**
   * Set ui container size
   * @param {Object} uiSize - ui dimension
   *   @param {string} uiSize.width - css width property
   *   @param {string} uiSize.height - css height property
   * @private
   */
  _setUiSize(uiSize = this.options.uiSize) {
    const elementDimension = this._selectedElement.style;
    elementDimension.width = uiSize.width;
    elementDimension.height = uiSize.height;
  }

  /**
   * Make submenu dom element
   * @private
   */
  _makeSubMenu() {
    let lastGroupIndex = -1;
    forEach(this.options.menu, (menuName) => {
      const SubComponentClass =
        SUB_UI_COMPONENT[menuName.replace(/^[a-z]/, ($0) => $0.toUpperCase())];

      const currentGroupIndex = getToolGroupIndex(menuName);
      if (
        lastGroupIndex !== -1 &&
        currentGroupIndex !== -1 &&
        currentGroupIndex !== lastGroupIndex
      ) {
        this._makePalettePartitionElement();
      }
      if (currentGroupIndex !== -1) {
        lastGroupIndex = currentGroupIndex;
      }

      // make menu element
      this._makeMenuElement(menuName);

      // menu btn element
      this._buttonElements[menuName] = this._menuBarElement.querySelector(`.tie-btn-${menuName}`);

      // submenu ui instance
      this[menuName] = new SubComponentClass(this._subMenuElement, {
        locale: this._locale,
        makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
        menuBarPosition: this.options.menuBarPosition,
        usageStatistics: this.options.usageStatistics,
      });
    });
  }

  /**
   * Make palette partition element between tool categories
   * @private
   */
  _makePalettePartitionElement() {
    const partitionElement = document.createElement('li');
    const partitionInnerElement = document.createElement('div');
    partitionElement.className = 'tui-image-editor-palette-partition';
    partitionInnerElement.className = 'tui-image-editor-palette-icpartition';
    partitionElement.appendChild(partitionInnerElement);

    this._menuBarElement.appendChild(partitionElement);
  }

  /**
   * Attach history event
   * @private
   */
  _attachHistoryEvent() {
    this.on(eventNames.EXECUTE_COMMAND, this._addHistory.bind(this));
    this.on(eventNames.AFTER_UNDO, this._selectPrevHistory.bind(this));
    this.on(eventNames.AFTER_REDO, this._selectNextHistory.bind(this));
  }

  /**
   * Attach zoom event
   * @private
   */
  _attachZoomEvent() {
    this.on(eventNames.HAND_STARTED, () => {
      this.offZoomInButtonStatus();
      this.changeHandButtonStatus(true);
    });
    this.on(eventNames.HAND_STOPPED, () => this.changeHandButtonStatus(false));
    this.on(eventNames.ZOOM_CHANGED, (opt) => {
      this.resizeEditor();
      if (opt && opt.zoomLevel) {
        this._showZoomRatio(opt.zoomLevel);
      }
    });
  }

  /**
   * Show zoom ratio
   * @param {number} zoomLevel - zoom level
   * @private
   */
  _showZoomRatio(zoomLevel) {
    const zoomInfoEl =
      this._selectedElement &&
      this._selectedElement.querySelector('.tui-image-editor-options-info .canvas-zoom-info');
    if (zoomInfoEl) {
      zoomInfoEl.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    if (!this._zoomRatioElement) {
      this._zoomRatioElement = document.createElement('div');
      this._zoomRatioElement.className = 'tui-image-editor-zoom-ratio';
      Object.assign(this._zoomRatioElement.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '10px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        borderRadius: '20px',
        fontSize: '24px',
        zIndex: '1000',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.2s ease-in-out',
      });
      this._editorElementWrap.appendChild(this._zoomRatioElement);
    }

    this._zoomRatioElement.textContent = `${Math.round(zoomLevel * 100)}%`;
    this._zoomRatioElement.style.opacity = '1';

    if (this._zoomRatioTimer) {
      clearTimeout(this._zoomRatioTimer);
    }
    this._zoomRatioTimer = setTimeout(() => {
      this._zoomRatioElement.style.opacity = '0';
    }, 1000);
  }

  /**
   * Make primary ui dom element
   * @param {string|HTMLElement} element - Wrapper's element or selector
   * @private
   */
  _makeUiElement(element) {
    let selectedElement;

    if (element.nodeType) {
      selectedElement = element;
    } else {
      selectedElement = document.querySelector(element);
    }
    const selector = getSelector(selectedElement);

    selectedElement.classList.add('tui-image-editor-container');
    selectedElement.innerHTML =
      controls({
        locale: this._locale,
        biImage: this.theme.getStyle('common.bi'),
        loadButtonStyle: this.theme.getStyle('loadButton'),
        downloadButtonStyle: this.theme.getStyle('downloadButton'),
        menuBarPosition: this.options.menuBarPosition,
        submenuStyle: this.theme.getStyle('submenu'),
      }) +
      mainContainer({
        locale: this._locale,
        biImage: this.theme.getStyle('common.bi'),
        commonStyle: this.theme.getStyle('common'),
        headerStyle: this.theme.getStyle('header'),
        loadButtonStyle: this.theme.getStyle('loadButton'),
        downloadButtonStyle: this.theme.getStyle('downloadButton'),
        submenuStyle: this.theme.getStyle('submenu'),
      });

    this._selectedElement = selectedElement;
    this._selectedElement.classList.add(this.options.menuBarPosition);

    this._mainElement = selector('.tui-image-editor-main');
    this._editorElementWrap = selector('.tui-image-editor-wrap');
    this._editorElement = selector('.tui-image-editor');
    this._helpMenuBarElement = selector('.tui-image-editor-help-menu');
    this._menuBarElement = selector('.tui-image-editor-menu');
    this._subMenuElement = selector('.tui-image-editor-submenu');
    this._buttonElements = {};

    this._addHelpMenus();

    this._buttonElements.download = this._selectedElement.querySelectorAll(
      '.tui-image-editor-download-btn'
    );
    this._buttonElements.load = this._selectedElement.querySelectorAll(
      '.tui-image-editor-load-btn'
    );

    this._historyMenu = new History(this._buttonElements[HISTORY_MENU], {
      locale: this._locale,
      makeSvgIcon: this.theme.makeMenSvgIconSet.bind(this.theme),
    });

    this._activateZoomMenus();
    this._attachPaletteToggleEvent();
    this._attachHistoryOutsideClick();
  }

  /**
   * Attach palette toggle event for folding/expanding left toolbar
   * @private
   */
  _attachPaletteToggleEvent() {
    const toggleBtn = this._selectedElement.querySelector('.tui-image-editor-palette-toggle-btn');
    if (toggleBtn) {
      this._onTogglePalette = () => {
        this._selectedElement.classList.toggle('palette-collapsed');
        this._selectedElement.classList.toggle('tui-image-editor-palette-collapsed');
        const isCollapsed = this._selectedElement.classList.contains('palette-collapsed');
        toggleBtn.textContent = isCollapsed ? '▶' : '◀';
        this.resizeEditor();
      };
      toggleBtn.addEventListener('click', this._onTogglePalette);
    }
  }

  /**
   * Attach history popover outside click event
   * @private
   */
  _attachHistoryOutsideClick() {
    this._onDocumentClickForHistory = (event) => {
      const historyBtn = this._buttonElements[HISTORY_MENU];
      if (!historyBtn || !historyBtn.classList.contains('opened')) {
        return;
      }
      if (!historyBtn.contains(event.target)) {
        historyBtn.classList.remove('opened');
      }
    };
    document.addEventListener('click', this._onDocumentClickForHistory);
  }

  /**
   * 更新顶部第二层工具栏的激活工具徽章
   * @param {string} [menuName] - 激活的工具菜单名
   * @private
   */
  _updateActiveToolBadge(menuName) {
    if (!this._selectedElement) {
      return;
    }
    const { title, iconHtml } = getActiveToolDisplayInfo(
      menuName,
      this._locale,
      this._buttonElements
    );
    const badgeTitleEl = this._selectedElement.querySelector(
      '.tui-image-editor-active-tool-badge .active-tool-title, .tui-image-editor-active-tool-badge .tui-image-editor-active-tool-title'
    );
    const badgeIconEl = this._selectedElement.querySelector(
      '.tui-image-editor-active-tool-badge .active-tool-icon, .tui-image-editor-active-tool-badge .tui-image-editor-active-tool-icon'
    );

    if (badgeTitleEl) {
      badgeTitleEl.textContent = title;
    }
    if (badgeIconEl) {
      badgeIconEl.innerHTML = iconHtml;
    }
  }

  /**
   * Activate help menus for zoom.
   * @private
   */
  _activateZoomMenus() {
    forEach(ZOOM_HELP_MENUS, (menu) => {
      this.changeHelpButtonEnabled(menu, true);
    });
  }

  /**
   * make array for help menu output, including partitions.
   * @returns {Array}
   * @private
   */
  _makeHelpMenuWithPartition() {
    return makeHelpMenuWithPartitions();
  }

  /**
   * Add help menu
   * @private
   */
  _addHelpMenus() {
    const helpMenuWithPartition = this._makeHelpMenuWithPartition();

    forEach(helpMenuWithPartition, (menuName) => {
      if (!menuName) {
        this._makeMenuPartitionElement();
      } else {
        this._makeMenuElement(menuName, ['normal', 'disabled', 'hover'], 'help');

        this._buttonElements[menuName] = this._helpMenuBarElement.querySelector(
          `.tie-btn-${menuName}`
        );
      }
    });
  }

  /**
   * Make menu partition element
   * @private
   */
  _makeMenuPartitionElement() {
    const partitionElement = document.createElement('li');
    const partitionInnerElement = document.createElement('div');
    partitionElement.className = cls('item');
    partitionInnerElement.className = cls('icpartition');
    partitionElement.appendChild(partitionInnerElement);

    this._helpMenuBarElement.appendChild(partitionElement);
  }

  /**
  /**
   * Enhance special menu button (load, download, viewOriginal)
   * @param {HTMLElement} btnElement - button element
   * @param {string} menuName - menu name
   * @private
   */
  _enhanceSpecialMenuButton(btnElement, menuName) {
    if (['load', 'download', 'viewOriginal'].indexOf(menuName) > -1) {
      btnElement.classList.add('enabled');
    }
    if (menuName === 'load') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.className = 'tui-image-editor-load-btn';
      btnElement.appendChild(fileInput);
    }
    if (menuName === 'download') {
      btnElement.classList.add('tui-image-editor-download-btn');
    }
  }

  /**
   * Make menu button element
   * @param {string} menuName - menu name
   * @param {Array} useIconTypes - Possible values are  \['normal', 'active', 'hover', 'disabled'\]
   * @param {string} menuType - 'normal' or 'help'
   * @private
   */
  _makeMenuElement(menuName, useIconTypes = ['normal', 'active', 'hover'], menuType = 'normal') {
    const btnElement = document.createElement('li');
    const menuItemHtml = this.theme.makeMenSvgIconSet(useIconTypes, menuName);

    this._addTooltipAttribute(btnElement, menuName);
    btnElement.className = `tie-btn-${menuName} ${cls('item')} ${menuType}`;
    btnElement.innerHTML = menuItemHtml;

    this._enhanceSpecialMenuButton(btnElement, menuName);

    const targetContainer = menuType === 'normal' ? this._menuBarElement : this._helpMenuBarElement;
    targetContainer.appendChild(btnElement);
  }

  /**
   * Add help action event
   * @private
   */
  _addHelpActionEvent() {
    forEach(HELP_MENUS, (helpName) => {
      this.eventHandler[helpName] = (event) => this._actions.main[helpName](event);
      this._buttonElements[helpName].addEventListener('click', this.eventHandler[helpName]);
    });
  }

  /**
   * Remove help action event
   * @private
   */
  _removeHelpActionEvent() {
    forEach(HELP_MENUS, (helpName) => {
      this._buttonElements[helpName].removeEventListener('click', this.eventHandler[helpName]);
    });
  }

  /**
   * Add history
   * @param {Command|string} command - command or command name
   */
  _addHistory(command) {
    if (!isSilentCommand(command)) {
      const historyTitle =
        typeof command === 'string' ? { name: command } : getHistoryTitle(command);

      this._historyMenu.add(historyTitle);
    }
  }

  /**
   * Init history
   */
  initHistory() {
    this._historyMenu.init();
  }

  /**
   * Clear history
   */
  clearHistory() {
    this._historyMenu.clear();
  }

  /**
   * Select prev history
   */
  _selectPrevHistory() {
    this._historyMenu.prev();
  }

  /**
   * Select next history
   */
  _selectNextHistory() {
    this._historyMenu.next();
  }

  /**
   * Toggle history menu
   * @param {object} event - event object
   */
  toggleHistoryMenu(event) {
    const { target } = event;
    const item = target.closest(`.${HISTORY_PANEL_CLASS_NAME}`);

    if (item) {
      return;
    }

    const historyButtonClassList = this._buttonElements[HISTORY_MENU].classList;

    historyButtonClassList.toggle('opened');
  }

  /**
   * Add attribute for menu tooltip
   * @param {HTMLElement} element - menu element
   * @param {string} tooltipName - tooltipName
   * @private
   */
  _addTooltipAttribute(element, tooltipName) {
    element.setAttribute(
      'tooltip-content',
      this._locale.localize(tooltipName.replace(/^[a-z]/g, ($0) => $0.toUpperCase()))
    );
  }

  /**
   * Add download event
   * @private
   */
  _addDownloadEvent() {
    this.eventHandler.download = () => this._actions.main.download();
    forEach(this._buttonElements.download, (element) => {
      element.addEventListener('click', this.eventHandler.download);
    });
  }

  _removeDownloadEvent() {
    forEach(this._buttonElements.download, (element) => {
      element.removeEventListener('click', this.eventHandler.download);
    });
  }

  /**
   * Add load event
   * @private
   */
  _addLoadEvent() {
    this.eventHandler.loadImage = (event) => {
      const [file] = event.target.files;
      if (file) {
        this._actions.main.load(file);
        event.target.value = '';
      }
    };

    forEach(this._buttonElements.load, (element) => {
      element.addEventListener('change', this.eventHandler.loadImage);
    });
  }

  /**
   * Remove load event
   * @private
   */
  _removeLoadEvent() {
    forEach(this._buttonElements.load, (element) => {
      element.removeEventListener('change', this.eventHandler.loadImage);
    });
  }

  /**
   * Add menu event
   * @param {string} menuName - menu name
   * @private
   */
  _addMainMenuEvent(menuName) {
    this.eventHandler[menuName] = () => this.changeMenu(menuName);
    this._buttonElements[menuName].addEventListener('click', this.eventHandler[menuName]);
  }

  /**
   * Add menu event
   * @param {string} menuName - menu name
   * @private
   */
  _addSubMenuEvent(menuName) {
    this[menuName].addEvent(this._actions[menuName]);
    this[menuName].on(eventNames.INPUT_BOX_EDITING_STARTED, () =>
      this.fire(eventNames.INPUT_BOX_EDITING_STARTED)
    );
    this[menuName].on(eventNames.INPUT_BOX_EDITING_STOPPED, () =>
      this.fire(eventNames.INPUT_BOX_EDITING_STOPPED)
    );
  }

  /**
   * Add menu event
   * @private
   */
  _addMenuEvent() {
    forEach(this.options.menu, (menuName) => {
      this._addMainMenuEvent(menuName);
      this._addSubMenuEvent(menuName);
    });
  }

  /**
   * Remove menu event
   * @private
   */
  _removeMainMenuEvent() {
    forEach(this.options.menu, (menuName) => {
      this._buttonElements[menuName].removeEventListener('click', this.eventHandler[menuName]);
      this[menuName].off(eventNames.INPUT_BOX_EDITING_STARTED);
      this[menuName].off(eventNames.INPUT_BOX_EDITING_STOPPED);
    });
  }

  /**
   * Get editor area element
   * @returns {HTMLElement} editor area html element
   * @ignore
   */
  getEditorArea() {
    return this._editorElement;
  }

  /**
   * Add event for menu items
   * @ignore
   */
  activeMenuEvent() {
    if (this._initMenuEvent) {
      return;
    }

    this._addHelpActionEvent();
    this._addDownloadEvent();
    this._addMenuEvent();
    this._initMenu();
    this._historyMenu.addEvent(this._actions.history);
    this._initMenuEvent = true;
  }

  /**
   * Remove ui event
   * @private
   */
  _removeUiEvent() {
    this._removeHelpActionEvent();
    this._removeDownloadEvent();
    this._removeLoadEvent();
    this._removeMainMenuEvent();
    this._historyMenu.removeEvent();
    if (this._onDocumentClickForHistory) {
      document.removeEventListener('click', this._onDocumentClickForHistory);
    }
    const toggleBtn =
      this._selectedElement &&
      this._selectedElement.querySelector('.tui-image-editor-palette-toggle-btn');
    if (toggleBtn && this._onTogglePalette) {
      toggleBtn.removeEventListener('click', this._onTogglePalette);
    }
  }

  /**
   * Destroy all menu instance
   * @private
   */
  _destroyAllMenu() {
    forEach(this.options.menu, (menuName) => {
      this[menuName].destroy();
    });

    this._historyMenu.destroy();
  }

  /**
   * Init canvas
   * @ignore
   */
  initCanvas() {
    const loadImageInfo = this._getLoadImage();
    if (loadImageInfo.path) {
      this._actions.main.initLoadImage(loadImageInfo.path, loadImageInfo.name).then(() => {
        this.activeMenuEvent();
      });
    }

    this._addLoadEvent();

    const gridVisual = document.createElement('div');

    gridVisual.className = cls('grid-visual');
    const grid = `<table>
           <tr><td class="dot left-top"></td><td></td><td class="dot right-top"></td></tr>
           <tr><td></td><td></td><td></td></tr>
           <tr><td class="dot left-bottom"></td><td></td><td class="dot right-bottom"></td></tr>
         </table>`;
    gridVisual.innerHTML = grid;
    this._editorContainerElement = this._editorElement.querySelector(
      '.tui-image-editor-canvas-container'
    );
    this._editorContainerElement.appendChild(gridVisual);
  }

  /**
   * get editor area element
   * @returns {Object} load image option
   * @private
   */
  _getLoadImage() {
    return this.options.loadImage;
  }

  /**
   * change menu
   * @param {string} menuName - menu name
   * @param {boolean} toggle - whether toogle or not
   * @param {boolean} discardSelection - discard selection
   * @ignore
   */
  changeMenu(menuName, toggle = true, discardSelection = true) {
    if (!this._submenuChangeTransection) {
      this._submenuChangeTransection = true;
      this._changeMenu(menuName, toggle, discardSelection);
      this._submenuChangeTransection = false;
    }
  }

  /**
  /**
   * Deactivate current submenu
   * @param {boolean} discardSelection - discard selection
   * @private
   */
  _deactivateSubmenu(discardSelection) {
    if (!this.submenu) {
      return;
    }
    const currentMenu = this.submenu;
    this._buttonElements[currentMenu].classList.remove('active');
    this._mainElement.classList.remove(`tui-image-editor-menu-${currentMenu}`);
    if (this._selectedElement) {
      this._selectedElement.classList.remove(`tui-image-editor-menu-${currentMenu}`);
    }
    if (discardSelection) {
      this._actions.main.discardSelection();
    }
    this._actions.main.changeSelectableAll(true);
    this[currentMenu].changeStandbyMode();
  }

  /**
   * change menu
   * @param {string} menuName - menu name
   * @param {boolean} toggle - whether toggle or not
   * @param {boolean} discardSelection - discard selection
   * @private
   */
  _changeMenu(menuName, toggle, discardSelection) {
    const isSameMenu = this.submenu === menuName;
    this._deactivateSubmenu(discardSelection);

    if (isSameMenu && toggle) {
      this.submenu = null;
      this._updateActiveToolBadge(null);
    } else {
      this._buttonElements[menuName].classList.add('active');
      this._mainElement.classList.add(`tui-image-editor-menu-${menuName}`);
      if (this._selectedElement) {
        this._selectedElement.classList.add(`tui-image-editor-menu-${menuName}`);
      }
      this.submenu = menuName;
      this._updateActiveToolBadge(menuName);
      this[this.submenu].changeStartMode();
    }

    this.resizeEditor();
  }

  /**
   * Init menu
   * @private
   */
  _initMenu() {
    if (this.options.initMenu) {
      const evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, false);
      this._buttonElements[this.options.initMenu].dispatchEvent(evt);
    }

    if (this.icon) {
      this.icon.registerDefaultIcon();
    }
  }

  /**
   * Get canvas max Dimension
   * @returns {Object} - width & height of editor
   * @private
   */
  _getCanvasMaxDimension() {
    const { maxWidth, maxHeight } = this._editorContainerElement.style;
    const width = parseFloat(maxWidth);
    const height = parseFloat(maxHeight);

    return {
      width,
      height,
    };
  }

  /**
   * Set editor position
   * @param {string} menuBarPosition - top or right or bottom or left
   * @private
   */
  // eslint-disable-next-line complexity
  _setEditorPosition(menuBarPosition) {
    const { width, height } = this._getCanvasMaxDimension();
    const editorElementStyle = this._editorElement.style;
    let top = 0;
    let left = 0;

    if (this.submenu) {
      if (menuBarPosition === 'bottom') {
        if (height > this._editorElementWrap.scrollHeight - 150) {
          top = (height - this._editorElementWrap.scrollHeight) / 2;
        } else {
          top = (150 / 2) * -1;
        }
      } else if (menuBarPosition === 'top') {
        if (height > this._editorElementWrap.offsetHeight - 150) {
          top = 150 / 2 - (height - (this._editorElementWrap.offsetHeight - 150)) / 2;
        } else {
          top = 150 / 2;
        }
      } else if (menuBarPosition === 'left') {
        if (width > this._editorElementWrap.offsetWidth - 248) {
          left = 248 / 2 - (width - (this._editorElementWrap.offsetWidth - 248)) / 2;
        } else {
          left = 248 / 2;
        }
      } else if (menuBarPosition === 'right') {
        if (width > this._editorElementWrap.scrollWidth - 248) {
          left = (width - this._editorElementWrap.scrollWidth) / 2;
        } else {
          left = (248 / 2) * -1;
        }
      }
    }
    editorElementStyle.top = `${top}px`;
    editorElementStyle.left = `${left}px`;
  }
}

CustomEvents.mixin(Ui);

export default Ui;
