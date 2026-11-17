import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
