import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Exams } from './exams';
import { ExportService } from '../../shared/services/export.service';

describe('Exams', () => {
  let component: Exams;
  let fixture: ComponentFixture<Exams>;
  let httpMock: HttpTestingController;
  let exportService: { export: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    exportService = {
      export: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Exams],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExportService, useValue: exportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Exams);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(() => 1 as never);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('should create and load exams', async () => {
    fixture.detectChanges();

    const req = expectExamList(httpMock);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({
      items: [{ id: 'exam-1', patientCpf: '12345678901', patientName: 'Maria', modality: 0 }],
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    });

    expect(component).toBeTruthy();
    expect(component.exams).toEqual([
      { id: 'exam-1', patientCpf: '12345678901', patientName: 'Maria', modality: 0 },
    ]);
  });

  it('creates an exam and reloads the listing', async () => {
    const payload = {
      patientCpf: '12345678901',
      modality: 0 as const,
      idempotencyKey: 'key-1',
      descricao: 'Tomografia',
      examDate: '2026-05-18T00:00:00-03:00',
    };

    component.submitCreateExam(payload);

    const createReq = httpMock.expectOne('/api/exames');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(payload);
    createReq.flush({});
    await Promise.resolve();

    const reloadReq = expectExamList(httpMock);
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isCreateExamModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Criado com sucesso', type: 'success' });
  });

  it('edits an exam and sends sanitized fields', async () => {
    component.examDetailsForm = {
      id: 'exam-1',
      patientCpf: '123.456.789-01',
      patientName: 'Maria',
      modality: 1,
      descricao: 'Ressonancia',
      examDate: '2026-05-18',
      updatedAt: '',
    };

    component.saveExamChanges();

    const updateReq = httpMock.expectOne('/api/exames/exam-1');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({
      patientCpf: '12345678901',
      modality: 1,
      descricao: 'Ressonancia',
      examDate: '2026-05-18T00:00:00-03:00',
    });
    updateReq.flush({});
    await Promise.resolve();

    const reloadReq = expectExamList(httpMock);
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isExamModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Atualizado com sucesso', type: 'success' });
  });

  it('deletes an exam and reloads the listing', async () => {
    component.examDetailsForm = {
      id: 'exam-1',
      patientCpf: '12345678901',
      patientName: 'Maria',
      modality: 0,
      descricao: '',
      examDate: '',
      updatedAt: '',
    };

    component.confirmDeleteExam();

    const deleteReq = httpMock.expectOne('/api/exames/exam-1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
    await Promise.resolve();

    const reloadReq = expectExamList(httpMock);
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isDeleteExamModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Excluido com sucesso', type: 'success' });
  });

  it('loads exam details by id and fills the edit form', async () => {
    component.openExamDetails({
      id: 'exam-1',
      patientCpf: '12345678901',
      patientName: 'Maria',
      descricao: '',
      modality: 0,
    });

    const detailReq = httpMock.expectOne('/api/exames/exam-1');
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush({
      id: 'exam-1',
      patientCpf: '12345678901',
      patientName: 'Maria',
      descricao: 'Tomografia',
      examDate: '2026-05-18T17:37:52Z',
      modality: 1,
      updatedAt: '2026-05-18T12:20:58.736864Z',
    });
    await Promise.resolve();

    expect(component.examDetailsForm).toEqual({
      id: 'exam-1',
      patientCpf: '12345678901',
      patientName: 'Maria',
      modality: 1,
      descricao: 'Tomografia',
      examDate: '2026-05-18',
      updatedAt: '2026-05-18T12:20:58.736864Z',
    });
    expect(component.isExamModalOpen).toBe(true);
    expect(component.isExamDetailsLoading).toBe(false);
  });

  it('applies filters to the exam listing request', async () => {
    component.filters = {
      patientName: 'Maria',
      modalities: ['CT', 'MR'],
      startDate: '2026-05-01',
      endDate: '2026-05-18',
    };

    component.applyFilters();

    const req = expectExamList(httpMock);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('patientName')).toBe('Maria');
    expect(req.request.params.getAll('modalities')).toEqual(['CT', 'MR']);
    expect(req.request.params.get('startDate')).toBe('2026-05-01');
    expect(req.request.params.get('endDate')).toBe('2026-05-18');
    req.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });
  });

  it('exports all filtered exams as CSV', async () => {
    component.filters = {
      patientName: 'Maria',
      modalities: ['CT'],
      startDate: '2026-05-01',
      endDate: '2026-05-18',
    };
    component.applyFilters();

    const filterReq = expectExamList(httpMock);
    filterReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    const exportPromise = component.exportExams('csv');

    const firstPageReq = httpMock.expectOne(
      (req) => req.url === '/api/exames' && req.params.get('page') === '1',
    );
    expect(firstPageReq.request.params.get('pageSize')).toBe('100');
    expect(firstPageReq.request.params.get('patientName')).toBe('Maria');
    expect(firstPageReq.request.params.getAll('modalities')).toEqual(['CT']);
    firstPageReq.flush({
      items: [{ id: 'exam-1', patientName: 'Maria', patientCpf: '12345678901', modality: 0 }],
      page: 1,
      pageSize: 100,
      totalCount: 2,
      totalPages: 2,
    });
    await Promise.resolve();

    const secondPageReq = httpMock.expectOne(
      (req) => req.url === '/api/exames' && req.params.get('page') === '2',
    );
    secondPageReq.flush({
      items: [{ id: 'exam-2', patientName: 'Maria', patientCpf: '12345678901', modality: 1 }],
      page: 2,
      pageSize: 100,
      totalCount: 2,
      totalPages: 2,
    });
    await Promise.resolve();
    await Promise.resolve();
    await exportPromise;

    expect(exportService.export).toHaveBeenCalledWith('csv', 'exames', expect.any(Array), [
      { id: 'exam-1', patientName: 'Maria', patientCpf: '12345678901', modality: 0 },
      { id: 'exam-2', patientName: 'Maria', patientCpf: '12345678901', modality: 1 },
    ]);
    expect(component.toast).toEqual({ message: 'Exportação concluída', type: 'success' });
  });
});

function expectExamList(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.url === '/api/exames' && req.method === 'GET');
}
