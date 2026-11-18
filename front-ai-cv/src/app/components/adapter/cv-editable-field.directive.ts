import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

export interface CvFieldChange {
  path: string;
  value: string;
}

@Directive({
  selector: '[appCvEditableField]',
  standalone: true,
})
export class CvEditableFieldDirective {
  @Input() appCvEditableField = '';
  @Input() cvEditing = false;
  @Input() cvFieldLabel = '';
  @Input() cvFieldMultiline = false;
  @Output() cvFieldChange = new EventEmitter<CvFieldChange>();

  @HostBinding('attr.contenteditable')
  get contentEditable(): string | null {
    return this.cvEditing ? 'true' : null;
  }

  @HostBinding('attr.role')
  get role(): string | null {
    return this.cvEditing ? 'textbox' : null;
  }

  @HostBinding('attr.aria-label')
  get ariaLabel(): string | null {
    return this.cvEditing ? this.cvFieldLabel : null;
  }

  @HostBinding('attr.data-placeholder')
  get placeholder(): string | null {
    return this.cvEditing ? `Agregar ${this.cvFieldLabel.toLocaleLowerCase()}` : null;
  }

  @HostBinding('attr.aria-multiline')
  get ariaMultiline(): string | null {
    return this.cvEditing && this.cvFieldMultiline ? 'true' : null;
  }

  @HostBinding('attr.tabindex')
  get tabIndex(): string | null {
    return this.cvEditing ? '0' : null;
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    if (!this.cvEditing) return;

    const element = event.target as HTMLElement;
    this.cvFieldChange.emit({
      path: this.appCvEditableField,
      value: (element.innerText || element.textContent || '').trim(),
    });
  }
}
