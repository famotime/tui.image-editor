import templateHtml from '@/ui/template/submenu/layer';
import { isNil, stamp } from '@/util';
import { layerIcons, getLayerTypeIcon } from '@/ui/icons/layerIcons';

/**
 * Get or assign unique id of a fabric object
 * @param {fabric.Object} obj - Fabric object
 * @returns {string|null}
 */
function getObjectId(obj) {
  if (!obj) {
    return null;
  }
  if (!isNil(obj.id)) {
    return String(obj.id);
  }
  if (!isNil(obj.__fe_id)) {
    obj.id = obj.__fe_id;

    return String(obj.id);
  }
  obj.id = stamp(obj);

  return String(obj.id);
}

/**
 * Filter manageable layers (excluding cropzone, resizezone, freehand brush paths, etc.)
 * @param {fabric.Object} obj - Fabric object
 * @returns {boolean}
 */
function isManageableLayer(obj) {
  if (!obj || obj.isCropzone || obj.isResizezone || obj.isCompresszone) {
    return false;
  }
  // Exclude free drawing brush strokes to prevent cluttering
  if (obj.type === 'path' && !obj.isIcon) {
    return false;
  }

  return true;
}

/**
 * Layer Management UI Component
 * @class
 */
class Layer {
  /**
   * @param {HTMLElement} paletteElement - Right palette container
   * @param {Object} options - UI options
   * @param {Object} actions - Layer actions
   */
  constructor(paletteElement, { locale, theme }, actions) {
    this.paletteElement = paletteElement;
    this.locale = locale;
    this.theme = theme;
    this.actions = actions;

    this.container = paletteElement.querySelector('.tui-image-editor-layer-body');
    if (this.container) {
      this.container.innerHTML = templateHtml({ locale });
      this._initElements();
      this._attachDomEvents();
      this.initCanvas();
    }
  }

  /**
   * Initialize canvas binding
   */
  initCanvas() {
    this._attachCanvasEvents();
    this.refresh();
  }

  /**
   * Initialize DOM element references
   * @private
   */
  _initElements() {
    this._addInput = this.container.querySelector('.tie-layer-add-input');
    this._btnTop = this.container.querySelector('.tie-layer-btn-top');
    this._btnUp = this.container.querySelector('.tie-layer-btn-up');
    this._btnDown = this.container.querySelector('.tie-layer-btn-down');
    this._btnBottom = this.container.querySelector('.tie-layer-btn-bottom');
    this._btnClone = this.container.querySelector('.tie-layer-btn-clone');
    this._btnDelete = this.container.querySelector('.tie-layer-btn-delete');
    this._opacityRange = this.container.querySelector('.tie-layer-opacity-range');
    this._opacityVal = this.container.querySelector('.tie-layer-opacity-val');
    this._list = this.container.querySelector('.tie-layer-list');
  }

  /**
   * Get active layer ID
   * @returns {string|number|null}
   * @private
   */
  _getActiveLayerId() {
    const canvas = this.actions.getCanvas();
    if (!canvas) {
      return null;
    }
    const active = canvas.getActiveObject();
    if (active) {
      return getObjectId(active);
    }
    const activeItem = this._list.querySelector('.tie-layer-item.active');

    return activeItem ? activeItem.getAttribute('data-id') : null;
  }

