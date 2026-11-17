import { Component } from '@angular/core';

interface SocialLink {
  readonly label: string;
  readonly icon: string;
  readonly url: string;
}

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  protected readonly year = new Date().getFullYear();

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
}
