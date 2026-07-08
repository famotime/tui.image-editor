import { base64ToBlob, clamp, getRgb, keyMirror, makeStyleText, toCamelCase } from '@/basicUtil';

describe('basicUtil', () => {
  it('clamps a value and accepts reversed bounds', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 10, 0)).toBe(5);
  });

  it('mirrors keys to values', () => {
    expect(keyMirror('A', 'B')).toEqual({ A: 'A', B: 'B' });
  });

  it('formats style objects as css text', () => {
    expect(makeStyleText({ width: '10px', height: '20px' })).toBe(
      'width: 10px;height: 20px;'
    );
  });

  it('converts dashed names to camel case', () => {
    expect(toCamelCase('menu-bar-position')).toBe('menuBarPosition');
  });

  it('converts hex colors to rgba strings', () => {
    expect(getRgb('#abc', 0.5)).toBe('rgba(171, 202, 188, 0.5)');
    expect(getRgb('#aabbcc')).toBe('rgba(170, 187, 204, 1)');
  });

  it('converts image base64 data urls to blobs', () => {
    const blob = base64ToBlob('data:image/png;base64,SGVsbG8=');

    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(5);
  });
});
