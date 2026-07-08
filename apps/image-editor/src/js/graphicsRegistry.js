import ImageLoader from '@/component/imageLoader';
import Cropper from '@/component/cropper';
import Flip from '@/component/flip';
import Rotation from '@/component/rotation';
import FreeDrawing from '@/component/freeDrawing';
import Line from '@/component/line';
import Text from '@/component/text';
import Icon from '@/component/icon';
import Filter from '@/component/filter';
import Shape from '@/component/shape';
import Zoom from '@/component/zoom';
import Resize from '@/component/resize';
import Annotation from '@/component/annotation';
import CropperDrawingMode from '@/drawingMode/cropper';
import FreeDrawingMode from '@/drawingMode/freeDrawing';
import LineDrawingMode from '@/drawingMode/lineDrawing';
import ShapeDrawingMode from '@/drawingMode/shape';
import TextDrawingMode from '@/drawingMode/text';
import IconDrawingMode from '@/drawingMode/icon';
import ZoomDrawingMode from '@/drawingMode/zoom';
import ResizeDrawingMode from '@/drawingMode/resize';
import AnnotationDrawingMode from '@/drawingMode/annotation';

const DRAWING_MODE_TYPES = [
  CropperDrawingMode,
  FreeDrawingMode,
  LineDrawingMode,
  ShapeDrawingMode,
  TextDrawingMode,
  IconDrawingMode,
  ZoomDrawingMode,
  ResizeDrawingMode,
  AnnotationDrawingMode,
];

const COMPONENT_TYPES = [
  ImageLoader,
  Cropper,
  Flip,
  Rotation,
  FreeDrawing,
  Line,
  Text,
  Icon,
  Filter,
  Shape,
  Zoom,
  Resize,
  Annotation,
];

export function createDrawingModeInstances() {
  return DRAWING_MODE_TYPES.map((DrawingModeType) => new DrawingModeType());
}

export function createComponentInstances(graphics) {
  return COMPONENT_TYPES.map((ComponentType) => new ComponentType(graphics));
}
