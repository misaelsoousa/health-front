import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { AppLayout } from './shared/layouts/app-layout/app-layout';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should route / through the app layout and render the dashboard', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/', AppLayout);

    expect(component).toBeInstanceOf(AppLayout);
    expect(harness.routeNativeElement?.textContent).toContain('Dashboard');
  });
});
