import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';

import { LinkIcon } from '../../ui/icons/link-icon/link-icon';
import { ExportFormat } from '../../services/export.service';

@Component({
  selector: 'app-export-menu',
  imports: [LinkIcon],
  templateUrl: './export-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportMenu {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() isExporting = false;
  @Output() formatSelected = new EventEmitter<ExportFormat>();

  isOpen = false;

  toggle() {
    if (this.isExporting) {
      return;
    }
    this.isOpen = !this.isOpen;
  }

  select(format: ExportFormat) {
    this.isOpen = false;
    this.formatSelected.emit(format);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) {
      return;
    }
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }
}
