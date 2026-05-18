import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { DashboardIcon } from '../../ui/icons/dashboard-icon/dashboard-icon';
import { PatientsIcon } from '../../ui/icons/patients-icon/patients-icon';
import { ExamsIcon } from '../../ui/icons/exams-icon/exams-icon';

type SidebarTab = 'dashboard' | 'patients' | 'exams';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, DashboardIcon, PatientsIcon, ExamsIcon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  tabActive: SidebarTab = this.getTabFromUrl(this.router.url);
  isOpen = false;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.tabActive = this.getTabFromUrl(event.urlAfterRedirects);
        this.isOpen = false;
      });
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  private getTabFromUrl(url: string): SidebarTab {
    const path = url.split('?')[0].split('#')[0];

    if (path.startsWith('/patients')) {
      return 'patients';
    }

    if (path.startsWith('/exams')) {
      return 'exams';
    }

    return 'dashboard';
  }
}
