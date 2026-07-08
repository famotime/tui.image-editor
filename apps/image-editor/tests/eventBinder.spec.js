import { bindEvents, unbindEvents } from '@/eventBinder';

describe('eventBinder', () => {
  it('binds event handlers from a named handler map', () => {
    const target = {
      on: jest.fn(),
    };
    const handlers = {
      first: jest.fn(),
      second: jest.fn(),
    };

    bindEvents(target, handlers, {
      eventA: 'first',
      eventB: 'second',
    });

    expect(target.on).toHaveBeenCalledWith({
      eventA: handlers.first,
      eventB: handlers.second,
    });
  });

  it('unbinds event handlers from a named handler map', () => {
    const target = {
      off: jest.fn(),
    };
    const handlers = {
      first: jest.fn(),
      second: jest.fn(),
    };

    unbindEvents(target, handlers, {
      eventA: 'first',
      eventB: 'second',
    });

    expect(target.off).toHaveBeenCalledWith({
      eventA: handlers.first,
      eventB: handlers.second,
    });
  });
});
