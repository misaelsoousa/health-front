import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';

import { CloseIcon } from '../../../../shared/ui/icons/close-icon/close-icon';
import { CpfValidatorDirective } from '../../../../shared/validators/cpf.directive';
import { CPF_MASK } from '../../../../shared/masks/masks';
import { DicomModalityValue, dicomModalityOptions } from '../../dicom-modalities';

export type CreateExamRequest = {
  patientCpf: string;
  modality: DicomModalityValue;
  idempotencyKey: string;
  descricao: string;
  examDate: string;
};

@Component({
  selector: 'app-create-exam-modal',
  imports: [FormsModule, CloseIcon, MaskitoDirective, CpfValidatorDirective],
  templateUrl: './create-exam-modal.html',
  styleUrl: './create-exam-modal.css',
})
export class CreateExamModal {
  @Input() isSubmitting = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() createExam = new EventEmitter<CreateExamRequest>();

  readonly modalityOptions = dicomModalityOptions;
  readonly cpfMask = CPF_MASK;

  form = {
    patientCpf: '',
    modality: 0 as DicomModalityValue,
    descricao: '',
    examDate: '',
  };

  submit() {
    this.createExam.emit({
      patientCpf: this.form.patientCpf.replace(/\D/g, ''),
      modality: this.form.modality,
      idempotencyKey: crypto.randomUUID(),
      descricao: this.form.descricao.trim(),
      examDate: this.toDateTimeOffset(this.form.examDate),
    });
  }

  private toDateTimeOffset(date: string) {
    return date ? `${date}T00:00:00-03:00` : '';
  }
}
