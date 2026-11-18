import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface SocialLink {
  readonly label: string;
  readonly icon: string;
  readonly url: string;
}

@Component({
  selector: 'app-footer',
  imports: [FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  protected readonly year = new Date().getFullYear();
  protected readonly suggestion = signal('');

  protected readonly socials: readonly SocialLink[] = [
    { label: 'Instagram', icon: 'bi-instagram', url: 'https://www.instagram.com/ivothaiel/' },
    { label: 'Facebook', icon: 'bi-facebook', url: 'https://www.facebook.com/ivothaiel.vicencio' },
    { label: 'GitHub', icon: 'bi-github', url: 'https://github.com/ivovicencio' },
    {
      label: 'LinkedIn',
      icon: 'bi-linkedin',
      url: 'https://www.linkedin.com/in/ivo-vicencio-rosas-7aaa44211/'
    }
  ];

  protected sendSuggestion(): void {
    const message = this.suggestion().trim();
    if (!message) return;

    const text = `Sugerencia para CVOLVE:\n\n${message}`;
    window.open(
      `https://wa.me/5492995757328?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }
}
