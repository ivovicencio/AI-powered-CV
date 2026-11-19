import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CvService } from '../../services/cv.service';
import { AdaptedCv, ProactiveContext } from '../../interfaces/cv.interface';
import {
  PROACTIVE_SECTORS,
  ProactiveOrganization,
} from '../../data/proactive-catalog';
import { CvEditableFieldDirective, CvFieldChange } from './cv-editable-field.directive';
import { updateCvField, updateCvProjectType } from './cv-field-editor';

type ApplicationMode = 'offer' | 'proactive';

@Component({
  selector: 'app-adapter',
  standalone: true,
  imports: [CommonModule, FormsModule, CvEditableFieldDirective],
  templateUrl: './adapter.html',
  styleUrl: './adapter.css',
})
export class Adapter {
  private readonly cvService = inject(CvService);

  readonly mode = signal<ApplicationMode>('offer');
  readonly proactiveSectors = PROACTIVE_SECTORS;
  readonly selectedSectorId = signal<string>('');
  readonly selectedOrganization = signal<ProactiveOrganization | null>(null);
  readonly customOrganization = signal<string>('');
  readonly desiredRole = signal<string>('');
  readonly proactiveNote = signal<string>('');
  readonly coverNote = signal<string | null>(null);
  readonly copiedNoteSuccess = signal<boolean>(false);

  readonly selectedSector = computed(
    () => this.proactiveSectors.find((sector) => sector.id === this.selectedSectorId()) ?? null,
  );
  readonly sectorOrganizations = computed(() => this.selectedSector()?.organizations ?? []);
  readonly organizationName = computed(() => {
    const custom = this.customOrganization().trim();
    return custom || this.selectedOrganization()?.name || '';
  });
  readonly organizationKind = computed(() =>
    this.customOrganization().trim() ? 'Empresa' : (this.selectedOrganization()?.kind ?? ''),
  );

  selectedFile = signal<File | null>(null);
  isDragging = signal<boolean>(false);
  jobUrl = signal<string>('');
  jobDescription = signal<string>('');

