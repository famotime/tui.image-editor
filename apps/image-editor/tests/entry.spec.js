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

  it('should export localeZhCN and attach to ImageEditor', () => {
    const entry = require('../src');

    expect(entry.localeZhCN).toBeDefined();
    expect(entry.localeZhCN.Crop).toBe('裁剪');
    expect(entry.default.localeZhCN).toBe(entry.localeZhCN);
  });
});
