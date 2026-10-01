import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/compress';
import { assignmentForDestroy } from '@/util';
import Range from '@/ui/tools/range';
import { defaultCompressRangeValues } from '@/consts';
import { formatFileSize } from '@/component/compress';

const DEBOUNCE_DELAY = 150;

/**
 * Compress UI class
 * @class
 * @ignore
 */
class Compress extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'compress',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this.locale = locale;
    this.status = 'active';
    this._quality = defaultCompressRangeValues.qualityRange.value || 80;
    this._format = 'auto';
    this._updateTimer = null;

    this._els = {
      qualityRange: new Range(
        {
          slider: this.selector('.tie-compress-quality-range'),
          input: this.selector('.tie-compress-quality-range-value'),
        },
        defaultCompressRangeValues.qualityRange
      ),
      formatButtons: this.selector('.tie-compress-format-button'),
      statsText: this.selector('.tie-compress-stats-text'),
      apply: this.selector('.tie-compress-button .apply'),
      cancel: this.selector('.tie-compress-button .cancel'),
    };
  }

  /**
   * Executed when menu starts
   */
  // eslint-disable-next-line complexity
  changeStartMode() {
    if (this.actions && this.actions.resetZoom) {
      this.actions.resetZoom();
    }
    if (this.actions && this.actions.modeChange) {
      this.actions.modeChange('compress');
    }

    if (this.actions && this.actions.start) {
      this.actions
        .start({
          quality: this._quality,
          format: this._format,
          onStatsChange: this.updateStats.bind(this),
        })
        .then((stats) => {
          if (stats) {
            this.updateStats(stats);
          }
        });
    }
  }

  /**
   * Return menu to default state
   */
  changeStandbyMode() {
    if (this.actions && this.actions.stopDrawingMode) {
      this.actions.stopDrawingMode();
    }
    if (this.actions && this.actions.end) {
      this.actions.end();
    }
  }

  /**
   * Update stats display
   * @param {Object} stats
   */
  // eslint-disable-next-line complexity
  updateStats(stats) {
    if (!this._els || !this._els.statsText || !stats) {
      return;
    }
    const origLabel = (this.locale && this.locale.localize('Original')) || '原图';
    const compLabel = (this.locale && this.locale.localize('Compressed')) || '压缩后';
    const origStr = formatFileSize(stats.originalSize);
    const compStr = formatFileSize(stats.compressedSize);
    let rateStr = '0%';
    if (stats.reductionRate > 0) {
      rateStr = `-${stats.reductionRate}%`;
    } else if (stats.reductionRate < 0) {
      rateStr = `+${Math.abs(stats.reductionRate)}%`;
    }

    this._els.statsText.innerText = `${origLabel}: ${origStr} → ${compLabel}: ${compStr} (${rateStr})`;
  }

  /**
   * Add event listeners
   * @param {Object} actions
   */
  addEvent(actions) {
    this.actions = actions;

    // Quality range change listener
    this._els.qualityRange.on('change', (value) => {
      this._quality = value;
      if (this._updateTimer) {
        clearTimeout(this._updateTimer);
      }
      this._updateTimer = setTimeout(() => {
        this.actions
          .update({
            quality: this._quality,
            format: this._format,
          })
          .then((stats) => {
            if (stats) {
              this.updateStats(stats);
            }
          });
      }, DEBOUNCE_DELAY);
    });

    // Format selection buttons
    if (this._els.formatButtons) {
      this._els.formatButtons.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.tui-image-editor-button.format');
        if (!targetBtn) {
          return;
        }

        const buttons = this._els.formatButtons.querySelectorAll('.tui-image-editor-button.format');
        buttons.forEach((btn) => btn.classList.remove('active'));
        targetBtn.classList.add('active');

        this._format = targetBtn.getAttribute('data-format') || 'auto';
        this.actions
          .update({
            quality: this._quality,
            format: this._format,
          })
          .then((stats) => {
            if (stats) {
              this.updateStats(stats);
            }
          });
      });
    }

    // Apply button
    if (this._els.apply) {
      this._els.apply.addEventListener('click', () => {
        this.actions.apply({
          quality: this._quality,
          format: this._format,
        });
      });
    }

    // Cancel button
    if (this._els.cancel) {
      this._els.cancel.addEventListener('click', () => {
        this.actions.cancel();
      });
    }
  }

  /**
   * Destroy instance
   */
  destroy() {
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = null;
    }
    assignmentForDestroy(this);
  }
}

export default Compress;