  isExtractingUrl = signal<boolean>(false);
  isAdapting = signal<boolean>(false);
  isExportingDocx = signal<boolean>(false);
  isExportingPdf = signal<boolean>(false);
  copiedSuccess = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);
  adaptedCv = signal<AdaptedCv | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  private validateAndSetFile(file: File): void {
    this.errorMessage.set(null);
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!validTypes.includes(file.type)) {
      this.errorMessage.set('Solo se permiten archivos PDF o DOCX.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      this.errorMessage.set('El archivo supera el límite de 4 MB.');
      return;
    }

    this.selectedFile.set(file);
    this.clearAdaptedCvIfInputsChanged();
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.clearAdaptedCvIfInputsChanged();
  }

  setMode(mode: ApplicationMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.clearAdaptedCvIfInputsChanged(
      'Cambiaste el modo de postulación. Generá el CV nuevamente para el destino elegido.',
    );
  }

  selectSector(sectorId: string): void {
    this.selectedSectorId.set(sectorId);
    this.selectedOrganization.set(null);
    this.customOrganization.set('');
    this.clearAdaptedCvIfInputsChanged(
      'Cambiaste el rubro. Elegí la organización y generá el CV nuevamente.',
    );
  }

  selectOrganization(organization: ProactiveOrganization): void {
    this.selectedOrganization.set(organization);
    this.customOrganization.set('');
    this.clearAdaptedCvIfInputsChanged();
  }

  onCustomOrganizationChange(value: string): void {
    this.customOrganization.set(value);
    if (value.trim()) this.selectedOrganization.set(null);
    this.clearAdaptedCvIfInputsChanged();
  }

  onDesiredRoleChange(value: string): void {
    this.desiredRole.set(value);
    this.clearAdaptedCvIfInputsChanged();
  }

  onProactiveNoteChange(value: string): void {
    this.proactiveNote.set(value);
    this.clearAdaptedCvIfInputsChanged();
  }

  onJobDescriptionChange(description: string): void {
    this.jobDescription.set(description);
    this.clearAdaptedCvIfInputsChanged();
  }

  private clearAdaptedCvIfInputsChanged(
    message = 'Cambiaste los datos de la postulación. Adaptá el CV nuevamente antes de descargarlo.',
  ): void {
    if (!this.adaptedCv()) return;

    this.adaptedCv.set(null);
    this.coverNote.set(null);
    this.copiedNoteSuccess.set(false);
    this.isEditing.set(false);
    this.copiedSuccess.set(false);
    this.infoMessage.set(message);
  }

  extractFromUrl(): void {
    const url = this.jobUrl().trim();
    if (!url) {
      this.errorMessage.set('Pegá el enlace público de la oferta primero.');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.isExtractingUrl.set(true);

    this.cvService.extractJobDescription(url).subscribe({
      next: (res) => {
        this.isExtractingUrl.set(false);
        if (res.status === '1' && res.data?.description) {
          this.onJobDescriptionChange(res.data.description);
          this.infoMessage.set(
            'Descripción extraída desde la URL. Podés revisarla o ajustarla abajo.',
          );
        } else {
          this.errorMessage.set(res.msg || 'No se pudo leer la URL. Pegá el texto manualmente.');
        }
      },
      error: (err) => {
        this.isExtractingUrl.set(false);
        this.errorMessage.set(
          err?.error?.msg ||
            'El sitio bloqueó la extracción automática. Copiá y pegá la descripción abajo.',
        );
      },
    });
  }

  generateAdaptedCv(): void {
    if (this.isAdapting()) return;

    const file = this.selectedFile();

    if (!file) {
      this.errorMessage.set('Adjuntá tu CV en PDF o DOCX.');
      return;
    }

    if (this.mode() === 'proactive') {
      this.generateProactiveCv(file);
      return;
    }

    const desc = this.jobDescription().trim();
    if (desc.length < 20) {
      this.errorMessage.set('Ingresá una descripción de oferta válida (mínimo 20 caracteres).');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.adaptedCv.set(null);
    this.isEditing.set(false);
    this.copiedSuccess.set(false);
    this.isAdapting.set(true);

    const inputsStillMatch = () =>
      this.selectedFile() === file && this.jobDescription().trim() === desc;

    this.cvService.adaptCv(file, desc).subscribe({
      next: (res) => {
        this.isAdapting.set(false);
        if (!inputsStillMatch()) {
          this.infoMessage.set(
            'Cambiaste los datos mientras se procesaba. Adaptá el CV nuevamente con la versión actual.',
          );
          return;
        }
        if (res.status === '1' && res.data) {
          this.adaptedCv.set(res.data);
          this.infoMessage.set(
            'Adaptación lista. Revisá tus datos, fechas y logros antes de descargar.',
          );
        } else {
          this.errorMessage.set(res.msg || 'No se pudo generar la adaptación.');
        }
      },
      error: (err) => {
        this.isAdapting.set(false);
        if (!inputsStillMatch()) {
          this.infoMessage.set(
            'Cambiaste los datos mientras se procesaba. Adaptá el CV nuevamente con la versión actual.',
          );
          return;
        }
        this.errorMessage.set(
          err?.error?.msg ||
            'No pudimos conectar con el servicio. Verificá tu conexión e intentá de nuevo.',
        );
      },
    });
  }

  private generateProactiveCv(file: File): void {
    const sector = this.selectedSector()?.label.trim() || '';
    const organization = this.organizationName().trim();
    const organizationKind = this.organizationKind();
    const desiredRole = this.desiredRole().trim();
    const note = this.proactiveNote().trim();
    const sectorId = this.selectedSectorId();

    if (!sector) {
      this.errorMessage.set('Elegí el rubro de la organización.');
      return;
    }

    if (organization.length < 3) {
      this.errorMessage.set('Elegí una empresa u organismo, o escribí su nombre.');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.adaptedCv.set(null);
    this.coverNote.set(null);
    this.copiedNoteSuccess.set(false);
    this.isEditing.set(false);
    this.copiedSuccess.set(false);
    this.isAdapting.set(true);

    const inputsStillMatch = () =>
      this.selectedFile() === file &&
      this.mode() === 'proactive' &&
      this.selectedSectorId() === sectorId &&
      this.organizationName().trim() === organization &&
      this.desiredRole().trim() === desiredRole &&
      this.proactiveNote().trim() === note;

    const context: ProactiveContext = {
      sector,
      organization,
      organizationKind,
      desiredRole,
      note,
    };

    this.cvService.proactiveCv(file, context).subscribe({
      next: (res) => {
        this.isAdapting.set(false);
        if (!inputsStillMatch()) {
          this.infoMessage.set(
            'Cambiaste los datos mientras se procesaba. Generá el CV nuevamente con la versión actual.',
          );
          return;
        }
        if (res.status === '1' && res.data) {
          this.adaptedCv.set(res.data.cv);
          this.coverNote.set(res.data.note);
          this.infoMessage.set(
            'CV espontáneo listo. Revisá el texto y la nota antes de enviarlos.',
          );
        } else {
          this.errorMessage.set(res.msg || 'No se pudo generar el CV espontáneo.');
        }
      },
      error: (err) => {
        this.isAdapting.set(false);
        if (!inputsStillMatch()) {
          this.infoMessage.set(
            'Cambiaste los datos mientras se procesaba. Generá el CV nuevamente con la versión actual.',
          );
          return;
        }
        this.errorMessage.set(
          err?.error?.msg ||
            'No pudimos conectar con el servicio. Verificá tu conexión e intentá de nuevo.',
        );
      },
    });
  }

  onCvFieldChange(change: CvFieldChange): void {
    this.copiedSuccess.set(false);
    this.adaptedCv.update((cv) => (cv ? updateCvField(cv, change) : null));
  }

  updateProjectType(index: number, type: string): void {
    this.copiedSuccess.set(false);
    this.adaptedCv.update((cv) => (cv ? updateCvProjectType(cv, index, type) : null));
  }

  downloadDocx(): void {
    const cv = this.adaptedCv();
    if (!cv) return;

    this.isExportingDocx.set(true);
    this.cvService.exportDocx(cv).subscribe({
      next: (blob) => {
        this.isExportingDocx.set(false);
        this.triggerDownload(
          blob,
          `CV_${cv.personalInfo.targetRoleTitle.replace(/\s+/g, '_')}.docx`,
        );
        this.infoMessage.set('El archivo DOCX está listo.');
      },
      error: () => {
        this.isExportingDocx.set(false);
        this.errorMessage.set('Error al descargar el archivo DOCX.');
      },
    });
  }

  downloadPdf(): void {
    const cv = this.adaptedCv();
    if (!cv) return;

    this.isExportingPdf.set(true);
    this.cvService.exportPdf(cv).subscribe({
      next: (blob) => {
        this.isExportingPdf.set(false);
        this.triggerDownload(
          blob,
          `CV_${cv.personalInfo.targetRoleTitle.replace(/\s+/g, '_')}.pdf`,
        );
        this.infoMessage.set('El archivo PDF está listo.');
      },
      error: () => {
        this.isExportingPdf.set(false);
        this.errorMessage.set('Error al descargar el archivo PDF.');
      },
    });
  }

  copyFormattedText(): void {
    const cv = this.adaptedCv();
    if (!cv) return;

    const lines: string[] = [];
    lines.push(cv.personalInfo.fullName.toUpperCase());
    lines.push(cv.personalInfo.targetRoleTitle);

    const contacts = [
      cv.personalInfo.location,
      cv.personalInfo.phone,
      cv.personalInfo.email,
      cv.personalInfo.linkedin,
      cv.personalInfo.github,
      cv.personalInfo.portfolio,
    ].filter(Boolean);

    if (contacts.length) lines.push(contacts.join(' | '));
    lines.push('');

    if (cv.professionalSummary) {
      lines.push('PERFIL PROFESIONAL');
      lines.push(cv.professionalSummary);
      lines.push('');
    }

    if (cv.keySkills?.length) {
      lines.push('HABILIDADES CLAVE');
      cv.keySkills.forEach((g) => lines.push(`• ${g.category}: ${g.skills.join(', ')}`));
      lines.push('');
    }

    if (cv.workExperience?.length) {
      lines.push('EXPERIENCIA PROFESIONAL');
      cv.workExperience.forEach((exp) => {
        lines.push(`${exp.role} — ${exp.company} (${exp.period})`);
        exp.achievements?.forEach((a) => lines.push(`  - ${a}`));
      });
      lines.push('');
    }

    if (cv.academicAndPersonalProjects?.length) {
      lines.push('PROYECTOS RELEVANTES');
      cv.academicAndPersonalProjects.forEach((proj) => {
        const toolsAndMethods = proj.toolsAndMethods?.length
          ? ` — ${proj.toolsAndMethods.join(', ')}`
          : '';
        lines.push(`${proj.name} [${proj.type}]${toolsAndMethods}`);
        lines.push(`  ${proj.description}`);
        proj.highlights?.forEach((h) => lines.push(`  - ${h}`));
      });
      lines.push('');
    }

    if (cv.education?.length) {
      lines.push('FORMACIÓN ACADÉMICA');
      cv.education.forEach((edu) => {
        lines.push(
          `${edu.degree} — ${edu.institution} (${edu.period}${edu.status ? ' - ' + edu.status : ''})`,
        );
      });
      lines.push('');
    }

    if (cv.certificationsAndCourses?.length) {
      lines.push('CERTIFICACIONES Y CURSOS');
      cv.certificationsAndCourses.forEach((c) => lines.push(`• ${c}`));
      lines.push('');
    }

    if (cv.languages?.length) {
      lines.push('IDIOMAS');
      lines.push(cv.languages.join(' • '));
    }

    if (!navigator.clipboard?.writeText) {
      this.errorMessage.set(
        'El navegador no permite copiar el texto. Podés descargar el CV en DOCX o PDF.',
      );
      return;
    }

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        this.copiedSuccess.set(true);
        setTimeout(() => this.copiedSuccess.set(false), 2500);
      })
      .catch(() => {
        this.errorMessage.set(
          'No se pudo copiar el texto. Revisá los permisos del navegador o descargá el CV.',
        );
      });
  }

  copyCoverNote(): void {
    const note = this.coverNote()?.trim() || '';
    if (!note) return;

    if (!navigator.clipboard?.writeText) {
      this.errorMessage.set('El navegador no permite copiar. Seleccioná el texto de la nota manualmente.');
      return;
    }

    navigator.clipboard
      .writeText(note)
      .then(() => {
        this.copiedNoteSuccess.set(true);
        setTimeout(() => this.copiedNoteSuccess.set(false), 2500);
      })
      .catch(() => {
        this.errorMessage.set('No se pudo copiar la nota. Seleccioná el texto manualmente.');
      });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
