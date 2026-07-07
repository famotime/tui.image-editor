import { fabric } from 'fabric';
import extend from 'tui-code-snippet/object/extend';
import Imagetracer from '@/helper/imagetracer';
import { isSupportFileApi, base64ToBlob, toInteger, isEmptyCropzone, includes } from '@/util';
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
      if (!segment || segment.length < 3) return null;
      const [type] = segment;
      if (type === 'M' || type === 'L') return { x: segment[1], y: segment[2] };
      if (type === 'Q') return { x: segment[3], y: segment[4] };
      if (type === 'C') return { x: segment[5], y: segment[6] };

      return null;
    };

    /**
     * 计算路径末尾切线方向向量（尾部箭头朝向外侧，即沿切线正方向）
     */
    const getEndDirection = (pathData) => {
      if (pathData.length < 2) return null;
      const lastSeg = pathData[pathData.length - 1];
      const [type] = lastSeg;

      if (type === 'Q' && lastSeg.length >= 5) {
        // 二次贝塞尔曲线末端切线方向：终点减去控制点
        const dx = lastSeg[3] - lastSeg[1];
        const dy = lastSeg[4] - lastSeg[2];
        if (dx !== 0 || dy !== 0) return { dx, dy };
      }
      if (type === 'C' && lastSeg.length >= 7) {
        // 三次贝塞尔曲线末端切线方向：终点减去第二个控制点
        const dx = lastSeg[5] - lastSeg[3];
        const dy = lastSeg[6] - lastSeg[4];
        if (dx !== 0 || dy !== 0) return { dx, dy };
      }

      // 如果是线性段段（L/M/Z），或者贝塞尔曲线计算出零向量，回退为割线方向计算
      const endPt = getSegmentEndPoint(lastSeg);
      if (!endPt) return null;
      for (let i = pathData.length - 2; i >= 0; i -= 1) {
        const prevSeg = pathData[i];
        const prevPt =
          getSegmentEndPoint(prevSeg) ||
          (i === 0 ? { x: pathData[0][1], y: pathData[0][2] } : null);
        if (prevPt) {
          const dx = endPt.x - prevPt.x;
          const dy = endPt.y - prevPt.y;
          if (dx !== 0 || dy !== 0) return { dx, dy };
        }
      }

      return null;
    };

    /**
     * 计算路径起始切线方向向量（头部箭头朝向外侧，即沿切线反方向）
     */
    const getStartDirection = (pathData) => {
      if (pathData.length < 2) return null;
      const startPt = { x: pathData[0][1], y: pathData[0][2] };
      const [, nextSeg] = pathData;
      const [type] = nextSeg;

      if (type === 'Q' && nextSeg.length >= 5) {
        // 二次贝塞尔曲线起点反向切线：起点减去第一个控制点
        const dx = startPt.x - nextSeg[1];
        const dy = startPt.y - nextSeg[2];
        if (dx !== 0 || dy !== 0) return { dx, dy };
      }
      if (type === 'C' && nextSeg.length >= 7) {
        // 三次贝塞尔曲线起点反向切线：起点减去第一个控制点
        const dx = startPt.x - nextSeg[1];
        const dy = startPt.y - nextSeg[2];
        if (dx !== 0 || dy !== 0) return { dx, dy };
      }

      // 回退为首段割线反向向量
      for (let i = 1; i < pathData.length; i += 1) {
        const nextPt = getSegmentEndPoint(pathData[i]);
        if (nextPt) {
          const dx = startPt.x - nextPt.x;
          const dy = startPt.y - nextPt.y;
          if (dx !== 0 || dy !== 0) return { dx, dy };
        }
      }

      return null;
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
        if (!arrowType || arrowType === 'none') return;

        const originalPath = options.path;
        if (!originalPath) return;
        const pathData = originalPath.path;
        if (!pathData || pathData.length < 2) return;

        const strokeWidth = originalPath.strokeWidth || 1;
        const len = Math.max(12, strokeWidth * 3);
        const arrowAngle = (Math.PI * 5) / 6;
        const newPathData = [...pathData];

        // 尾部箭头（单向或双向）
        if (arrowType === 'single' || arrowType === 'double') {
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
        }

        // 头部箭头（双向）
        if (arrowType === 'double') {
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
        }

        originalPath.path = newPathData;
        if (fabric.Polyline && fabric.Polyline.prototype._setPositionDimensions) {
          fabric.Polyline.prototype._setPositionDimensions.call(originalPath, {});
        }
        originalPath.setCoords();
        canvas.renderAll();
      });

      // 监听直线工具对象添加（fabric.Line）
      canvas.on('object:added', (options) => {
        const { arrowType } = this.ui.draw;
        if (!arrowType || arrowType === 'none') return;

        const obj = options.target;
        if (!obj || obj.type !== 'line' || obj._arrowProcessed) return;

        obj._arrowProcessed = true;
        const capturedArrowType = arrowType; // 捕获当前箭头类型
        const strokeWidth = obj.strokeWidth || 1;
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
        setDrawingShape: (shapeType) => {
          this.setDrawingShape(shapeType);
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
          this.stopDrawingMode();
          if (this.ui.submenu !== 'shape') {
            this.ui.changeMenu('shape', false, false);
          }
          this.ui.shape.setShapeStatus({
            strokeColor: obj.stroke,
            strokeWidth: obj.strokeWidth,
            fillColor: obj.fill,
          });

          this.ui.shape.setMaxStrokeValue(Math.min(obj.width, obj.height));
        } else if (obj.type === 'path' || obj.type === 'line') {
          if (this.ui.submenu !== 'draw') {
            this.ui.changeMenu('draw', false, false);
            this.ui.draw.changeStandbyMode();
          }
        } else if (['i-text', 'text'].indexOf(obj.type) > -1) {
          if (this.ui.submenu !== 'text') {
            this.ui.changeMenu('text', false, false);
          }

          this.ui.text.setTextStyleStateOnAction(obj);
        } else if (obj.type === 'icon') {
          this.stopDrawingMode();
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
          this.ui.icon.changeStandbyMode();
        } else if (['rect', 'circle', 'triangle'].indexOf(obj.type) > -1) {
          this.ui.shape.setMaxStrokeValue(Math.min(obj.width, obj.height));
          this.ui.shape.changeStandbyMode();
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
        } else if (!includes(['draw', 'crop', 'resize'], this.ui.submenu)) {
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
        }
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
