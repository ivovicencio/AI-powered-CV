import { Component } from '@angular/core';
import { InstallPrompt } from '../install-prompt/install-prompt';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [InstallPrompt],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {}
