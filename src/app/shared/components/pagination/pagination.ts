import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() totalCount = 0;
  @Input() totalPages = 0;

  @Output() pageChange = new EventEmitter<number>();

  get rangeStart(): number {
    if (this.totalCount === 0) {
      return 0;
    }
    return (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 1) {
      return total === 1 ? [1] : [];
    }

    const current = this.page;
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(total, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goTo(page: number) {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.pageChange.emit(page);
  }
}
