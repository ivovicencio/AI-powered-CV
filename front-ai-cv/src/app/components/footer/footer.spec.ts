import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Footer] }).compileComponents();
    fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
  });

  it('muestra la firma y los cuatro enlaces con sus URLs', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Hecho por');
    expect(text).toContain('Ivo Vicencio - ViroTech');

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.social-link') as NodeListOf<HTMLAnchorElement>
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.instagram.com/ivothaiel/',
      'https://www.facebook.com/ivothaiel.vicencio',
      'https://github.com/ivovicencio',
      'https://www.linkedin.com/in/ivo-vicencio-rosas-7aaa44211/'
    ]);
    expect(links.every((link) => link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
  });

  it('prepara una sugerencia en WhatsApp sin permitir un mensaje vacío', () => {
    const textarea = fixture.nativeElement.querySelector('#suggestion-message') as HTMLTextAreaElement;
    const button = fixture.nativeElement.querySelector('.suggestion-form button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    textarea.value = 'Agregar soporte para otros rubros';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    button.click();

    const [url, target, features] = openSpy.mock.calls[0];
    expect(url).toContain('https://wa.me/5492995757328?text=');
    expect(decodeURIComponent(url as string)).toContain('Agregar soporte para otros rubros');
    expect(target).toBe('_blank');
    expect(features).toContain('noopener');
  });
});
