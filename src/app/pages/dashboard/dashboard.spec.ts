import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the summary and charts', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Dashboard');
    expect(text).toContain('Pacientes cadastrados');
    expect(text).toContain('Distribuição de pacientes');
    expect(text).toContain('Volume por modalidade DICOM');
  });
});
