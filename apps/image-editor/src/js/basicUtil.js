import forEach from 'tui-code-snippet/collection/forEach';

const { min, max } = Math;

export function clamp(value, minValue, maxValue) {
  if (minValue > maxValue) {
    [minValue, maxValue] = [maxValue, minValue];
  }

  return max(minValue, min(value, maxValue));
}

export function keyMirror(...args) {
  const obj = {};

  forEach(args, (key) => {
    obj[key] = key;
  });

  return obj;
}

export function makeStyleText(styleObj) {
  let styleStr = '';

  forEach(styleObj, (value, prop) => {
    styleStr += `${prop}: ${value};`;
  });

  return styleStr;
}

export function toCamelCase(targetString) {
  return targetString.replace(/-([a-z])/g, ($0, $1) => $1.toUpperCase());
}

export function getRgb(color, alpha) {
  if (!color || typeof color !== 'string') {
    return color;
  }
  if (!/^#[0-9a-fA-F]{3,6}$/.test(color)) {
    return color;
  }
  if (color.length === 4) {
    color = `${color}${color.slice(1, 4)}`;
  }
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const a = alpha || 1;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function base64ToBlob(data) {
  const rImageType = /data:(image\/.+);base64,/;
  let mimeString = '';
  let raw, uInt8Array, i;

  raw = data.replace(rImageType, (header, imageType) => {
    mimeString = imageType;

    return '';
  });

  raw = atob(raw);
  const rawLength = raw.length;
  uInt8Array = new Uint8Array(rawLength); // eslint-disable-line

  for (i = 0; i < rawLength; i += 1) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: mimeString });
}