  /**
   * Attach DOM event listeners
   * @private
   */
  _attachDomEvents() {
    // Add image input
    if (this._addInput) {
      this._addInput.addEventListener('change', (e) => {
        const [file] = e.target.files;
        if (file) {
          this.actions.addImage(file);
          e.target.value = '';
        }
      });
    }

    // Layer toolbar buttons
    if (this._btnTop) {
      this._btnTop.addEventListener('click', () => this._moveLayerToExtreme('top'));
    }
    if (this._btnBottom) {
      this._btnBottom.addEventListener('click', () => this._moveLayerToExtreme('bottom'));
    }
    if (this._btnUp) {
      this._btnUp.addEventListener('click', () => this._stepLayer('up'));
    }
    if (this._btnDown) {
      this._btnDown.addEventListener('click', () => this._stepLayer('down'));
    }
    if (this._btnClone) {
      this._btnClone.addEventListener('click', () => {
        const activeId = this._getActiveLayerId();
        if (activeId && activeId !== 'background') {
          this.actions.cloneLayer(activeId);
        }
      });
    }
    if (this._btnDelete) {
      this._btnDelete.addEventListener('click', () => {
        const activeId = this._getActiveLayerId();
        if (activeId) {
          this.actions.removeLayer(activeId).then(() => this.refresh());
        }
      });
    }

    // Opacity slider
    if (this._opacityRange) {
      this._opacityRange.addEventListener('input', () => {
        const val = parseInt(this._opacityRange.value, 10);
        this._opacityVal.textContent = `${val}%`;
        const activeId = this._getActiveLayerId();
        if (activeId) {
          const target =
            activeId === 'background'
              ? this.actions.getCanvasImage()
              : this.actions.getObject(activeId);
          if (target) {
            target.set('opacity', val / 100);
            this.actions.getCanvas().renderAll();
          }
        }
      });

      this._opacityRange.addEventListener('change', () => {
        const val = parseInt(this._opacityRange.value, 10);
        const activeId = this._getActiveLayerId();
        if (activeId) {
          this.actions.setLayerOpacity(activeId, val / 100).then(() => this.refresh());
        }
      });
    }

    // Layer item list click & double click events
    if (this._list) {
      this._list.addEventListener('click', (e) => this._onListClick(e));
      this._list.addEventListener('dblclick', (e) => this._onListDblClick(e));
      this._attachDragEvents();
    }
  }

  /**
   * Move layer to top or bottom
   * @param {string} direction - 'top' or 'bottom'
   * @private
   */
  _moveLayerToExtreme(direction) {
    const activeId = this._getActiveLayerId();
    if (!activeId || activeId === 'background') {
      return;
    }
    const canvas = this.actions.getCanvas();
    const objects = canvas.getObjects();
    const toIndex = direction === 'top' ? objects.length - 1 : 0;
    this.actions.reorderLayer(activeId, toIndex).then(() => this.refresh());
  }

  /**
   * Step layer up or down by 1 position
   * @param {string} direction - 'up' or 'down'
   * @private
   */
  _stepLayer(direction) {
    const activeId = this._getActiveLayerId();
    if (!activeId || activeId === 'background') {
      return;
    }
    const canvas = this.actions.getCanvas();
    const obj = this.actions.getObject(activeId);
    if (!obj) {
      return;
    }
    const objects = canvas.getObjects();
    const currIndex = objects.indexOf(obj);
    const toIndex = direction === 'up' ? currIndex + 1 : currIndex - 1;

    if (toIndex >= 0 && toIndex < objects.length) {
      this.actions.reorderLayer(activeId, toIndex).then(() => this.refresh());
    }
  }

  /**
   * Handle click on layer item
   * @param {MouseEvent} e - Mouse event
   * @private
   */
  _onListClick(e) {
    const item = e.target.closest('.tie-layer-item');
    if (!item) {
      return;
    }
    const id = item.getAttribute('data-id');

    // Visibility toggle
    if (e.target.closest('.tie-layer-item-vis-btn')) {
      e.stopPropagation();
      const target =
        id === 'background' ? this.actions.getCanvasImage() : this.actions.getObject(id);
      if (target) {
        const isVisible = target.visible !== false;
        this.actions.setLayerVisibility(id, !isVisible);
        this.refresh();
      }

      return;
    }

    // Lock toggle
    if (e.target.closest('.tie-layer-item-lock-btn')) {
      e.stopPropagation();
      if (id === 'background') {
        this.actions.setLayerLock('background', false);
        this.refresh();

        return;
      }
      const target = this.actions.getObject(id);
      if (target) {
        const isLocked = target.selectable === false;
        this.actions.setLayerLock(id, !isLocked);
        this.refresh();
      }

      return;
    }

    // Delete item
    if (e.target.closest('.tie-layer-item-del-btn')) {
      e.stopPropagation();
      this.actions.removeLayer(id).then(() => this.refresh());

      return;
    }

    // Select layer
    this.actions.selectLayer(id);
    this._highlightItem(id);
    this._updateOpacityFromTarget(id);
  }

