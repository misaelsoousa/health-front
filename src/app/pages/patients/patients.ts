import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, delay, finalize, map, of } from 'rxjs';

import { apiEndpoints } from '../../core/api/api-endpoints';
import { HttpService } from '../../core/services/http.service';
import { PlusIcon } from '../../shared/ui/icons/plus-icon/plus-icon';
import { FilterIcon } from '../../shared/ui/icons/filter-icon/filter-icon';
import { CloseIcon } from '../../shared/ui/icons/close-icon/close-icon';
import { SearchIcon } from '../../shared/ui/icons/search-icon/search-icon';
import {
  CreatePatientModal,
  CreatePatientRequest,
} from './components/create-patient-modal/create-patient-modal';
import { ConfirmDeletePatientModal } from './components/confirm-delete-patient-modal/confirm-delete-patient-modal';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MaskitoDirective } from '@maskito/angular';
import { CpfValidatorDirective } from '../../shared/validators/cpf.directive';
import { CPF_MASK, PHONE_MASK } from '../../shared/masks/masks';
import { NAME_MAX_LENGTH } from './components/create-patient-modal/create-patient-modal';
import { DEFAULT_PAGE_SIZE, PagedResponse } from '../../shared/types/paged-response';
import { Pagination } from '../../shared/components/pagination/pagination';
import { ExportMenu } from '../../shared/components/export-menu/export-menu';
import { ExportColumn, ExportFormat, ExportService } from '../../shared/services/export.service';
import { getApiErrorMessage } from '../../shared/utils/api-error';
import { firstValueFrom } from 'rxjs';

type Patient = {
  id?: string;
  name?: string;
  nome?: string;
  cpf?: string;
  phone?: string;
  telefone?: string;
  contato?: string;
  email?: string;
  birthDate?: string;
  status?: string;
};

type PatientDetailsResponse = Patient | Patient[] | { data: Patient | Patient[] };

type PatientForm = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  status: string;
};

type UpdatePatientRequest = {
  Name: string;
  Cpf: string;
  Phone: string;
  BirthDate: string;
  Status: string;
};

type PatientFilters = {
  name: string;
  cpf: string;
  phone: string;
  active: string;
};

type Toast = {
  message: string;
  type: 'success' | 'error';
};

const emptyFilters = (): PatientFilters => ({
  name: '',
  cpf: '',
  phone: '',
  active: '',
});

