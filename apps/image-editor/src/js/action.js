import { fabric } from 'fabric';
import extend from 'tui-code-snippet/object/extend';
import Imagetracer from '@/helper/imagetracer';
import {
  isSupportFileApi,
  base64ToBlob,
  toInteger,
  isEmptyCropzone,
  includes,
  getFillTypeFromOption,
} from '@/util';

import { eventNames, historyNames, drawingModes, drawingMenuNames, zoomModes } from '@/consts';

export default {
  /**
   * Get ui actions
   * @returns {Object} actions for ui
   * @private
   */
  getActions() {
    return {
      main: this._mainAction(),
      shape: this._shapeAction(),
      crop: this._cropAction(),
      resize: this._resizeAction(),
      flip: this._flipAction(),
      rotate: this._rotateAction(),
      text: this._textAction(),
      mask: this._maskAction(),
      draw: this._drawAction(),
      icon: this._iconAction(),
      filter: this._filterAction(),
      history: this._historyAction(),
      mosaic: this._mosaicAction(),
      annotation: this._annotationAction(),
    };
  },

  /**
   * Main Action
   * @returns {Object} actions for ui main
   * @private
   */
  _mainAction() {
    const exitCropOnAction = () => {
      if (this.ui.submenu === 'crop') {
        this.stopDrawingMode();
        this.ui.changeMenu('crop');
      }
    };
    const setAngleRangeBarOnAction = (angle) => {
      if (this.ui.submenu === 'rotate') {
        this.ui.rotate.setRangeBarAngle('setAngle', angle);
      }
    };
    const setFilterStateRangeBarOnAction = (filterOptions) => {
      if (this.ui.submenu === 'filter') {
        this.ui.filter.setFilterState(filterOptions);
      }
    };
    const onEndUndoRedo = (result) => {
      setAngleRangeBarOnAction(result);
      setFilterStateRangeBarOnAction(result);

      return result;
    };

    const toggleHandMode = () => {
      const zoomMode = this._graphics.getZoomMode();

      this.stopDrawingMode();
      if (zoomMode !== zoomModes.HAND) {
        this.startDrawingMode(drawingModes.ZOOM);
        this._graphics.startHandMode();
      } else {
        this._graphics.endHandMode();
      }
    };
    const initFilterState = () => {
      if (this.ui.filter) {
        this.ui.filter.initFilterCheckBoxState();
      }
    };

    return extend(
      {
        adjustCanvasDimension: () => {
          if (this._graphics.getZoomLevel() === 1.0) {
            this._graphics.adjustCanvasDimension();
          }
        },
        initLoadImage: (imagePath, imageName) =>
          this.loadImageFromURL(imagePath, imageName).then((sizeValue) => {
            exitCropOnAction();
            this.ui.initializeImgUrl = imagePath;
            this.ui.resizeEditor({ imageSize: sizeValue });
            this.clearUndoStack();
            this._invoker.fire(eventNames.EXECUTE_COMMAND, historyNames.LOAD_IMAGE);
          }),
        undo: () => {
          if (!this.isEmptyUndoStack()) {
            exitCropOnAction();
            this.deactivateAll();
            this.undo().then(onEndUndoRedo);
          }
        },
        redo: () => {
          if (!this.isEmptyRedoStack()) {
            exitCropOnAction();
            this.deactivateAll();
            this.redo().then(onEndUndoRedo);
          }
        },
        reset: () => {
          exitCropOnAction();
          this.loadImageFromURL(this.ui.initializeImgUrl, 'resetImage').then((sizeValue) => {
            exitCropOnAction();
            initFilterState();
            this.ui.resizeEditor({ imageSize: sizeValue });
            this.clearUndoStack();
            this._initHistory();
          });
        },
        delete: () => {
          this.ui.changeHelpButtonEnabled('delete', false);
          exitCropOnAction();
          this.removeActiveObject();
          this.activeObjectId = null;
        },
        deleteAll: () => {
          exitCropOnAction();
          this.clearObjects();
          this.ui.changeHelpButtonEnabled('delete', false);
          this.ui.changeHelpButtonEnabled('deleteAll', false);
        },
        load: (file) => {
          if (!isSupportFileApi()) {
            alert('This browser does not support file-api');
          }

          this.ui.initializeImgUrl = URL.createObjectURL(file);
          this.loadImageFromFile(file)
            .then((sizeValue) => {
              exitCropOnAction();
              initFilterState();
              this.clearUndoStack();
              this.ui.activeMenuEvent();
              this.ui.resizeEditor({ imageSize: sizeValue });
              this._clearHistory();
              this._invoker.fire(eventNames.EXECUTE_COMMAND, historyNames.LOAD_IMAGE);
            })
            ['catch']((message) => Promise.reject(message));
        },
        viewOriginal: () => this.toggleAllObjectsVisibility(),
        download: () => {
          const dataURL = this.toDataURL();
          let imageName = this.getImageName();
          let blob, type, w;

          if (isSupportFileApi() && window.saveAs) {
            blob = base64ToBlob(dataURL);
            type = blob.type.split('/')[1];
            if (imageName.split('.').pop() !== type) {
              imageName += `.${type}`;
            }
            saveAs(blob, imageName); // eslint-disable-line
          } else {
            w = window.open();
            w.document.body.innerHTML = `<img src='${dataURL}'>`;
          }
        },
        history: (event) => {
          this.ui.toggleHistoryMenu(event);
        },
        zoomIn: () => {
          this._graphics.zoomIn();
        },
        zoomOut: () => {
          this._graphics.zoomOut();
        },
        hand: () => {
          this.ui.offZoomInButtonStatus();
          this.ui.toggleZoomButtonStatus('hand');
          this.deactivateAll();
          toggleHandMode();
        },
      },
      this._commonAction()
    );
  },

  /**
   * Icon Action
   * @returns {Object} actions for ui icon
   * @private
   */
  _iconAction() {
    return extend(
      {
        changeColor: (color) => {
          if (this.activeObjectId) {
            this.changeIconColor(this.activeObjectId, color);
          }
        },
        addIcon: (iconType, iconColor) => {
          this.startDrawingMode('ICON');
          this.setDrawingIcon(iconType, iconColor);
        },
        cancelAddIcon: () => {
          this.ui.icon.clearIconType();
          this.changeSelectableAll(true);
          this.changeCursor('default');
          this.stopDrawingMode();
        },
        registerDefaultIcons: (type, path) => {
          const iconObj = {};
          iconObj[type] = path;
          this.registerIcons(iconObj);
        },
        registerCustomIcon: (imgUrl, file) => {
          const imagetracer = new Imagetracer();
          imagetracer.imageToSVG(
            imgUrl,
            (svgstr) => {
              const [, svgPath] = svgstr.match(/path[^>]*d="([^"]*)"/);
              const iconObj = {};
              iconObj[file.name] = svgPath;
              this.registerIcons(iconObj);
              this.addIcon(file.name, {
                left: 100,
                top: 100,
              });
            },
            Imagetracer.tracerDefaultOption()
          );
        },
      },
      this._commonAction()
    );
  },

  /**
   * Draw Action
   * @returns {Object} actions for ui draw
   * @private
   */
  _drawAction() {
    // 初始化 canvas 箭头事件监听（在首次 setDrawMode 时调用一次）
    this._arrowListenersInitialized = false;

    /**
     * 获取路径段终点坐标
     * @param {Array} segment - SVG 路径段数组
     * @returns {{x: number, y: number}|null}
     */
    const getSegmentEndPoint = (segment) => {
      if (!segment || segment.length < 3) {
        return null;
      }
      const [type] = segment;
      const typeMap = {
        M: { x: segment[1], y: segment[2] },
        L: { x: segment[1], y: segment[2] },
        Q: { x: segment[3], y: segment[4] },
        C: { x: segment[5], y: segment[6] },
      };

      return typeMap[type] || null;
    };

    /**
     * 计算贝塞尔曲线末端切线方向向量
     */
    const getBezierEndDirection = (lastSeg, type) => {
      if (type === 'Q' && lastSeg.length >= 5) {
        return { dx: lastSeg[3] - lastSeg[1], dy: lastSeg[4] - lastSeg[2] };
      }
      if (type === 'C' && lastSeg.length >= 7) {
        return { dx: lastSeg[5] - lastSeg[3], dy: lastSeg[6] - lastSeg[4] };
      }

      return null;
    };

    /**
     * 获取画笔或路径的描边宽度，默认为 1
     */
    const getStrokeWidth = (pathObj) => pathObj.strokeWidth || 1;

    /**
     * 更新 Polyline 路径维度属性
     */
    const updatePositionDimensions = (pathObj) => {
      if (fabric.Polyline && fabric.Polyline.prototype._setPositionDimensions) {
        fabric.Polyline.prototype._setPositionDimensions.call(pathObj, {});
      }
    };

    /**
     * 判断对象是否为尚未处理箭头的直线对象
     */
    const isLineWithoutArrow = (obj) => obj && obj.type === 'line' && !obj._arrowProcessed;

    /**
     * 判断箭头类型是否有效
     */
    const isValidArrowType = (type) => type === 'single' || type === 'double';

    /**
     * 判断路径数据是否有效
     */
    const isValidPathData = (pathData) => pathData && pathData.length >= 2;

    /**
     * 回退计算路径末尾割线方向向量
     */
    const getFallbackEndDirection = (pathData, endPt) => {
      for (let i = pathData.length - 2; i >= 0; i -= 1) {
        const prevPt = getSegmentEndPoint(pathData[i]);
        if (prevPt) {
          const dx = endPt.x - prevPt.x;
          const dy = endPt.y - prevPt.y;
          if (dx !== 0 || dy !== 0) {
            return { dx, dy };
          }
        }
      }

      return null;
    };

    /**
     * 计算路径末尾切线方向向量（尾部箭头朝向外侧，即沿切线正方向）
     */
    const getEndDirection = (pathData) => {
      if (pathData.length < 2) {
        return null;
      }
      const lastSeg = pathData[pathData.length - 1];
      const [type] = lastSeg;

      const bezierDir = getBezierEndDirection(lastSeg, type);
      if (bezierDir && (bezierDir.dx !== 0 || bezierDir.dy !== 0)) {
        return bezierDir;
      }

      const endPt = getSegmentEndPoint(lastSeg);
      if (!endPt) {
        return null;
      }

      return getFallbackEndDirection(pathData, endPt);
    };

    /**
     * 计算贝塞尔曲线起点反向切线方向向量
     */
    const getBezierStartDirection = (nextSeg, type, startPt) => {
      if (type === 'Q' && nextSeg.length >= 5) {
        return { dx: startPt.x - nextSeg[1], dy: startPt.y - nextSeg[2] };
      }
      if (type === 'C' && nextSeg.length >= 7) {
        return { dx: startPt.x - nextSeg[1], dy: startPt.y - nextSeg[2] };
      }

      return null;
    };

    /**
     * 回退计算路径起始首段割线反向向量
     */
    const getFallbackStartDirection = (pathData, startPt) => {
      for (let i = 1; i < pathData.length; i += 1) {
        const nextPt = getSegmentEndPoint(pathData[i]);
        if (nextPt) {
          const dx = startPt.x - nextPt.x;
          const dy = startPt.y - nextPt.y;
          if (dx !== 0 || dy !== 0) {
            return { dx, dy };
          }
        }
      }

      return null;
    };

    /**
     * 计算路径起始切线方向向量（头部箭头朝向外侧，即沿切线反方向）
     */
    const getStartDirection = (pathData) => {
      if (pathData.length < 2) {
        return null;
      }
      const startPt = { x: pathData[0][1], y: pathData[0][2] };
      const [, nextSeg] = pathData;
      const [type] = nextSeg;

      const bezierDir = getBezierStartDirection(nextSeg, type, startPt);
      if (bezierDir && (bezierDir.dx !== 0 || bezierDir.dy !== 0)) {
        return bezierDir;
      }

      return getFallbackStartDirection(pathData, startPt);
    };

    /**
     * 添加尾部箭头数据到路径
     */
    const addEndArrow = (newPathData, pathData, len, arrowAngle) => {
      const endPt = getSegmentEndPoint(pathData[pathData.length - 1]);
      const endDir = getEndDirection(pathData);
      if (endPt && endDir) {
        const angle = Math.atan2(endDir.dy, endDir.dx);
        newPathData.push([
          'M',
          endPt.x + len * Math.cos(angle + arrowAngle),
          endPt.y + len * Math.sin(angle + arrowAngle),
        ]);
        newPathData.push(['L', endPt.x, endPt.y]);
        newPathData.push([
          'L',
          endPt.x + len * Math.cos(angle - arrowAngle),
          endPt.y + len * Math.sin(angle - arrowAngle),
        ]);
      }
    };

    /**
     * 添加头部箭头数据到路径
     */
    const addStartArrow = (newPathData, pathData, len, arrowAngle) => {
      const startPt = { x: pathData[0][1], y: pathData[0][2] };
      const startDir = getStartDirection(pathData);
      if (startDir) {
        const angle = Math.atan2(startDir.dy, startDir.dx);
        newPathData.push([
          'M',
          startPt.x + len * Math.cos(angle + arrowAngle),
          startPt.y + len * Math.sin(angle + arrowAngle),
        ]);
        newPathData.push(['L', startPt.x, startPt.y]);
        newPathData.push([
          'L',
          startPt.x + len * Math.cos(angle - arrowAngle),
          startPt.y + len * Math.sin(angle - arrowAngle),
        ]);
      }
    };

    /**
     * 初始化 canvas 箭头事件监听（只执行一次）
     */
    const initArrowListeners = () => {
      if (this._arrowListenersInitialized) return;
      this._arrowListenersInitialized = true;

      const canvas = this._graphics.getCanvas();

      // 监听自由画笔路径创建
      canvas.on('path:created', (options) => {
        const { arrowType } = this.ui.draw;
        const originalPath = options ? options.path : null;
        if (!originalPath) {
          return;
        }

        const pathData = originalPath.path;
        if (!isValidPathData(pathData)) {
          return;
        }

        const strokeWidth = getStrokeWidth(originalPath);
        const len = Math.max(12, strokeWidth * 3);
        const arrowAngle = (Math.PI * 5) / 6;
        const newPathData = [...pathData];

        if (arrowType === 'double') {
          addStartArrow(newPathData, pathData, len, arrowAngle);
          addEndArrow(newPathData, pathData, len, arrowAngle);
        } else if (arrowType === 'single') {
          addEndArrow(newPathData, pathData, len, arrowAngle);
        } else {
          return;
        }

        originalPath.path = newPathData;
        updatePositionDimensions(originalPath);
        originalPath.setCoords();
        canvas.renderAll();
      });

      // 监听直线工具对象添加（fabric.Line）
      canvas.on('object:added', (options) => {
        const { arrowType } = this.ui.draw;
        const obj = options.target;
        if (!isLineWithoutArrow(obj) || !isValidArrowType(arrowType)) {
          return;
        }

        obj._arrowProcessed = true;
        const capturedArrowType = arrowType; // 捕获当前箭头类型
        const strokeWidth = getStrokeWidth(obj);
        const len = Math.max(12, strokeWidth * 3);
        const arrowAngle = (Math.PI * 5) / 6;
        const originalRender = obj._render.bind(obj);

        obj._render = function (ctx) {
          // 先绘制原本的直线
          originalRender(ctx);

          // 计算相对于直线中心点的局部坐标
          const cx = (this.x1 + this.x2) / 2;
          const cy = (this.y1 + this.y2) / 2;
          const startPt = { x: this.x1 - cx, y: this.y1 - cy };
          const endPt = { x: this.x2 - cx, y: this.y2 - cy };

          ctx.save();
          ctx.strokeStyle = this.stroke;
          ctx.lineWidth = this.strokeWidth;
          ctx.lineCap = this.strokeLineCap;
          ctx.lineJoin = this.strokeLineJoin;

          // 尾部箭头
          if (capturedArrowType === 'single' || capturedArrowType === 'double') {
            const dx = endPt.x - startPt.x;
            const dy = endPt.y - startPt.y;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(
              endPt.x + len * Math.cos(angle + arrowAngle),
              endPt.y + len * Math.sin(angle + arrowAngle)
            );
            ctx.lineTo(endPt.x, endPt.y);
            ctx.lineTo(
              endPt.x + len * Math.cos(angle - arrowAngle),
              endPt.y + len * Math.sin(angle - arrowAngle)
            );
            ctx.stroke();
          }

          // 头部箭头
          if (capturedArrowType === 'double') {
            const dx = startPt.x - endPt.x;
            const dy = startPt.y - endPt.y;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(
              startPt.x + len * Math.cos(angle + arrowAngle),
              startPt.y + len * Math.sin(angle + arrowAngle)
            );
            ctx.lineTo(startPt.x, startPt.y);
            ctx.lineTo(
              startPt.x + len * Math.cos(angle - arrowAngle),
              startPt.y + len * Math.sin(angle - arrowAngle)
            );
            ctx.stroke();
          }

          ctx.restore();
        };
      });
    };

    return extend(
      {
        setDrawMode: (type, settings) => {
          this.stopDrawingMode();
          // 首次调用时初始化箭头事件监听
          initArrowListeners();
          if (type === 'free') {
            this.startDrawingMode('FREE_DRAWING', settings);
          } else {
            this.startDrawingMode('LINE_DRAWING', settings);
          }
        },
        setColor: (color) => {
          this.setBrush({
            color,
          });
        },
      },
      this._commonAction()
    );
  },

  /**
   * Mask Action
   * @returns {Object} actions for ui mask
   * @private
   */
  _maskAction() {
    return extend(
      {
        loadImageFromURL: (imgUrl, file) => {
          return this.loadImageFromURL(this.toDataURL(), 'FilterImage').then(() => {
            this.addImageObject(imgUrl).then(() => {
              URL.revokeObjectURL(file);
            });
            this._invoker.fire(eventNames.EXECUTE_COMMAND, historyNames.LOAD_MASK_IMAGE);
          });
        },
        applyFilter: () => {
          this.applyFilter('mask', {
            maskObjId: this.activeObjectId,
          });
        },
      },
      this._commonAction()
    );
  },

  /**
   * Text Action
   * @returns {Object} actions for ui text
   * @private
   */
  _textAction() {
    return extend(
      {
        changeTextStyle: (styleObj, isSilent) => {
          if (this.activeObjectId) {
            this.changeTextStyle(this.activeObjectId, styleObj, isSilent);
          }
        },
      },
      this._commonAction()
    );
  },

  /**
   * Rotate Action
   * @returns {Object} actions for ui rotate
   * @private
   */
  _rotateAction() {
    return extend(
      {
        rotate: (angle, isSilent) => {
          this.rotate(angle, isSilent);
          this.ui.resizeEditor();
          this.ui.rotate.setRangeBarAngle('rotate', angle);
        },
        setAngle: (angle, isSilent) => {
          this.setAngle(angle, isSilent);
          this.ui.resizeEditor();
          this.ui.rotate.setRangeBarAngle('setAngle', angle);
        },
      },
      this._commonAction()
    );
  },

  /**
   * Shape Action
   * @returns {Object} actions for ui shape
   * @private
   */
  _shapeAction() {
    return extend(
      {
        changeShape: (changeShapeObject, isSilent) => {
          if (this.activeObjectId) {
            this.changeShape(this.activeObjectId, changeShapeObject, isSilent);
          }
        },
        setDrawingShape: (shapeType, options) => {
          this.setDrawingShape(shapeType, options);
        },
      },
      this._commonAction()
    );
  },

  /**
   * Crop Action
   * @returns {Object} actions for ui crop
   * @private
   */
  _cropAction() {
    return extend(
      {
        crop: () => {
          const cropRect = this.getCropzoneRect();
          if (cropRect && !isEmptyCropzone(cropRect)) {
            this.crop(cropRect)
              .then(() => {
                this.stopDrawingMode();
                this.ui.resizeEditor();
                this.ui.changeMenu('crop');
                this._invoker.fire(eventNames.EXECUTE_COMMAND, historyNames.CROP);
              })
              ['catch']((message) => Promise.reject(message));
          }
        },
        cancel: () => {
          this.stopDrawingMode();
          this.ui.changeMenu('crop');
        },
        /* eslint-disable */
        preset: (presetType) => {
          switch (presetType) {
            case 'preset-square':
              this.setCropzoneRect(1 / 1);
              break;
            case 'preset-3-2':
              this.setCropzoneRect(3 / 2);
              break;
            case 'preset-4-3':
              this.setCropzoneRect(4 / 3);
              break;
            case 'preset-5-4':
              this.setCropzoneRect(5 / 4);
              break;
            case 'preset-7-5':
              this.setCropzoneRect(7 / 5);
              break;
            case 'preset-16-9':
              this.setCropzoneRect(16 / 9);
              break;
            default:
              this.setCropzoneRect();
              this.ui.crop.changeApplyButtonStatus(false);
              break;
          }
        },
      },
      this._commonAction()
    );
  },

  /**
   * Resize Action
   * @returns {Object} actions for ui resize
   * @private
   */
  _resizeAction() {
    return extend(
      {
        getCurrentDimensions: () => this._graphics.getCurrentDimensions(),
        preview: (actor, value, lockState) => {
          const currentDimensions = this._graphics.getCurrentDimensions();
          const calcAspectRatio = () => currentDimensions.width / currentDimensions.height;

          let dimensions = {};
          switch (actor) {
            case 'width':
              dimensions.width = value;
              if (lockState) {
                dimensions.height = value / calcAspectRatio();
              } else {
                dimensions.height = currentDimensions.height;
              }
              break;
            case 'height':
              dimensions.height = value;
              if (lockState) {
                dimensions.width = value * calcAspectRatio();
              } else {
                dimensions.width = currentDimensions.width;
              }
              break;
            default:
              dimensions = currentDimensions;
          }

          this._graphics.resize(dimensions).then(() => {
            this.ui.resizeEditor();
          });

          if (lockState) {
            this.ui.resize.setWidthValue(dimensions.width);
            this.ui.resize.setHeightValue(dimensions.height);
          }
        },
        resize: (dimensions = null) => {
          if (!dimensions) {
            dimensions = this._graphics.getCurrentDimensions();
          }

          this.resize(dimensions)
            .then(() => {
              this._graphics.setOriginalDimensions(dimensions);
              this.stopDrawingMode();
              this.ui.resizeEditor();
              this.ui.changeMenu('resize');
            })
            ['catch']((message) => Promise.reject(message));
        },
        reset: (standByMode = false) => {
          const dimensions = this._graphics.getOriginalDimensions();

          this.ui.resize.setWidthValue(dimensions.width, true);
          this.ui.resize.setHeightValue(dimensions.height, true);

          this._graphics.resize(dimensions).then(() => {
            if (!standByMode) {
              this.stopDrawingMode();
              this.ui.resizeEditor();
              this.ui.changeMenu('resize');
            }
          });
        },
      },
      this._commonAction()
    );
  },

  /**
   * Flip Action
   * @returns {Object} actions for ui flip
   * @private
   */
  _flipAction() {
    return extend(
      {
        flip: (flipType) => this[flipType](),
      },
      this._commonAction()
    );
  },

  /**
   * Filter Action
   * @returns {Object} actions for ui filter
   * @private
   */
  _filterAction() {
    return extend(
      {
        applyFilter: (applying, type, options, isSilent) => {
          if (applying) {
            this.applyFilter(type, options, isSilent);
          } else if (this.hasFilter(type)) {
            this.removeFilter(type);
          }
        },
      },
      this._commonAction()
    );
  },

  /**
   * Image Editor Event Observer
   */
  setReAction() {
    this.on({
      undoStackChanged: (length) => {
        if (length) {
          this.ui.changeHelpButtonEnabled('undo', true);
          this.ui.changeHelpButtonEnabled('reset', true);
        } else {
          this.ui.changeHelpButtonEnabled('undo', false);
          this.ui.changeHelpButtonEnabled('reset', false);
        }
        this.ui.resizeEditor();
      },
      redoStackChanged: (length) => {
        if (length) {
          this.ui.changeHelpButtonEnabled('redo', true);
        } else {
          this.ui.changeHelpButtonEnabled('redo', false);
        }
        this.ui.resizeEditor();
      },
      /* eslint-disable complexity */
      objectActivated: (obj) => {
        this.activeObjectId = obj.id;

        this.ui.changeHelpButtonEnabled('delete', true);
        this.ui.changeHelpButtonEnabled('deleteAll', true);

        if (obj.type === 'cropzone') {
          this.ui.crop.changeApplyButtonStatus(true);
        } else if (['rect', 'circle', 'triangle'].indexOf(obj.type) > -1) {
          // obj 是序列化的 props，需要获取真实 fabric 对象才能检查运行时标记
          const fabricObj = this._graphics.getActiveObject();
          const isMosaicShape =
            (fabricObj && fabricObj._isMosaicShape) || getFillTypeFromOption(obj.fill) === 'filter';
          if (isMosaicShape) {
            // 保持在马赛克菜单，不切换到形状工具
            if (this.ui.submenu !== 'mosaic') {
              this.ui.changeMenu('mosaic', false, false);
            }
          } else {
            if (this.getDrawingMode() !== 'SHAPE') {
              this.stopDrawingMode();
            }
            if (this.ui.submenu !== 'shape') {
              this.ui.changeMenu('shape', false, false);
            }
            this.ui.shape.setShapeStatus({
              strokeColor: obj.stroke,
              strokeWidth: obj.strokeWidth,
              fillColor: obj.fill,
            });

            this.ui.shape.setMaxStrokeValue(Math.min(obj.width, obj.height));
          }
        } else if (obj.type === 'path' || obj.type === 'line') {
          // 检查是否为马赛克画笔路径
          const fabricObj = this._graphics.getActiveObject();
          const isMosaicPath =
            (fabricObj && fabricObj._isMosaicPath) || (obj.stroke && obj.stroke.source);
          if (isMosaicPath) {
            if (this.ui.submenu !== 'mosaic') {
              this.ui.changeMenu('mosaic', false, false);
            }
          } else if (this.ui.submenu !== 'mosaic' && this.ui.submenu !== 'draw') {
            this.ui.changeMenu('draw', false, false);
            this.ui.draw.changeStandbyMode();
          }
        } else if (['i-text', 'text'].indexOf(obj.type) > -1) {
          if (this.ui.submenu !== 'text') {
            this.ui.changeMenu('text', false, false);
          }

          this.ui.text.setTextStyleStateOnAction(obj);
        } else if (obj.type === 'icon') {
          if (this.getDrawingMode() !== 'ICON') {
            this.stopDrawingMode();
          }
          if (this.ui.submenu !== 'icon') {
            this.ui.changeMenu('icon', false, false);
          }
          this.ui.icon.setIconPickerColor(obj.fill);
        }
      },
      /* eslint-enable complexity */
      addText: (pos) => {
        const { textColor: fill, fontSize, fontStyle, fontWeight, underline } = this.ui.text;
        const fontFamily = 'Noto Sans';

        this.addText('Double Click', {
          position: pos.originPosition,
          styles: { fill, fontSize, fontFamily, fontStyle, fontWeight, underline },
        }).then(() => {
          this.changeCursor('default');
        });
      },
      addObjectAfter: (obj) => {
        if (obj.type === 'icon') {
          if (this.getDrawingMode() !== 'ICON') {
            this.ui.icon.changeStandbyMode();
          }
        } else if (obj.type === 'path') {
          if (this.ui.submenu === 'mosaic') {
            // 标记为马赛克画笔路径，防止 objectActivated 切换到画笔工具栏
            obj._isMosaicPath = true;
          }
        } else if (['rect', 'circle', 'triangle'].indexOf(obj.type) > -1) {
          this._handleShapeObjectAfter(obj);
        }
      },
      objectScaled: (obj) => {
        if (['i-text', 'text'].indexOf(obj.type) > -1) {
          this.ui.text.fontSize = toInteger(obj.fontSize);
        } else if (['rect', 'circle', 'triangle'].indexOf(obj.type) >= 0) {
          const { width, height } = obj;
          const strokeValue = this.ui.shape.getStrokeValue();

          if (width < strokeValue) {
            this.ui.shape.setStrokeValue(width);
          }
          if (height < strokeValue) {
            this.ui.shape.setStrokeValue(height);
          }
        }
      },
      selectionCleared: () => {
        this.activeObjectId = null;
        if (this.ui.submenu === 'text') {
          this.changeCursor('text');
        } else if (
          !includes(['draw', 'crop', 'resize', 'shape', 'icon', 'mosaic'], this.ui.submenu)
        ) {
          this.stopDrawingMode();
        }
      },
    });
  },

  /**
   * History Action
   * @returns {Object} history actions for ui
   * @private
   */
  _historyAction() {
    return {
      undo: (count) => this.undo(count),
      redo: (count) => this.redo(count),
    };
  },

  /**
   * Handle shape object after it's been added to the canvas.
   * Marks mosaic shapes and updates shape UI state for regular shapes.
   * @param {fabric.Object} obj - The shape object added
   * @private
   */
  _handleShapeObjectAfter(obj) {
    if (this.ui.submenu === 'mosaic') {
      const fabricObj = this._graphics.getObject(obj.id);

      // 标记真实 fabric 对象，防止后续 objectActivated 切换到形状工具栏
      if (fabricObj) {
        fabricObj._isMosaicShape = true;
      }
    } else {
      this.ui.shape.setMaxStrokeValue(Math.min(obj.width, obj.height));
      if (this.getDrawingMode() !== 'SHAPE') {
        this.ui.shape.changeStandbyMode();
      }
    }
  },

  /**
   * Get mosaic pattern canvas
   * @param {number} mosaicSize - mosaic size
   * @param {function} callback - callback function
   * @private
   */
  _getMosaicPatternCanvas(mosaicSize, callback) {
    const canvas = this._graphics.getCanvas();
    const canvasImage = this._graphics.canvasImage;
    if (!canvasImage) {
      callback(null);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempStaticCanvas = new fabric.StaticCanvas(tempCanvas);

    canvasImage.clone((clonedImage) => {
      clonedImage.set({
        left: canvasImage.left,
        top: canvasImage.top,
        originX: canvasImage.originX,
        originY: canvasImage.originY,
      });
      tempStaticCanvas.add(clonedImage);
      tempStaticCanvas.renderAll();

      const img = new fabric.Image(tempCanvas);
      const pixelateFilter = new fabric.Image.filters.Pixelate({
        blocksize: mosaicSize,
      });
      img.filters.push(pixelateFilter);
      img.applyFilters();

      const filteredCanvas = img.toCanvasElement();
      tempStaticCanvas.clear();
      callback(filteredCanvas);
    });
  },

  /**
   * Mosaic Action
   * @returns {Object} actions for ui mosaic
   * @private
   */
  _mosaicAction() {
    return extend(
      {
        setMosaicMode: (mode, settings) => {
          this.stopDrawingMode();
          if (mode === 'rect') {
            this.setDrawingShape('rect', {
              fill: {
                type: 'filter',
                filter: [{ pixelate: settings.size }],
              },
              strokeWidth: 0,
              stroke: 'transparent',
            });
            this.startDrawingMode('SHAPE');
          } else if (mode === 'brush') {
            this.startDrawingMode('FREE_DRAWING');
            this._getMosaicPatternCanvas(settings.size, (filteredCanvas) => {
              if (filteredCanvas) {
                const canvas = this._graphics.getCanvas();
                const brush = new fabric.PatternBrush(canvas);
                brush.source = filteredCanvas;
                brush.width = settings.width;
                canvas.freeDrawingBrush = brush;
              }
            });
          }
        },
        changeMosaicSize: (mode, size) => {
          this.setDrawingShape('rect', {
            fill: {
              type: 'filter',
              filter: [{ pixelate: size }],
            },
            strokeWidth: 0,
            stroke: 'transparent',
          });

          if (this.activeObjectId) {
            this.changeShape(this.activeObjectId, {
              fill: {
                type: 'filter',
                filter: [{ pixelate: size }],
              },
            });
          }

          if (mode === 'brush') {
            this._getMosaicPatternCanvas(size, (filteredCanvas) => {
              if (filteredCanvas) {
                const canvas = this._graphics.getCanvas();
                if (canvas.freeDrawingBrush) {
                  canvas.freeDrawingBrush.source = filteredCanvas;
                }
              }
            });
          }
        },
        changeMosaicBrushWidth: (width) => {
          this.setBrush({ width });
        },
      },
      this._commonAction()
    );
  },

  /**
   * Common Action
   * @returns {Object} common actions for ui
   * @private
   */
  _annotationAction() {
    return extend(
      {
        setStep: (step) => {
          const annotation = this._graphics.getComponent('ANNOTATION');
          annotation.setStep(step);
        },
        setShape: (shape) => {
          const annotation = this._graphics.getComponent('ANNOTATION');
          annotation.setShape(shape);
        },
        setColor: (color) => {
          const annotation = this._graphics.getComponent('ANNOTATION');
          annotation.setColor(color);
        },
        setTextColor: (textColor) => {
          const annotation = this._graphics.getComponent('ANNOTATION');
          annotation.setTextColor(textColor);
        },
        setFontSize: (fontSize) => {
          const annotation = this._graphics.getComponent('ANNOTATION');
          annotation.setFontSize(fontSize);
        },
        onStepChanged: (callback) => {
          this._graphics.on('annotationStepChanged', callback);
        },
      },
      this._commonAction()
    );
  },

  _commonAction() {
    const { TEXT, CROPPER, SHAPE, ZOOM, RESIZE, ANNOTATION } = drawingModes;

    return {
      // eslint-disable-next-line complexity
      modeChange: (menu) => {
        switch (menu) {
          case drawingMenuNames.TEXT:
            this._changeActivateMode(TEXT);
            break;
          case drawingMenuNames.CROP:
            this.startDrawingMode(CROPPER);
            break;
          case drawingMenuNames.SHAPE:
            this._changeActivateMode(SHAPE);
            this.setDrawingShape(this.ui.shape.type, this.ui.shape.options);
            break;
          case drawingMenuNames.ZOOM:
            this.startDrawingMode(ZOOM);
            break;
          case drawingMenuNames.RESIZE:
            this.startDrawingMode(RESIZE);
            break;
          case drawingMenuNames.ANNOTATION:
            this._changeActivateMode(ANNOTATION);
            break;
          default:
            break;
        }
      },
      deactivateAll: this.deactivateAll.bind(this),
      changeSelectableAll: this.changeSelectableAll.bind(this),
      discardSelection: this.discardSelection.bind(this),
      stopDrawingMode: this.stopDrawingMode.bind(this),
    };
  },

  /**
   * Mixin
   * @param {ImageEditor} ImageEditor instance
   */
  mixin(ImageEditor) {
    extend(ImageEditor.prototype, this);
  },
};
