import CustomEvents from 'tui-code-snippet/customEvents/customEvents';
import { drawingModes } from '@/consts';

const VALID_MODES = new Set(Object.values(drawingModes));

const PERSISTENT_MODES = new Set([
  'draw',
  'crop',
  'resize',
  'shape',
  'icon',
  'mosaic',
  'lasso',
  'annotation',
  'eraser',
  drawingModes.FREE_DRAWING,
  drawingModes.LINE_DRAWING,
  drawingModes.CROPPER,
  drawingModes.RESIZE,
  drawingModes.SHAPE,
  drawingModes.ICON,
  drawingModes.LASSO,
  drawingModes.ANNOTATION,
  drawingModes.ERASER,
]);

/**
 * EditorStateMachine
 * Manages drawing modes, mode options, and mode transitions with explicit guards and state suspension.
 * @class
 */
export class EditorStateMachine {
  constructor() {
    this._mode = drawingModes.NORMAL;
    this._options = null;
    this._suspended = null;
    this._isTransitioning = false;
  }

  /**
   * Get current drawing mode
   * @returns {string}
   */
  get mode() {
    return this._mode;
  }

  /**
   * Get current drawing mode options
   * @returns {Object|null}
   */
  get options() {
    return this._options;
  }

  /**
   * Check whether a mode is currently suspended (e.g., during hand/pan mode)
   * @returns {boolean}
   */
  get isSuspended() {
    return this._suspended !== null;
  }

  /**
   * Check if current mode matches given mode
   * @param {string} mode
   * @returns {boolean}
   */
  isMode(mode) {
    return this._mode === mode;
  }

  /**
   * Determine if the given mode should remain active when selection is cleared
   * @param {string} modeName
   * @returns {boolean}
   */
  shouldKeepModeOnDeselect(modeName) {
    return PERSISTENT_MODES.has(modeName);
  }

  /**
   * Transition to a new drawing mode
   * @param {string} targetMode
   * @param {Object} [options]
   * @returns {{from: string, to: string, options: Object|null}|null} Transition details or null if no change
   */
  transition(targetMode, options = null) {
    if (!VALID_MODES.has(targetMode)) {
      return null;
    }

    if (this._mode === targetMode) {
      this._options = options;

      return null;
    }

    const fromMode = this._mode;
    this._isTransitioning = true;

    this.fire('transitionStart', { from: fromMode, to: targetMode, options });

    this._mode = targetMode;
    this._options = targetMode === drawingModes.NORMAL ? null : options;
    this._isTransitioning = false;

    this.fire('transitionEnd', { from: fromMode, to: targetMode, options: this._options });
    this.fire('modeChanged', targetMode);

    return { from: fromMode, to: targetMode, options: this._options };
  }

  /**
   * Suspend the current drawing mode and its options (used by Hand/Zoom pan mode)
   * @returns {boolean} true if a non-normal mode was suspended
   */
  suspend() {
    if (this._mode !== drawingModes.NORMAL && this._mode !== drawingModes.ZOOM) {
      this._suspended = {
        mode: this._mode,
        options: this._options,
      };
      this.transition(drawingModes.NORMAL);

      return true;
    }

    return false;
  }

  /**
   * Restore the suspended mode and options
   * @returns {{mode: string, options: Object|null}|null} Restored mode info or null
   */
  restore() {
    if (this._suspended) {
      const { mode, options } = this._suspended;
      this._suspended = null;
      this.transition(mode, options);

      return { mode, options };
    }

    return null;
  }

  /**
   * Clear any suspended mode without restoring it
   */
  clearSuspended() {
    this._suspended = null;
  }

  /**
   * Reset the state machine to NORMAL mode
   */
  reset() {
    this._suspended = null;
    this._options = null;
    this._isTransitioning = false;
    this.transition(drawingModes.NORMAL);
  }
}

CustomEvents.mixin(EditorStateMachine);

export default EditorStateMachine;