@Component({
  selector: 'app-patients',
  imports: [
    FormsModule,
    PlusIcon,
    FilterIcon,
    CloseIcon,
    SearchIcon,
    CreatePatientModal,
    ConfirmDeletePatientModal,
    NgxSkeletonLoaderModule,
    MaskitoDirective,
    CpfValidatorDirective,
    Pagination,
    ExportMenu,
  ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients implements OnInit {
  private readonly http = inject(HttpService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly exportService = inject(ExportService);
  private readonly exportPageSize = 100;
  private readonly exportColumns: ExportColumn<Patient>[] = [
    { header: 'Nome', accessor: (p) => p.name ?? p.nome ?? '', width: 30 },
    { header: 'CPF', accessor: (p) => this.formatCpf(p.cpf ?? ''), width: 18 },
    { header: 'Telefone', accessor: (p) => this.formatPhone(p.phone ?? p.telefone ?? p.contato ?? ''), width: 18 },
    {
      header: 'Status',
      accessor: (p) => this.getStatusLabel(p.status),
      width: 12,
    },
  ];
  private readonly defaultErrorMessage = 'Ocorreu um erro, tente novamente';
  private readonly statusLabels: Record<string, string> = {
    A: 'Ativo',
    I: 'Inativo',
  };

  isPatientModalOpen = false;
  isPatientDetailsLoading = false;
  isUpdatingPatient = false;
  patientDetailsError = '';
  patientDetailsForm = this.createEmptyPatientForm();
  isCreatePatientModalOpen = false;
  isCreatingPatient = false;
  createPatientError = '';
  isDeletePatientModalOpen = false;
  isDeletingPatient = false;
  deletePatientError = '';
  toast: Toast | null = null;

  patients: Patient[] = [];
  isLoadingPatients = false;
  patientLoadError = '';
  isExporting = false;
  page = 1;
  pageSize = DEFAULT_PAGE_SIZE;
  totalCount = 0;
  totalPages = 0;

  filters = emptyFilters();
  private appliedFilters = emptyFilters();

  readonly skeletonRows = Array.from({ length: 5 });
  readonly skeletonFormFields = Array.from({ length: 5 });
  readonly nameMaxLength = NAME_MAX_LENGTH;
  readonly cpfMask = CPF_MASK;
  readonly phoneMask = PHONE_MASK;

  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadPatients();
  }

  applyFilters() {
    this.appliedFilters = { ...this.filters };
    this.page = 1;
    this.loadPatients();
  }

  clearFilters() {
    this.filters = emptyFilters();
    this.appliedFilters = emptyFilters();
    this.page = 1;
    this.loadPatients();
  }

  goToPage(page: number) {
    if (page === this.page) {
      return;
    }
    this.page = page;
    this.loadPatients();
  }

  retryLoadPatients() {
    this.loadPatients();
  }

  async exportPatients(format: ExportFormat) {
    if (this.isExporting || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isExporting = true;
    this.updateView();

    try {
      const rows = await this.fetchAllFilteredPatients();
      await this.exportService.export(format, 'pacientes', this.exportColumns, rows);
      this.showToast('Exportação concluída', 'success');
    } catch {
      this.showToast(this.defaultErrorMessage, 'error');
    } finally {
      this.isExporting = false;
      this.updateView();
    }
  }

  private async fetchAllFilteredPatients(): Promise<Patient[]> {
    const all: Patient[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await firstValueFrom(
        this.http.get<PagedResponse<Patient>>(apiEndpoints.patients.list, {
          params: this.buildPatientParams(page, this.exportPageSize),
        }),
      );

      all.push(...response.items);
      totalPages = response.totalPages;
      page++;
    } while (page <= totalPages);

    return all;
  }

  private buildPatientParams(page: number, pageSize: number): Record<string, string | number> {
    const params: Record<string, string | number> = { page, pageSize };
    if (this.appliedFilters.name) {
      params['name'] = this.appliedFilters.name;
    }
    if (this.appliedFilters.cpf) {
      params['cpf'] = this.appliedFilters.cpf.replace(/\D/g, '');
    }
    if (this.appliedFilters.phone) {
      params['phone'] = this.appliedFilters.phone.replace(/\D/g, '');
    }
    if (this.appliedFilters.active) {
      params['active'] = this.appliedFilters.active;
    }
    return params;
  }

  getStatusLabel(status?: string) {
    if (!status) {
      return '-';
    }

    const normalizedStatus = status.trim().toUpperCase();

    return this.statusLabels[normalizedStatus] ?? status;
  }

  isActiveStatus(status?: string) {
    return status?.trim().toUpperCase() === 'A';
  }

  formatCpf(value?: string) {
    const digits = (value ?? '').replace(/\D/g, '');
    if (digits.length !== 11) {
      return value ?? '-';
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  formatPhone(value?: string) {
    const digits = (value ?? '').replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    if (!digits) {
      return value ?? '-';
    }

    return value ?? '-';
  }

  openPatientDetails(cpf?: string) {
    if (!cpf) {
      return;
    }

    this.isPatientModalOpen = true;
    this.isPatientDetailsLoading = true;
    this.patientDetailsError = '';
    this.patientDetailsForm = this.createEmptyPatientForm({ cpf });

    this.http
      .get<PatientDetailsResponse>(apiEndpoints.patients.details(cpf))
      .pipe(
        delay(1000),
        catchError((error) => {
          this.patientDetailsError = getApiErrorMessage(error, { context: 'patient' });
          this.showToast(this.patientDetailsError, 'error');
          return of(null);
        }),
        finalize(() => {
          this.isPatientDetailsLoading = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.patientDetailsForm = this.createPatientForm(this.getPatientFromResponse(response), cpf);
      });
  }

  closePatientModal() {
    this.isPatientModalOpen = false;
    this.isPatientDetailsLoading = false;
    this.isUpdatingPatient = false;
    this.patientDetailsError = '';
    this.patientDetailsForm = this.createEmptyPatientForm();
  }

  savePatientChanges() {
    const id = this.patientDetailsForm.id;

    if (!id) {
      this.patientDetailsError = 'ID nao informado para alteracao.';
      this.showToast(this.patientDetailsError, 'error');
      return;
    }

    this.isUpdatingPatient = true;
    this.patientDetailsError = '';

    const payload: UpdatePatientRequest = {
      Name: this.patientDetailsForm.name,
      Cpf: this.patientDetailsForm.cpf.replace(/\D/g, ''),
      Phone: this.patientDetailsForm.phone.replace(/\D/g, ''),
      BirthDate: this.patientDetailsForm.birthDate,
      Status: this.patientDetailsForm.status,
    };

    this.http
      .put<unknown, UpdatePatientRequest>(apiEndpoints.patients.put(id), payload)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.patientDetailsError = getApiErrorMessage(error, { context: 'patient' });
          this.showToast(this.patientDetailsError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isUpdatingPatient = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closePatientModal();
        this.loadPatients();
        this.showToast('Atualizado com sucesso', 'success');
      });
  }

  openDeletePatientModal() {
    if (!this.patientDetailsForm.id) {
      return;
    }

    this.isDeletePatientModalOpen = true;
    this.deletePatientError = '';
  }

  closeDeletePatientModal() {
    this.isDeletePatientModalOpen = false;
    this.isDeletingPatient = false;
    this.deletePatientError = '';
  }

  confirmDeletePatient() {
    const id = this.patientDetailsForm.id;

    if (!id) {
      this.deletePatientError = 'ID nao informado para exclusao.';
      return;
    }

    this.isDeletingPatient = true;
    this.deletePatientError = '';

    this.http
      .delete<unknown>(apiEndpoints.patients.delete(id))
      .pipe(
        map(() => true),
        catchError((error) => {
          this.deletePatientError = getApiErrorMessage(error, { context: 'patient' });
          this.showToast(this.deletePatientError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isDeletingPatient = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closeDeletePatientModal();
        this.closePatientModal();
        this.loadPatients();
        this.showToast('Excluido com sucesso', 'success');
      });
  }

  openCreatePatientModal() {
    this.isCreatePatientModalOpen = true;
    this.createPatientError = '';
  }

  closeCreatePatientModal() {
    this.isCreatePatientModalOpen = false;
    this.isCreatingPatient = false;
    this.createPatientError = '';
  }

  submitCreatePatient(payload: CreatePatientRequest) {
    this.isCreatingPatient = true;
    this.createPatientError = '';

    this.http
      .post<unknown, CreatePatientRequest>(apiEndpoints.patients.create, payload)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.createPatientError = getApiErrorMessage(error, { context: 'patient' });
          this.showToast(this.createPatientError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isCreatingPatient = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closeCreatePatientModal();
        this.loadPatients();
        this.showToast('Criado com sucesso', 'success');
      });
  }

  private getPatientFromResponse(response: PatientDetailsResponse): Patient | undefined {
    const patient = 'data' in response ? response.data : response;

    return Array.isArray(patient) ? patient[0] : patient;
  }

  private createEmptyPatientForm(patient?: Patient): PatientForm {
    return this.createPatientForm(patient);
  }

  private createPatientForm(patient?: Patient, fallbackCpf = ''): PatientForm {
    return {
      id: patient?.id ?? '',
      name: patient?.name ?? patient?.nome ?? '',
      cpf: this.formatCpf(patient?.cpf ?? fallbackCpf),
      phone: this.formatPhone(patient?.phone ?? patient?.telefone ?? patient?.contato ?? patient?.email ?? ''),
      birthDate: patient?.birthDate?.slice(0, 10) ?? '',
      status: patient?.status ?? '',
    };
  }

  private loadPatients() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingPatients = true;
    this.patientLoadError = '';
    this.updateView();

    this.http
      .get<PagedResponse<Patient>>(apiEndpoints.patients.list, {
        params: this.buildPatientParams(this.page, this.pageSize),
      })
      .pipe(
        catchError((error) => {
          this.patientLoadError = getApiErrorMessage(error, {
            context: 'patient',
            networkMessage: 'Falha de rede. Tentar novamente.',
          });
          return of<PagedResponse<Patient>>({ items: [], page: 1, pageSize: this.pageSize, totalCount: 0, totalPages: 0 });
        }),
        finalize(() => {
          this.isLoadingPatients = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.patients = response.items;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
      });
  }

  private showToast(message: string, type: Toast['type']) {
    this.toast = { message, type };
    this.updateView();

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toast = null;
      this.updateView();
    }, 3000);
  }

  private updateView() {
    this.changeDetectorRef.markForCheck();
  }
}
