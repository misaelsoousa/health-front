import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { HttpService } from '../../core/services/http.service';
import { apiEndpoints } from '../../core/api/api-endpoints';
import { catchError, finalize, map, of } from 'rxjs';
import { PlusIcon } from '../../shared/ui/icons/plus-icon/plus-icon';
import { FilterIcon } from '../../shared/ui/icons/filter-icon/filter-icon';
import { CloseIcon } from '../../shared/ui/icons/close-icon/close-icon';
import { SearchIcon } from '../../shared/ui/icons/search-icon/search-icon';
import { ConfirmDeleteExamModal } from './components/confirm-delete-exam-modal/confirm-delete-exam-modal';
import { CreateExamModal, CreateExamRequest } from './components/create-exam-modal/create-exam-modal';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MaskitoDirective } from '@maskito/angular';
import { CpfValidatorDirective } from '../../shared/validators/cpf.directive';
import { CPF_MASK } from '../../shared/masks/masks';
import {
  DicomModality,
  DicomModalityValue,
  dicomModalities,
  dicomModalityOptions,
  getDicomModalityLabel,
  getDicomModalityValue,
} from './dicom-modalities';
import { DEFAULT_PAGE_SIZE, PagedResponse } from '../../shared/types/paged-response';
import { Pagination } from '../../shared/components/pagination/pagination';
import { ExportMenu } from '../../shared/components/export-menu/export-menu';
import { ExportColumn, ExportFormat, ExportService } from '../../shared/services/export.service';
import { getApiErrorMessage } from '../../shared/utils/api-error';
import { firstValueFrom } from 'rxjs';
import { DatePipe as AngularDatePipe } from '@angular/common';

type Exam = {
  id?: string;
  patientCpf?: string;
  cpf?: string;
  patientName?: string;
  name?: string;
  paciente?: string;
  modality?: number | string;
  descricao?: string;
  description?: string;
  examDate?: string;
  date?: string;
  updatedAt?: string;
};

type ExamDetailsResponse = Exam | Exam[] | { data: Exam | Exam[] };

type ExamForm = {
  id: string;
  patientCpf: string;
  patientName: string;
  modality: DicomModalityValue;
  descricao: string;
  examDate: string;
  updatedAt: string;
};

type UpdateExamRequest = {
  patientCpf: string;
  modality: DicomModalityValue;
  idempotencyKey: string;
  descricao: string;
  examDate: string;
};

type ExamFilters = {
  patientName: string;
  modalities: DicomModality[];
  startDate: string;
  endDate: string;
};

type Toast = {
  message: string;
  type: 'success' | 'error';
};

const emptyFilters = (): ExamFilters => ({
  patientName: '',
  modalities: [],
  startDate: '',
  endDate: '',
});

@Component({
  selector: 'app-exams',
  imports: [
    DatePipe,
    FormsModule,
    PlusIcon,
    FilterIcon,
    CloseIcon,
    SearchIcon,
    CreateExamModal,
    ConfirmDeleteExamModal,
    NgxSkeletonLoaderModule,
    MaskitoDirective,
    CpfValidatorDirective,
    Pagination,
    ExportMenu,
  ],
  templateUrl: './exams.html',
  styleUrl: './exams.css',
})
export class Exams implements OnInit {
  private readonly http = inject(HttpService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly exportService = inject(ExportService);
  private readonly datePipe = new AngularDatePipe('en-US');
  private readonly defaultErrorMessage = 'Ocorreu um erro, tente novamente';
  private readonly exportPageSize = 100;
  private readonly exportColumns: ExportColumn<Exam>[] = [
    { header: 'Paciente', accessor: (e) => e.patientName ?? '', width: 30 },
    { header: 'Modalidade', accessor: (e) => getDicomModalityLabel(e.modality), width: 14 },
    {
      header: 'Data do exame',
      accessor: (e) => this.datePipe.transform(e.examDate, 'dd/MM/yyyy') ?? '',
      width: 16,
    },
    {
      header: 'Ultima atualizacao',
      accessor: (e) => this.datePipe.transform(e.updatedAt, 'dd/MM/yyyy HH:mm') ?? '',
      width: 20,
    },
  ];

  isExamModalOpen = false;
  isExamDetailsLoading = false;
  isUpdatingExam = false;
  examDetailsError = '';
  examDetailsForm = this.createEmptyExamForm();
  isCreateExamModalOpen = false;
  isCreatingExam = false;
  createExamError = '';
  isDeleteExamModalOpen = false;
  isDeletingExam = false;
  deleteExamError = '';
  toast: Toast | null = null;

  exams: Exam[] = [];
  isLoadingExams = false;
  examLoadError = '';
  isExporting = false;
  page = 1;
  pageSize = DEFAULT_PAGE_SIZE;
  totalCount = 0;
  totalPages = 0;

  filters = emptyFilters();
  private appliedFilters = emptyFilters();

  readonly modalityOptions = dicomModalityOptions;
  readonly modalityCodes = dicomModalities;
  readonly skeletonRows = Array.from({ length: 5 });
  readonly skeletonFormFields = Array.from({ length: 6 });
  readonly cpfMask = CPF_MASK;

  private toastTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadExams();
  }

