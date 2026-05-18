import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaskitoDirective } from '@maskito/angular';

import { CloseIcon } from '../../../../shared/ui/icons/close-icon/close-icon';
import { CpfValidatorDirective } from '../../../../shared/validators/cpf.directive';
import { CPF_MASK, PHONE_MASK } from '../../../../shared/masks/masks';

export type CreatePatientRequest = {
  Name: string;
  Cpf: string;
  Phone: string;
  BirthDate: string;
};

export const NAME_MAX_LENGTH = 100;

@Component({
  selector: 'app-create-patient-modal',
  imports: [FormsModule, CloseIcon, MaskitoDirective, CpfValidatorDirective],
  templateUrl: './create-patient-modal.html',
  styleUrl: './create-patient-modal.css',
})
export class CreatePatientModal {
  @Input() isSubmitting = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() createPatient = new EventEmitter<CreatePatientRequest>();

  readonly nameMaxLength = NAME_MAX_LENGTH;
  readonly cpfMask = CPF_MASK;
  readonly phoneMask = PHONE_MASK;

  form: CreatePatientRequest = {
    Name: '',
    Cpf: '',
    Phone: '',
    BirthDate: '',
  };

  submit() {
    this.createPatient.emit({
      Name: this.form.Name.trim(),
      Cpf: this.form.Cpf.replace(/\D/g, ''),
      Phone: this.form.Phone.replace(/\D/g, ''),
      BirthDate: this.form.BirthDate,
    });
  }
}
