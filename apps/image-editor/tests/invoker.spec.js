import Invoker from '@/invoker';
import Command from '@/interface/command';

describe('Invoker', () => {
  let invoker, cmd;

  beforeEach(() => {
    invoker = new Invoker();
    cmd = new Command({
      execute: jest.fn(() => Promise.resolve()),
      undo: jest.fn(() => Promise.resolve()),
    });
  });

  it('should call "command.execute" again', async () => {
    await invoker.execute(cmd);
    await invoker.undo();
    await invoker.redo();

    expect(cmd.execute).toHaveBeenCalledTimes(2);
  });

  it('should call the "command.executeCallback" after invoke', async () => {
    const callbackSpy = jest.fn();

    cmd.setExecuteCallback(callbackSpy);
    await invoker.execute(cmd);

    expect(callbackSpy).toHaveBeenCalled();
  });

  it('should call the "command.undoCallback" after undo', async () => {
    const callbackSpy = jest.fn();

    cmd.setUndoCallback(callbackSpy);
    await invoker.execute(cmd);
    await invoker.undo();

    expect(callbackSpy).toHaveBeenCalled();
  });

  describe('invoker.customEvents', () => {
    let spyEvents;

    beforeEach(() => {
      spyEvents = {
        undoStackChanged: jest.fn(),
        redoStackChanged: jest.fn(),
      };
    });

    it('should fire a event when redoStack is empty before', async () => {
      invoker.on(spyEvents);
      await invoker.execute(cmd);

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(1);
      expect(spyEvents.redoStackChanged).not.toHaveBeenCalled();
    });

    it('should fire events when redoStack is not empty before', async () => {
      invoker.pushRedoStack({});
      invoker.on(spyEvents);
      await invoker.execute(cmd);

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(1);
      expect(spyEvents.redoStackChanged).toHaveBeenCalledWith(0);
    });

    it('should fire redo event when undoStack is not empty after', async () => {
      await invoker.execute(cmd);
      await invoker.execute(cmd);

      invoker.on(spyEvents);
      await invoker.undo();

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(1);
      expect(spyEvents.redoStackChanged).toHaveBeenCalledWith(1);
    });

    it('should fire undo event when undoStack is empty after', async () => {
      await invoker.execute(cmd);

      invoker.on(spyEvents);
      await invoker.undo();

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(0);
      expect(spyEvents.redoStackChanged).toHaveBeenCalledWith(1);
    });

    it('should fire undo event when redoStack is not empty after', async () => {
      await invoker.execute(cmd);
      await invoker.execute(cmd);
      await invoker.undo();
      await invoker.undo();

      invoker.on(spyEvents);
      await invoker.redo();

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(1);
      expect(spyEvents.redoStackChanged).toHaveBeenCalledWith(1);
    });

    it('should fire redo event when undoStack is empty after', async () => {
      await invoker.execute(cmd);
      await invoker.undo();

      invoker.on(spyEvents);
      await invoker.redo();

      expect(spyEvents.undoStackChanged).toHaveBeenCalledWith(1);
      expect(spyEvents.redoStackChanged).toHaveBeenCalledWith(0);
    });
  });

  describe('Robustness and State Machine Recovery', () => {
    it('should reset _isSilent to false even if executeSilent fails', async () => {
      const failingCmd = new Command({
        execute: jest.fn(() => Promise.reject(new Error('Silent execution error'))),
      });

      await expect(invoker.executeSilent(failingCmd)).rejects.toThrow('Silent execution error');
      expect(invoker._isSilent).toBe(false);
      expect(invoker._isLocked).toBe(false);

      // Subsequent normal command should successfully push to undoStack
      await invoker.execute(cmd);
      expect(invoker.isEmptyUndoStack()).toBe(false);
    });

    it('should restore command to undoStack if undo operation rejects', async () => {
      const failingUndoCmd = new Command({
        execute: jest.fn(() => Promise.resolve()),
        undo: jest.fn(() => Promise.reject(new Error('Undo failed'))),
      });

      await invoker.execute(failingUndoCmd);
      expect(invoker._undoStack.length).toBe(1);

      await expect(invoker.undo()).rejects.toThrow('Undo failed');
      // Command must be restored, not swallowed
      expect(invoker._undoStack.length).toBe(1);
      expect(invoker._isLocked).toBe(false);
    });

    it('should restore command to redoStack if redo operation rejects', async () => {
      let isFirstExecute = true;
      const failingRedoCmd = new Command({
        execute: jest.fn(() => {
          if (isFirstExecute) {
            isFirstExecute = false;

            return Promise.resolve();
          }

          return Promise.reject(new Error('Redo failed'));
        }),
        undo: jest.fn(() => Promise.resolve()),
      });

      await invoker.execute(failingRedoCmd);
      await invoker.undo();
      expect(invoker._redoStack.length).toBe(1);

      await expect(invoker.redo()).rejects.toThrow('Redo failed');
      // Command must be restored back to redoStack
      expect(invoker._redoStack.length).toBe(1);
      expect(invoker._isLocked).toBe(false);
    });

    it('should explicitly set command.isRedo during execution', async () => {
      await invoker.execute(cmd);
      expect(cmd.isRedo).toBe(false);

      await invoker.undo();
      await invoker.redo();
      expect(cmd.isRedo).toBe(true);
    });
  });
});
