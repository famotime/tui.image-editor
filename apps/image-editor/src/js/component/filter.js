import isUndefined from 'tui-code-snippet/type/isUndefined';
import extend from 'tui-code-snippet/object/extend';
import forEach from 'tui-code-snippet/collection/forEach';
import { fabric } from 'fabric';
import Component from '@/interface/component';
import { rejectMessages, componentNames } from '@/consts';
import Mask from '@/extension/mask';
import Sharpen from '@/extension/sharpen';
import Emboss from '@/extension/emboss';
import ColorFilter from '@/extension/colorFilter';

const { filters } = fabric.Image;

filters.Mask = Mask;
filters.Sharpen = Sharpen;
filters.Emboss = Emboss;
filters.ColorFilter = ColorFilter;

/**
 * Filter
 * @class Filter
 * @param {Graphics} graphics - Graphics instance
 * @extends {Component}
 * @ignore
 */
class Filter extends Component {
  constructor(graphics) {
    super(componentNames.FILTER, graphics);
  }

  /**
   * Add filter to source image (a specific filter is added on fabric.js)
   * @param {string} type - Filter type
   * @param {Object} [options] - Options of filter
   * @returns {Promise}
   */
  add(type, options) {
    return new Promise((resolve, reject) => {
      const sourceImg = this._getSourceImage();
      const canvas = this.getCanvas();
      let imgFilter = this._getFilter(sourceImg, type);
      if (!imgFilter) {
        imgFilter = this._createFilter(sourceImg, type, options);
      }

      if (!imgFilter) {
        reject(rejectMessages.invalidParameters);
      }

      this._changeFilterValues(imgFilter, options);

      this._apply(sourceImg, () => {
        canvas.renderAll();
        resolve({
          type,
          action: 'add',
          options,
        });
      });
    });
  }

  /**
   * Remove filter to source image
   * @param {string} type - Filter type
   * @returns {Promise}
   */
  remove(type) {
    return new Promise((resolve, reject) => {
      const sourceImg = this._getSourceImage();
      const canvas = this.getCanvas();
      const options = this.getOptions(type);

      if (!sourceImg.filters.length) {
        reject(rejectMessages.unsupportedOperation);
      }

      this._removeFilter(sourceImg, type);

      this._apply(sourceImg, () => {
        canvas.renderAll();
        resolve({
          type,
          action: 'remove',
          options,
        });
      });
    });
  }

  /**
   * Whether this has the filter or not
   * @param {string} type - Filter type
   * @returns {boolean} true if it has the filter
   */
  hasFilter(type) {
    return !!this._getFilter(this._getSourceImage(), type);
  }

  /**
   * Get a filter options
   * @param {string} type - Filter type
   * @returns {Object} filter options or null if there is no that filter
   */
  getOptions(type) {
    const sourceImg = this._getSourceImage();
    const imgFilter = this._getFilter(sourceImg, type);
    if (!imgFilter) {
      return null;
    }

    return extend({}, imgFilter.options);
  }

  /**
   * Change filter values
   * @param {Object} imgFilter object of filter
   * @param {Object} options object
   * @private
   */
  _changeFilterValues(imgFilter, options) {
    forEach(options, (value, key) => {
      if (!isUndefined(imgFilter[key])) {
        imgFilter[key] = value;
      }
    });
    forEach(imgFilter.options, (value, key) => {
      if (!isUndefined(options[key])) {
        imgFilter.options[key] = options[key];
      }
    });
  }

  /**
   * Apply filter
   * @param {fabric.Image} sourceImg - Source image to apply filter
   * @param {function} callback - Executed function after applying filter
   * @private
   */
  _apply(sourceImg, callback) {
    sourceImg.filters.push();
    const result = sourceImg.applyFilters();
    if (result) {
      callback();
    }
  }

  /**
   * Get source image on canvas
   * @returns {fabric.Image} Current source image on canvas
   * @private
   */
  _getSourceImage() {
    return this.getCanvasImage();
  }

  /**
   * Create filter instance
   * @param {fabric.Image} sourceImg - Source image to apply filter
   * @param {string} type - Filter type
   * @param {Object} [options] - Options of filter
   * @returns {Object} Fabric object of filter
   * @private
   */
  _createFilter(sourceImg, type, options) {
    let filterObj;
    // capitalize first letter for matching with fabric image filter name
    const fabricType = this._getFabricFilterType(type);
    const ImageFilter = fabric.Image.filters[fabricType];
    if (ImageFilter) {
      filterObj = new ImageFilter(options);
      filterObj.options = options;
      sourceImg.filters.push(filterObj);
    }

    return filterObj;
  }

  /**
   * 检查滤镜对象是否与请求的类型和模式匹配
   * @param {Object} item - 滤镜对象
   * @param {string} fabricType - Fabric 滤镜类型
   * @param {string} type - 滤镜类型
   * @returns {boolean} 是否匹配
   * @private
   */
  _matchesFilter(item, fabricType, type) {
    if (item.type !== fabricType) {
      return false;
    }
    if (fabricType !== 'BlendColor') {
      return true;
    }
    const { mode } = item;
    if (type === 'tint' || type === 'multiply') {
      return mode === type;
    }

    return mode !== 'tint' && mode !== 'multiply';
  }

  /**
   * Get applied filter instance
   * @param {fabric.Image} sourceImg - Source image to apply filter
   * @param {string} type - Filter type
   * @returns {Object} Fabric object of filter
   * @private
   */
  _getFilter(sourceImg, type) {
    if (!sourceImg) {
      return null;
    }
    const fabricType = this._getFabricFilterType(type);

    return sourceImg.filters.find((item) => this._matchesFilter(item, fabricType, type)) || null;
  }

  /**
   * Remove applied filter instance
   * @param {fabric.Image} sourceImg - Source image to apply filter
   * @param {string} type - Filter type
   * @private
   */
  _removeFilter(sourceImg, type) {
    const fabricType = this._getFabricFilterType(type);
    sourceImg.filters = sourceImg.filters.filter(
      (item) => !this._matchesFilter(item, fabricType, type)
    );
  }

  /**
   * Change filter class name to fabric's, especially capitalizing first letter
   * @param {string} type - Filter type
   * @example
   * 'grayscale' -> 'Grayscale'
   * @returns {string} Fabric filter class name
   */
  _getFabricFilterType(type) {
    const fabricType = type.charAt(0).toUpperCase() + type.slice(1);
    if (fabricType === 'Tint' || fabricType === 'Multiply') {
      return 'BlendColor';
    }

    return fabricType;
  }
}

export default Filter;