  applyFilters() {
    this.appliedFilters = { ...this.filters, modalities: [...this.filters.modalities] };
    this.page = 1;
    this.loadExams();
  }

  clearFilters() {
    this.filters = emptyFilters();
    this.appliedFilters = emptyFilters();
    this.page = 1;
    this.loadExams();
  }

  goToPage(page: number) {
    if (page === this.page) {
      return;
    }
    this.page = page;
    this.loadExams();
  }

  retryLoadExams() {
    this.loadExams();
  }

  async exportExams(format: ExportFormat) {
    if (this.isExporting || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isExporting = true;
    this.updateView();

    try {
      const rows = await this.fetchAllFilteredExams();
      await this.exportService.export(format, 'exames', this.exportColumns, rows);
      this.showToast('Exportação concluída', 'success');
    } catch {
      this.showToast(this.defaultErrorMessage, 'error');
    } finally {
      this.isExporting = false;
      this.updateView();
    }
  }

  private async fetchAllFilteredExams(): Promise<Exam[]> {
    const all: Exam[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await firstValueFrom(
        this.http.get<PagedResponse<Exam>>(apiEndpoints.exams.list, {
          params: this.buildExamParams(page, this.exportPageSize),
        }),
      );

      all.push(...response.items);
      totalPages = response.totalPages;
      page++;
    } while (page <= totalPages);

    return all;
  }

  private buildExamParams(page: number, pageSize: number) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (this.appliedFilters.patientName) {
      params = params.set('patientName', this.appliedFilters.patientName);
    }
    if (this.appliedFilters.startDate) {
      params = params.set('startDate', this.appliedFilters.startDate);
    }
    if (this.appliedFilters.endDate) {
      params = params.set('endDate', this.appliedFilters.endDate);
    }
    for (const modality of this.appliedFilters.modalities) {
      params = params.append('modalities', modality);
    }
    return params;
  }

  toggleModality(modality: DicomModality) {
    const index = this.filters.modalities.indexOf(modality);
    if (index === -1) {
      this.filters.modalities = [...this.filters.modalities, modality];
    } else {
      this.filters.modalities = this.filters.modalities.filter((_, i) => i !== index);
    }
  }

  isModalitySelected(modality: DicomModality) {
    return this.filters.modalities.includes(modality);
  }

  getModalityLabel(modality?: number | string) {
    return getDicomModalityLabel(modality);
  }

  openExamDetails(exam: Exam) {
    this.isExamModalOpen = true;
    this.isExamDetailsLoading = true;
    this.examDetailsError = '';
    this.examDetailsForm = this.createExamForm(this.normalizeExam(exam));

    if (!exam.id) {
      this.examDetailsError = 'ID do exame nao informado.';
      this.isExamDetailsLoading = false;
      this.showToast(this.examDetailsError, 'error');
      this.updateView();
      return;
    }

    this.http
      .get<ExamDetailsResponse>(apiEndpoints.exams.details(exam.id))
      .pipe(
        catchError((error) => {
          this.examDetailsError = getApiErrorMessage(error, { context: 'exam' });
          this.showToast(this.examDetailsError, 'error');
          return of(null);
        }),
        finalize(() => {
          this.isExamDetailsLoading = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.examDetailsForm = this.createExamForm(this.normalizeExam(this.getExamFromResponse(response, exam.id) ?? exam));
      });
  }

  closeExamModal() {
    this.isExamModalOpen = false;
    this.isExamDetailsLoading = false;
    this.isUpdatingExam = false;
    this.examDetailsError = '';
    this.examDetailsForm = this.createEmptyExamForm();
  }

  saveExamChanges() {
    const id = this.examDetailsForm.id;

    if (!id) {
      this.examDetailsError = 'ID nao informado para alteracao.';
      this.showToast(this.examDetailsError, 'error');
      return;
    }

    this.isUpdatingExam = true;
    this.examDetailsError = '';

    const payload: UpdateExamRequest = {
      patientCpf: this.examDetailsForm.patientCpf.replace(/\D/g, ''),
      modality: this.examDetailsForm.modality,
      idempotencyKey: crypto.randomUUID(),
      descricao: this.examDetailsForm.descricao,
      examDate: this.toDateTimeOffset(this.examDetailsForm.examDate),
    };

    this.http
      .put<unknown, UpdateExamRequest>(apiEndpoints.exams.put(id), payload)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.examDetailsError = getApiErrorMessage(error, { context: 'exam' });
          this.showToast(this.examDetailsError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isUpdatingExam = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closeExamModal();
        this.loadExams();
        this.showToast('Atualizado com sucesso', 'success');
      });
  }

