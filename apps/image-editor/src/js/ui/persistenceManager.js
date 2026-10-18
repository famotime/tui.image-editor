import extend from 'tui-code-snippet/object/extend';

export const DEFAULT_STORAGE_KEY = 'tui_image_editor_state';

/**
 * PersistenceManager class
 * Manages persisting and restoring image editor UI state (active tool, tool settings, toolbar/layer positions)
 * @class
 */
class PersistenceManager {
  /**
   * @param {Object} [options] - Persistence options
   *   @param {boolean} [options.enable=true] - Whether persistence is enabled
   *   @param {string} [options.storageKey='tui_image_editor_state'] - localStorage key
   */
  constructor(options = {}) {
    this._enabled = options.enable !== false;
    this._storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    this._debounceTimer = null;
    this._state = this._load();
  }

  /**
   * Whether persistence is enabled
   * @returns {boolean}
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Storage key
   * @returns {string}
   */
  get storageKey() {
    return this._storageKey;
  }

  /**
   * Load state from storage
   * @returns {Object}
   * @private
   */
  // eslint-disable-next-line complexity
  _load() {
    if (!this._enabled) {
      return {};
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this._storageKey);
        if (raw) {
          return JSON.parse(raw) || {};
        }
      }
    } catch (e) {
      // In case localStorage is blocked or throws
    }

    return {};
  }

  /**
   * Flush state directly to localStorage
   * @private
   */
  _flush() {
    if (!this._enabled) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this._storageKey, JSON.stringify(this._state));
      }
    } catch (e) {
      // In case quota exceeded or storage disabled
    }
  }

  /**
   * Save partial state
   * @param {Object} partialState - Partial state to merge
   * @param {boolean} [immediate=false] - Whether to write immediately without debouncing
   */
  saveState(partialState, immediate = false) {
    if (!this._enabled) {
      return;
    }

    this._state = extend({}, this._state, partialState);

    if (immediate) {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = null;
      }
      this._flush();
    } else {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null;
        this._flush();
      }, 150);
    }
  }

  /**
   * Get complete state snapshot
   * @returns {Object}
   */
  getState() {
    return extend({}, this._state);
  }

  /**
   * Save active menu
   * @param {string|null} menuName - Active menu name
   */
  saveActiveMenu(menuName) {
    this.saveState({ activeMenu: menuName }, true);
  }

  /**
   * Get active menu
   * @returns {string|null}
   */
  getActiveMenu() {
    return this._state && typeof this._state.activeMenu !== 'undefined'
      ? this._state.activeMenu
      : null;
  }

  /**
   * Save toolbar position
   * @param {Object} pos - { left, top }
   */
  saveToolbarPosition(pos) {
    const toolbar = extend({}, this._state.toolbar, { position: pos });
    this.saveState({ toolbar }, true);
  }

  /**
   * Save toolbar collapsed state
   * @param {boolean} collapsed - Collapsed state
   */
  saveToolbarCollapsed(collapsed) {
    const toolbar = extend({}, this._state.toolbar, { collapsed });
    this.saveState({ toolbar }, true);
  }

  /**
   * Get toolbar state
   * @returns {Object|null}
   */
  getToolbarState() {
    return (this._state && this._state.toolbar) || null;
  }

  /**
   * Save layer panel position
   * @param {Object} pos - { left, top }
   */
  saveLayerPosition(pos) {
    const layer = extend({}, this._state.layer, { position: pos });
    this.saveState({ layer }, true);
  }

  /**
   * Save layer panel collapsed state
   * @param {boolean} collapsed - Collapsed state
   */
  saveLayerCollapsed(collapsed) {
    const layer = extend({}, this._state.layer, { collapsed });
    this.saveState({ layer }, true);
  }

  /**
   * Get layer panel state
   * @returns {Object|null}
   */
  getLayerState() {
    return (this._state && this._state.layer) || null;
  }

  /**
   * Save tool configuration
   * @param {string} toolName - Tool name (draw, shape, text, etc.)
   * @param {Object} config - Tool configuration
   */
  saveToolConfig(toolName, config) {
    const tools = extend({}, this._state.tools);
    tools[toolName] = extend({}, tools[toolName], config);
    this.saveState({ tools });
  }

  /**
   * Get tool configuration
   * @param {string} toolName - Tool name
   * @returns {Object|null}
   */
  getToolConfig(toolName) {
    return (this._state && this._state.tools && this._state.tools[toolName]) || null;
  }

  /**
   * Clear persisted state
   */
  clear() {
    this._state = {};
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    if (!this._enabled) {
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this._storageKey);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Destroy instance
   */
  destroy() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._state = {};
  }
}

export default PersistenceManager;
