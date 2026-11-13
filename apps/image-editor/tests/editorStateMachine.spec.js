import EditorStateMachine from '@/editorStateMachine';
import { drawingModes } from '@/consts';

describe('EditorStateMachine', () => {
  let fsm;

  beforeEach(() => {
    fsm = new EditorStateMachine();
  });

  it('should initialize with NORMAL mode and null options', () => {
    expect(fsm.mode).toBe(drawingModes.NORMAL);
    expect(fsm.options).toBeNull();
    expect(fsm.isSuspended).toBe(false);
  });

  it('should transition to a valid drawing mode with options', () => {
    const opts = { width: 10, color: '#ff0000' };
    const result = fsm.transition(drawingModes.FREE_DRAWING, opts);

    expect(result).toEqual({
      from: drawingModes.NORMAL,
      to: drawingModes.FREE_DRAWING,
      options: opts,
    });
    expect(fsm.mode).toBe(drawingModes.FREE_DRAWING);
    expect(fsm.options).toEqual(opts);
  });

  it('should reject transition to an invalid mode', () => {
    const result = fsm.transition('INVALID_MODE');

    expect(result).toBeNull();
    expect(fsm.mode).toBe(drawingModes.NORMAL);
  });

  it('should update options if transitioning to the same mode', () => {
    fsm.transition(drawingModes.SHAPE, { type: 'rect' });
    const result = fsm.transition(drawingModes.SHAPE, { type: 'circle' });

    expect(result).toBeNull();
    expect(fsm.mode).toBe(drawingModes.SHAPE);
    expect(fsm.options).toEqual({ type: 'circle' });
  });

  it('should fire transitionStart, transitionEnd, and modeChanged events', () => {
    const onStart = jest.fn();
    const onEnd = jest.fn();
    const onChanged = jest.fn();

    fsm.on('transitionStart', onStart);
    fsm.on('transitionEnd', onEnd);
    fsm.on('modeChanged', onChanged);

    fsm.transition(drawingModes.TEXT, { fontSize: 24 });

    expect(onStart).toHaveBeenCalledWith({
      from: drawingModes.NORMAL,
      to: drawingModes.TEXT,
      options: { fontSize: 24 },
    });
    expect(onEnd).toHaveBeenCalledWith({
      from: drawingModes.NORMAL,
      to: drawingModes.TEXT,
      options: { fontSize: 24 },
    });
    expect(onChanged).toHaveBeenCalledWith(drawingModes.TEXT);
  });

  it('should suspend non-normal mode and its options', () => {
    const opts = { width: 15, color: '#00ff00' };
    fsm.transition(drawingModes.LINE_DRAWING, opts);

    const suspended = fsm.suspend();
    expect(suspended).toBe(true);
    expect(fsm.isSuspended).toBe(true);
    expect(fsm.mode).toBe(drawingModes.NORMAL);
    expect(fsm.options).toBeNull();
  });

  it('should not suspend if already in NORMAL mode', () => {
    const suspended = fsm.suspend();
    expect(suspended).toBe(false);
    expect(fsm.isSuspended).toBe(false);
  });

  it('should restore suspended mode and options', () => {
    const opts = { selectType: 'freehand' };
    fsm.transition(drawingModes.LASSO, opts);
    fsm.suspend();

    const restored = fsm.restore();
    expect(restored).toEqual({
      mode: drawingModes.LASSO,
      options: opts,
    });
    expect(fsm.mode).toBe(drawingModes.LASSO);
    expect(fsm.options).toEqual(opts);
    expect(fsm.isSuspended).toBe(false);
  });

  it('should correctly identify persistent modes on deselect', () => {
    expect(fsm.shouldKeepModeOnDeselect('draw')).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect('crop')).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect('annotation')).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect('eraser')).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect(drawingModes.FREE_DRAWING)).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect(drawingModes.ANNOTATION)).toBe(true);
    expect(fsm.shouldKeepModeOnDeselect(drawingModes.ERASER)).toBe(true);

    expect(fsm.shouldKeepModeOnDeselect('filter')).toBe(false);
    expect(fsm.shouldKeepModeOnDeselect('rotate')).toBe(false);
    expect(fsm.shouldKeepModeOnDeselect('flip')).toBe(false);
  });

  it('should reset to NORMAL mode and clear suspended state', () => {
    fsm.transition(drawingModes.SHAPE, { type: 'rect' });
    fsm.suspend();
    fsm.reset();

    expect(fsm.mode).toBe(drawingModes.NORMAL);
    expect(fsm.options).toBeNull();
    expect(fsm.isSuspended).toBe(false);
  });
});