  openCreateExamModal() {
    this.isCreateExamModalOpen = true;
    this.createExamError = '';
  }

  closeCreateExamModal() {
    this.isCreateExamModalOpen = false;
    this.isCreatingExam = false;
    this.createExamError = '';
  }

  submitCreateExam(payload: CreateExamRequest) {
    this.isCreatingExam = true;
    this.createExamError = '';

    this.http
      .post<unknown, CreateExamRequest>(apiEndpoints.exams.create, payload)
      .pipe(
        map(() => true),
        catchError((error) => {
          this.createExamError = getApiErrorMessage(error, { context: 'exam' });
          this.showToast(this.createExamError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isCreatingExam = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closeCreateExamModal();
        this.loadExams();
        this.showToast('Criado com sucesso', 'success');
      });
  }

  openDeleteExamModal() {
    if (!this.examDetailsForm.id) {
      return;
    }

    this.isDeleteExamModalOpen = true;
    this.deleteExamError = '';
  }

  closeDeleteExamModal() {
    this.isDeleteExamModalOpen = false;
    this.isDeletingExam = false;
    this.deleteExamError = '';
  }

  confirmDeleteExam() {
    const id = this.examDetailsForm.id;

    if (!id) {
      this.deleteExamError = 'ID nao informado para exclusao.';
      this.showToast(this.deleteExamError, 'error');
      return;
    }

    this.isDeletingExam = true;
    this.deleteExamError = '';

    this.http
      .delete<unknown>(apiEndpoints.exams.delete(id))
      .pipe(
        map(() => true),
        catchError((error) => {
          this.deleteExamError = getApiErrorMessage(error, { context: 'exam' });
          this.showToast(this.deleteExamError, 'error');
          return of(false);
        }),
        finalize(() => {
          this.isDeletingExam = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((success) => {
        if (!success) {
          return;
        }

        this.closeDeleteExamModal();
        this.closeExamModal();
        this.loadExams();
        this.showToast('Excluido com sucesso', 'success');
      });
  }

  private getExamFromResponse(response: ExamDetailsResponse, selectedExamId?: string): Exam | undefined {
    const exam = 'data' in response ? response.data : response;
    const exams = Array.isArray(exam) ? exam : [exam];

    return exams.find((item) => item.id === selectedExamId) ?? exams[0];
  }

  private normalizeExam(exam?: Exam): Exam | undefined {
    if (!exam) {
      return undefined;
    }

    return {
      ...exam,
      patientCpf: exam.patientCpf ?? exam.cpf ?? '',
      patientName: exam.patientName ?? exam.name ?? exam.paciente ?? '',
      descricao: exam.descricao ?? exam.description ?? '',
      examDate: exam.examDate ?? exam.date ?? '',
    };
  }

  private createEmptyExamForm(exam?: Exam): ExamForm {
    return this.createExamForm(exam);
  }

  private createExamForm(exam?: Exam): ExamForm {
    const normalized = this.normalizeExam(exam);

    return {
      id: normalized?.id ?? '',
      patientCpf: normalized?.patientCpf ?? '',
      patientName: normalized?.patientName ?? '',
      modality: getDicomModalityValue(normalized?.modality),
      descricao: normalized?.descricao ?? '',
      examDate: normalized?.examDate?.slice(0, 10) ?? '',
      updatedAt: normalized?.updatedAt ?? '',
    };
  }

  private loadExams() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingExams = true;
    this.examLoadError = '';
    this.updateView();

    this.http
      .get<PagedResponse<Exam>>(apiEndpoints.exams.list, {
        params: this.buildExamParams(this.page, this.pageSize),
      })
      .pipe(
        catchError((error) => {
          this.examLoadError = getApiErrorMessage(error, {
            context: 'exam',
            networkMessage: 'Falha de rede. Tentar novamente.',
          });
          return of<PagedResponse<Exam>>({ items: [], page: 1, pageSize: this.pageSize, totalCount: 0, totalPages: 0 });
        }),
        finalize(() => {
          this.isLoadingExams = false;
          this.updateView();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.exams = response.items;
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

  private toDateTimeOffset(date: string) {
    return date ? `${date}T00:00:00-03:00` : '';
  }
}
