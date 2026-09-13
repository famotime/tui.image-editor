import Rotate from '@/ui/rotate';

describe('Rotate UI', () => {
  let rotateUI;
  let subMenuElement;
  let actionsMock;

  beforeEach(() => {
    subMenuElement = document.createElement('div');
    const options = {
      locale: { localize: (str) => str },
      makeSvgIcon: () => '<svg></svg>',
      menuBarPosition: 'bottom',
    };
    rotateUI = new Rotate(subMenuElement, options);

    actionsMock = {
      rotate: jest.fn(),
      setAngle: jest.fn(),
    };
    rotateUI.addEvent(actionsMock);
  });

  afterEach(() => {
    rotateUI.destroy();
  });

  it('应该正常渲染旋转操作栏并包含重置按钮', () => {
    const resetButton = subMenuElement.querySelector('.tui-image-editor-button.reset');
    expect(resetButton).not.toBeNull();
    expect(resetButton.textContent).toContain('Reset');
  });

  it('当点击重置按钮时，应调用 setAngle(0) 将角度恢复到 0', () => {
    const resetButton = subMenuElement.querySelector('.tui-image-editor-button.reset');
    resetButton.click();

    expect(actionsMock.setAngle).toHaveBeenCalledWith(0);
  });

  it('当点击顺时针按钮时，应调用 rotate(30)', () => {
    const clockwiseButton = subMenuElement.querySelector('.tui-image-editor-button.clockwise');
    clockwiseButton.click();

    expect(actionsMock.rotate).toHaveBeenCalledWith(30);
  });

  it('当点击逆时针按钮时，应调用 rotate(-30)', () => {
    const counterClockwiseButton = subMenuElement.querySelector('.tui-image-editor-button.counterclockwise');
    counterClockwiseButton.click();

    expect(actionsMock.rotate).toHaveBeenCalledWith(-30);
  });
});
