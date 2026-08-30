import { describe, expect, it } from 'vitest';
import { getPngExportDimensions } from './exportService';

describe('dimensões da exportação PNG', () => {
  it('usa todo o conteúdo quando ele ultrapassa a área visível', () => {
    const dimensions = getPngExportDimensions({
      scrollWidth: 1280,
      scrollHeight: 2200,
      getBoundingClientRect: () => ({ width: 980.2, height: 720.1 })
    });

    expect(dimensions).toEqual({ width: 1280, height: 2200 });
  });

  it('arredonda a área renderizada sem cortar pixels fracionários', () => {
    const dimensions = getPngExportDimensions({
      scrollWidth: 1000,
      scrollHeight: 700,
      getBoundingClientRect: () => ({ width: 1000.4, height: 700.2 })
    });

    expect(dimensions).toEqual({ width: 1001, height: 701 });
  });
});
