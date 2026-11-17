import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstallPrompt } from './install-prompt';

describe('InstallPrompt', () => {
  let fixture: ComponentFixture<InstallPrompt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InstallPrompt] }).compileComponents();
    fixture = TestBed.createComponent(InstallPrompt);
    fixture.detectChanges();
  });

  it('permanece oculto hasta que el navegador ofrece instalar la app', () => {
    expect(fixture.nativeElement.querySelector('.install-button')).toBeNull();
  });

  it('aparece cuando el navegador dispara beforeinstallprompt', () => {
    window.dispatchEvent(new Event('beforeinstallprompt'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.install-button')).not.toBeNull();
  });
});
