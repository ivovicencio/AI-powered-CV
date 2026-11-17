import { Component, OnDestroy, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-install-prompt',
  imports: [],
  templateUrl: './install-prompt.html',
  styleUrl: './install-prompt.css'
})
export class InstallPrompt implements OnDestroy {
  protected readonly canInstall = signal(false);
  private deferredEvent: BeforeInstallPromptEvent | undefined;

  private readonly onBeforeInstall = (event: Event): void => {
    event.preventDefault();
    this.deferredEvent = event as BeforeInstallPromptEvent;
    this.canInstall.set(true);
  };

  private readonly onInstalled = (): void => {
    this.deferredEvent = undefined;
    this.canInstall.set(false);
  };

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.addEventListener('appinstalled', this.onInstalled);
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.removeEventListener('appinstalled', this.onInstalled);
  }

  protected async install(): Promise<void> {
    const event = this.deferredEvent;
    if (!event) {
      return;
    }

    await event.prompt();
    await event.userChoice;
    this.deferredEvent = undefined;
    this.canInstall.set(false);
  }
}
