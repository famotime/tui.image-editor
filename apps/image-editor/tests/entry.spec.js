import commandFactory from '@/factory/command';
import { commandNames as commands } from '@/consts';

jest.mock('@css/index.styl', () => ({}));

describe('entry', () => {
  beforeAll(() => {
    require('../src');
  });

  it('should register the eraser command from the package entry', () => {
    const command = commandFactory.create(commands.APPLY_ERASER);

    expect(command).not.toBeNull();
  });
});
