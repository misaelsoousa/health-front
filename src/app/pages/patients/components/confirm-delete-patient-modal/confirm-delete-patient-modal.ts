import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CloseIcon } from '../../../../shared/ui/icons/close-icon/close-icon';

@Component({
  selector: 'app-confirm-delete-patient-modal',
  imports: [CloseIcon],
  templateUrl: './confirm-delete-patient-modal.html',
  styleUrl: './confirm-delete-patient-modal.css',
})
export class ConfirmDeletePatientModal {
  @Input() patientName = '';
  @Input() patientCpf = '';
  @Input() isDeleting = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();
}
