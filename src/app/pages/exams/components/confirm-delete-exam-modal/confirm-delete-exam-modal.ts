import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CloseIcon } from '../../../../shared/ui/icons/close-icon/close-icon';

@Component({
  selector: 'app-confirm-delete-exam-modal',
  imports: [CloseIcon],
  templateUrl: './confirm-delete-exam-modal.html',
  styleUrl: './confirm-delete-exam-modal.css',
})
export class ConfirmDeleteExamModal {
  @Input() patientName = '';
  @Input() patientCpf = '';
  @Input() isDeleting = false;
  @Input() error = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();
}