  /**
   * Double click on layer name to inline edit
   * @param {MouseEvent} e - Mouse event
   * @private
   */
  _onListDblClick(e) {
    const nameSpan = e.target.closest('.tie-layer-item-name');
    if (!nameSpan) {
      return;
    }
    const item = nameSpan.closest('.tie-layer-item');
    const id = item.getAttribute('data-id');
    const currentName = nameSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tie-layer-rename-input';
    input.value = currentName;

    const finishRename = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        this.actions.renameLayer(id, newName);
      }
      this.refresh();
    };

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (ke) => {
      if (ke.key === 'Enter') {
        finishRename();
      } else if (ke.key === 'Escape') {
        this.refresh();
      }
    });

    nameSpan.replaceWith(input);
    input.focus();
    input.select();
  }

  /**
   * Attach drag & drop sorting events on list
   * @private
   */
  _attachDragEvents() {
    let draggedId = null;

    this._list.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.tie-layer-item');
      if (!item || item.getAttribute('data-id') === 'background') {
        e.preventDefault();

        return;
      }
      draggedId = item.getAttribute('data-id');
      e.dataTransfer.setData('text/plain', draggedId);
      e.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
    });

    this._list.addEventListener('dragend', (e) => {
      const item = e.target.closest('.tie-layer-item');
      if (item) {
        item.classList.remove('dragging');
      }
      this._list.querySelectorAll('.tie-layer-item').forEach((el) => {
        el.classList.remove('drag-over');
      });
      draggedId = null;
    });

    this._list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const item = e.target.closest('.tie-layer-item');
      if (item && item.getAttribute('data-id') !== draggedId) {
        item.classList.add('drag-over');
      }
    });

    this._list.addEventListener('dragleave', (e) => {
      const item = e.target.closest('.tie-layer-item');
      if (item) {
        item.classList.remove('drag-over');
      }
    });

    this._list.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest('.tie-layer-item');
      if (!targetItem || !draggedId) {
        return;
      }
      targetItem.classList.remove('drag-over');
      const targetId = targetItem.getAttribute('data-id');
      if (targetId === draggedId) {
        return;
      }

      const canvas = this.actions.getCanvas();
      const objects = canvas.getObjects();
      let targetIndex = 0;

      if (targetId !== 'background') {
        const targetObj = this.actions.getObject(targetId);
        targetIndex = targetObj ? objects.indexOf(targetObj) : 0;
      }

      this.actions.reorderLayer(draggedId, targetIndex).then(() => this.refresh());
    });
  }

  /**
   * Attach canvas event listeners
   * @private
   */
  _attachCanvasEvents() {
    if (this._canvasEventsAttached) {
      return;
    }
    const canvas = this.actions.getCanvas ? this.actions.getCanvas() : null;
    if (!canvas) {
      return;
    }
    this._canvasEventsAttached = true;

    const onCanvasChange = () => this.refresh();
    const onSelectionChange = () => this._syncSelection();

    canvas.on({
      'object:added': onCanvasChange,
      'object:removed': onCanvasChange,
      'object:modified': onCanvasChange,
      'selection:created': onSelectionChange,
      'selection:updated': onSelectionChange,
      'selection:cleared': onSelectionChange,
    });
  }

  /**
   * Sync active selection from canvas to list
   * @private
   */
  _syncSelection() {
    const canvas = this.actions.getCanvas();
    if (!canvas) {
      return;
    }
    const active = canvas.getActiveObject();
    if (active) {
      const activeId = getObjectId(active);
      this._highlightItem(activeId);
      this._updateOpacityFromTarget(activeId);
    } else {
      this._highlightItem(null);
    }
  }

  /**
   * Highlight item in list
   * @param {string|number|null} id - Target layer id
   * @private
   */
  _highlightItem(id) {
    if (!this._list) {
      return;
    }
    this._list.querySelectorAll('.tie-layer-item').forEach((item) => {
      if (id !== null && item.getAttribute('data-id') === String(id)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Update opacity slider from active target
   * @param {string|number} id - Target layer id
   * @private
   */
  _updateOpacityFromTarget(id) {
    const target = id === 'background' ? this.actions.getCanvasImage() : this.actions.getObject(id);
    if (target && this._opacityRange) {
      const opacity = typeof target.opacity === 'number' ? target.opacity : 1;
      const pct = Math.round(opacity * 100);
      this._opacityRange.value = pct;
      this._opacityVal.textContent = `${pct}%`;
    }
  }

  /**
   * Get layer display label
   * @param {fabric.Object} obj - Fabric object
   * @param {number} idx - Index
   * @returns {string}
   * @private
   */
  _getLayerLabel(obj, idx) {
    if (obj.layerName) {
      return obj.layerName;
    }
    const { type } = obj;
    if (type === 'image') {
      return `Image ${idx}`;
    }
    if (type === 'i-text' || type === 'text') {
      const text = obj.text ? obj.text.substring(0, 12) : '';

      return text ? `"${text}"` : `Text ${idx}`;
    }
    if (type === 'rect') {
      return `Rectangle ${idx}`;
    }
    if (type === 'circle') {
      return `Circle ${idx}`;
    }
    if (type === 'triangle') {
      return `Triangle ${idx}`;
    }
    if (type === 'icon') {
      return `Icon ${idx}`;
    }

    return `Layer ${idx}`;
  }

  /**
   * Refresh layer list from canvas
   */
  refresh() {
    if (!this._list) {
      return;
    }

    const canvas = this.actions.getCanvas();
    if (!canvas) {
      return;
    }

    const objects = canvas.getObjects();
    const active = canvas.getActiveObject();
    const activeId = active ? getObjectId(active) : null;

    let html = '';
    let counter = 1;

    // Render canvas objects from top (last) to bottom (first)
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const obj = objects[i];
      if (!isManageableLayer(obj)) {
        continue;
      }
      const id = getObjectId(obj);
      const isVisible = obj.visible !== false;
      const isLocked = obj.selectable === false;
      const isActive = activeId === id;
      const label = this._getLayerLabel(obj, counter);
      counter += 1;

      html += `
        <li class="tie-layer-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${
        !isVisible ? 'hidden' : ''
      }" data-id="${id}" draggable="true">
          <div class="tie-layer-item-drag-handle" title="拖拽排序">${layerIcons.gripVertical}</div>
          <button type="button" class="tie-layer-item-vis-btn" title="${
            isVisible ? '隐藏' : '显示'
          }">
            ${isVisible ? layerIcons.eye : layerIcons.eyeOff}
          </button>
          <div class="tie-layer-item-type-icon">${getLayerTypeIcon(obj.type)}</div>
          <span class="tie-layer-item-name" title="${label}">${label}</span>
          <button type="button" class="tie-layer-item-lock-btn" title="${
            isLocked ? '解锁' : '锁定'
          }">
            ${isLocked ? layerIcons.lock : layerIcons.unlock}
          </button>
          <button type="button" class="tie-layer-item-del-btn" title="删除">${
            layerIcons.close
          }</button>
        </li>
      `;
    }

    // Render background image layer if present
    const bgImage = canvas.backgroundImage || this.actions.getCanvasImage();
    if (bgImage) {
      const isVisible = bgImage.visible !== false;
      const bgLabel = (this.locale && this.locale.localize('Background')) || '画布底图';

      html += `
        <li class="tie-layer-item tie-layer-bg-item ${
          !isVisible ? 'hidden' : ''
        }" data-id="background">
          <div class="tie-layer-item-drag-handle disabled">${layerIcons.gripVertical}</div>
          <button type="button" class="tie-layer-item-vis-btn" title="${
            isVisible ? '隐藏' : '显示'
          }">
            ${isVisible ? layerIcons.eye : layerIcons.eyeOff}
          </button>
          <div class="tie-layer-item-type-icon">${layerIcons.typeBackground}</div>
          <span class="tie-layer-item-name" title="${bgLabel}">${bgLabel}</span>
          <button type="button" class="tie-layer-item-lock-btn" title="点击解锁为普通图层">${
            layerIcons.lock
          }</button>
          <button type="button" class="tie-layer-item-del-btn disabled" title="底图不可删除">${
            layerIcons.close
          }</button>
        </li>
      `;
    }

    this._list.innerHTML = html;

    if (active) {
      this._updateOpacityFromTarget(active.id);
    }
  }

  /**
   * Destroy layer instance
   */
  destroy() {
    this.container = null;
    this.paletteElement = null;
  }
}

export default Layer;
