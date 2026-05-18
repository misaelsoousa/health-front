import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Patients } from './patients';
import { ExportService } from '../../shared/services/export.service';

describe('Patients', () => {
  let component: Patients;
  let fixture: ComponentFixture<Patients>;
  let httpMock: HttpTestingController;
  let exportService: { export: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    exportService = {
      export: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Patients],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExportService, useValue: exportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Patients);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(() => 1 as never);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('should create and load patients', async () => {
    fixture.detectChanges();

    const req = expectPatientList(httpMock);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush({
      items: [{ id: '1', name: 'Maria', cpf: '12345678901', status: 'A' }],
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    });

    expect(component).toBeTruthy();
    expect(component.patients).toEqual([{ id: '1', name: 'Maria', cpf: '12345678901', status: 'A' }]);
  });

  it('creates a patient and reloads the listing', async () => {
    const payload = {
      Name: 'Maria Silva',
      Cpf: '12345678901',
      Phone: '11999999999',
      BirthDate: '1990-01-01',
    };

    component.submitCreatePatient(payload);

    const createReq = httpMock.expectOne('/api/pacientes');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(payload);
    createReq.flush({});
    await Promise.resolve();

    const reloadReq = expectPatientList(httpMock);
    expect(reloadReq.request.method).toBe('GET');
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isCreatePatientModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Criado com sucesso', type: 'success' });
  });

  it('edits a patient and sends sanitized fields', async () => {
    component.patientDetailsForm = {
      id: 'patient-1',
      name: 'Maria Atualizada',
      cpf: '123.456.789-01',
      phone: '(11) 99999-9999',
      birthDate: '1990-01-01',
      status: 'A',
    };

    component.savePatientChanges();

    const updateReq = httpMock.expectOne('/api/pacientes/patient-1');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({
      Name: 'Maria Atualizada',
      Cpf: '12345678901',
      Phone: '11999999999',
      BirthDate: '1990-01-01',
      Status: 'A',
    });
    updateReq.flush({});
    await Promise.resolve();

    const reloadReq = expectPatientList(httpMock);
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isPatientModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Atualizado com sucesso', type: 'success' });
  });

  it('deletes a patient and reloads the listing', async () => {
    component.patientDetailsForm = {
      id: 'patient-1',
      name: 'Maria',
      cpf: '12345678901',
      phone: '',
      birthDate: '',
      status: 'A',
    };

    component.confirmDeletePatient();

    const deleteReq = httpMock.expectOne('/api/pacientes/patient-1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
    await Promise.resolve();

    const reloadReq = expectPatientList(httpMock);
    reloadReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    expect(component.isDeletePatientModalOpen).toBe(false);
    expect(component.toast).toEqual({ message: 'Excluido com sucesso', type: 'success' });
  });

  it('applies filters to the patient listing request', async () => {
    component.filters = {
      name: 'Maria',
      cpf: '123.456.789-01',
      phone: '(11) 99999-9999',
      active: 'true',
    };

    component.applyFilters();

    const req = expectPatientList(httpMock);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('name')).toBe('Maria');
    expect(req.request.params.get('cpf')).toBe('12345678901');
    expect(req.request.params.get('phone')).toBe('11999999999');
    expect(req.request.params.get('active')).toBe('true');
    req.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });
  });

  it('exports all filtered patients as CSV', async () => {
    component.filters = {
      name: 'Maria',
      cpf: '123.456.789-01',
      phone: '',
      active: 'true',
    };
    component.applyFilters();

    const filterReq = expectPatientList(httpMock);
    filterReq.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

    const exportPromise = component.exportPatients('csv');

    const firstPageReq = httpMock.expectOne(
      (req) => req.url === '/api/pacientes' && req.params.get('page') === '1',
    );
    expect(firstPageReq.request.params.get('pageSize')).toBe('100');
    expect(firstPageReq.request.params.get('name')).toBe('Maria');
    expect(firstPageReq.request.params.get('cpf')).toBe('12345678901');
    expect(firstPageReq.request.params.get('active')).toBe('true');
    firstPageReq.flush({
      items: [{ id: '1', name: 'Maria', cpf: '12345678901', status: 'A' }],
      page: 1,
      pageSize: 100,
      totalCount: 2,
      totalPages: 2,
    });
    await Promise.resolve();

    const secondPageReq = httpMock.expectOne(
      (req) => req.url === '/api/pacientes' && req.params.get('page') === '2',
    );
    secondPageReq.flush({
      items: [{ id: '2', name: 'Joao', cpf: '10987654321', status: 'I' }],
      page: 2,
      pageSize: 100,
      totalCount: 2,
      totalPages: 2,
    });
    await Promise.resolve();
    await Promise.resolve();
    await exportPromise;

    expect(exportService.export).toHaveBeenCalledWith('csv', 'pacientes', expect.any(Array), [
      { id: '1', name: 'Maria', cpf: '12345678901', status: 'A' },
      { id: '2', name: 'Joao', cpf: '10987654321', status: 'I' },
    ]);
    expect(component.toast).toEqual({ message: 'Exportação concluída', type: 'success' });
  });
});

function expectPatientList(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.url === '/api/pacientes' && req.method === 'GET');
}
