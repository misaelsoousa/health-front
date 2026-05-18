import { TestBed } from '@angular/core/testing';

import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportService);

    createObjectUrl = vi.fn(() => 'blob:test');
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    clickSpy.mockRestore();
  });

  it('exports rows as a semicolon separated CSV with BOM and escaped cells', async () => {
    await service.export(
      'csv',
      'pacientes',
      [
        { header: 'Nome', accessor: (row) => row.name },
        { header: 'Observacao', accessor: (row) => row.note },
      ],
      [
        { name: 'Ana Silva', note: 'linha simples' },
        { name: 'Joao "Teste"', note: 'valor;com;separador' },
      ],
    );

    const blob = createObjectUrl.mock.calls[0][0] as Blob;
    const bytes = await readBlobAsBytes(blob);
    const csv = await readBlobAsText(blob);

    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv).toContain('Nome;Observacao');
    expect(csv).toContain('"Joao ""Teste""";"valor;com;separador"');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
  });
});

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function readBlobAsBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
