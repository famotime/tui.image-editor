import Range from '@/ui/tools/range';
import { defaultRotateRangeValues } from '@/consts';

describe('Range', () => {
  let range, input, slider;

  beforeEach(() => {
    input = document.createElement('input');
    slider = document.createElement('div');
    range = new Range({ slider, input }, defaultRotateRangeValues);
  });

  it('should be incremented by one when keyCode 38 is found in the event handler with changeInputWithArrow', () => {
    const ev = { target: input, keyCode: 38 };
    input.value = '3';

    range.eventHandler.changeInputWithArrow(ev);

    expect(range.value).toBe(4);
  });

  it('should be decremented by one when keyCode 40 is found in the event handler with changeInputWithArrow', () => {
    const ev = { target: input, keyCode: 40 };
    input.value = '3';

    range.eventHandler.changeInputWithArrow(ev);

    expect(range.value).toBe(2);
  });

  it('should filter out any invalid input values', () => {
    const ev = { target: input, keyCode: 83, preventDefault: jest.fn() };
    input.value = '-3!!6s0s';

    range.eventHandler.changeInput(ev);

    expect(range.value).toBe(0);
  });

  it('should blur input when ENTER key is pressed', () => {
    const ev = { target: input, keyCode: 13 };
    input.blur = jest.fn();

    range.eventHandler.changeInput(ev);

    expect(input.blur).toHaveBeenCalled();
  });

  it('should update range value on changeInputFinally (blur)', () => {
    const ev = { target: input };
    input.value = '15';

    range.eventHandler.changeInputFinally(ev);

    expect(range.value).toBe(15);
  });
});
