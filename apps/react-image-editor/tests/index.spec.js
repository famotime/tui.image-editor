import React, { StrictMode } from 'react';
import { render } from '@testing-library/react';
import ImageEditor from '../src/index';
import TuiImageEditor from 'tui-image-editor';

// Mock tui-image-editor
jest.mock('tui-image-editor', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      off: jest.fn(),
      destroy: jest.fn(),
    };
  });
});

describe('ImageEditor Component', () => {
  beforeEach(() => {
    TuiImageEditor.mockClear();
  });

  it('instantiates tui-image-editor once even in React 18 Strict Mode', () => {
    const { unmount } = render(
      <StrictMode>
        <ImageEditor
          includeUI={{
            loadImage: {
              path: 'dummy',
              name: 'SampleImage',
            },
            initMenu: 'filter',
            menuBarPosition: 'bottom',
          }}
          cssMaxHeight={500}
          cssMaxWidth={700}
        />
      </StrictMode>
    );

    // Should instantiate exactly twice due to React 18 Strict Mode double mounting
    expect(TuiImageEditor).toHaveBeenCalledTimes(2);

    unmount();

    // Check if destroy was called
    const firstInstance = TuiImageEditor.mock.results[0].value;
    const secondInstance = TuiImageEditor.mock.results[1].value;
    expect(firstInstance.destroy).toHaveBeenCalledTimes(1);
    expect(secondInstance.destroy).toHaveBeenCalledTimes(1);
  });

  it('binds and unbinds events based on props', () => {
    const onMousedown = jest.fn();
    const onObjectMoved = jest.fn();

    const { rerender } = render(
      <ImageEditor
        onMousedown={onMousedown}
        onObjectMoved={onObjectMoved}
      />
    );

    const mockInstance = TuiImageEditor.mock.results[0].value;
    
    expect(mockInstance.on).toHaveBeenCalledWith('mousedown', onMousedown);
    expect(mockInstance.on).toHaveBeenCalledWith('objectMoved', onObjectMoved);

    // Rerender with different props
    const newOnObjectMoved = jest.fn();
    rerender(
      <ImageEditor
        onMousedown={onMousedown}
        onObjectMoved={newOnObjectMoved}
      />
    );

    // objectMoved should be unbound and bound again
    expect(mockInstance.off).toHaveBeenCalledWith('objectMoved');
    expect(mockInstance.on).toHaveBeenCalledWith('objectMoved', newOnObjectMoved);
    
    // mousedown should not be unbound/rebound as it did not change
    expect(mockInstance.off).not.toHaveBeenCalledWith('mousedown');
  });
});
