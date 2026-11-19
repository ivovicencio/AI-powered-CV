import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { CvService } from '../../services/cv.service';
import { AdaptedCv, ApiResponse, ProactiveResult } from '../../interfaces/cv.interface';

import { Adapter } from './adapter';

const adaptedCvFixture: AdaptedCv = {
  personalInfo: {
    fullName: 'Alex Ejemplo',
    targetRoleTitle: 'Analista económico-financiera',
    email: 'alex@example.com',
    phone: '299 555 0101',
  },
  professionalSummary: 'Perfil orientado al análisis y la investigación.',
  keySkills: [{ category: 'Economía', skills: ['Análisis financiero', 'Estadística'] }],
  workExperience: [
    {
      role: 'Asistente de investigación',
      company: 'Universidad Ejemplo',
      period: '2024–2025',
      achievements: ['Analizó indicadores económicos.'],
    },
  ],
  academicAndPersonalProjects: [
    {
      name: 'Pronósticos económicos',
      type: 'Académico',
      toolsAndMethods: ['Estadística'],
      description: 'Estudio de tendencias y escenarios.',
      highlights: ['Presentó resultados a un equipo docente.'],
    },
  ],
  education: [
    {
      degree: 'Licenciatura en Economía',
      institution: 'Universidad Ejemplo',
      period: '2022–2026',
    },
  ],
  certificationsAndCourses: ['Introducción a econometría'],
  languages: ['Español'],
};

const cvService = {
  extractJobDescription: vi.fn(),
  adaptCv: vi.fn(),
  proactiveCv: vi.fn(),
  exportDocx: vi.fn(),
  exportPdf: vi.fn(),
};

describe('Adapter', () => {
  let component: Adapter;
  let fixture: ComponentFixture<Adapter>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Adapter],
      providers: [{ provide: CvService, useValue: cvService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Adapter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses clear Spanish labels for the main application flow', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Tu CV y la oferta');
    expect(text).toContain('Tu CV para esta oferta');
    expect(text).not.toContain('OUTPUT ATS');
    expect(text).not.toContain('INPUT');
  });

  it('lets the user correct a generated field in the preview', () => {
    component.adaptedCv.set(adaptedCvFixture);
    component.isEditing.set(true);
    fixture.detectChanges();

    const nameField = fixture.nativeElement.querySelector(
      '[aria-label="Nombre completo"]',
    ) as HTMLElement;
    expect(nameField.getAttribute('contenteditable')).toBe('true');

    nameField.textContent = 'Alex Corregido';
    nameField.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(component.adaptedCv()?.personalInfo.fullName).toBe('Alex Corregido');

    const categoryField = fixture.nativeElement.querySelector(
      '[aria-label="Categoría de habilidades"]',
    ) as HTMLElement;
    categoryField.textContent = 'Economía y finanzas';
    categoryField.dispatchEvent(new FocusEvent('blur'));

    expect(component.adaptedCv()?.keySkills[0].category).toBe('Economía y finanzas');
  });

  it('keeps edited skill lists and project types in the CV contract', () => {
    component.adaptedCv.set(adaptedCvFixture);

    component.onCvFieldChange({
      path: 'keySkills.0.skills',
      value: 'Presupuestos, Análisis económico',
    });
    component.updateProjectType(0, 'Personal');

    expect(component.adaptedCv()?.keySkills[0].skills).toEqual([
      'Presupuestos',
      'Análisis económico',
    ]);
    expect(component.adaptedCv()?.academicAndPersonalProjects[0].type).toBe('Personal');

    component.updateProjectType(0, 'No válido');
    expect(component.adaptedCv()?.academicAndPersonalProjects[0].type).toBe('Personal');
  });

  it('clears a stale adaptation when the offer changes', () => {
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    component.selectedFile.set(file);
    component.adaptedCv.set(adaptedCvFixture);

    component.onJobDescriptionChange('Nueva oferta para analista de economía');

    expect(component.adaptedCv()).toBeNull();
    expect(component.selectedFile()).toBe(file);
    expect(component.infoMessage()).toContain('Adaptá el CV nuevamente');
  });

  it('keeps the inputs and removes the old result when adaptation fails', () => {
    const request = new Subject<ApiResponse<AdaptedCv>>();
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    const description = 'Oferta válida con más de veinte caracteres';
    cvService.adaptCv.mockReturnValue(request);
    component.selectedFile.set(file);
    component.jobDescription.set(description);
    component.adaptedCv.set(adaptedCvFixture);

    component.generateAdaptedCv();
    expect(component.adaptedCv()).toBeNull();
    expect(component.isAdapting()).toBe(true);

    request.error({ error: { msg: 'El servicio de IA no está disponible.' } });

    expect(component.isAdapting()).toBe(false);
    expect(component.errorMessage()).toBe('El servicio de IA no está disponible.');
    expect(component.selectedFile()).toBe(file);
    expect(component.jobDescription()).toBe(description);
  });

  it('does not show an adaptation for inputs changed while the request was running', () => {
    const request = new Subject<ApiResponse<AdaptedCv>>();
    component.selectedFile.set(new File(['cv'], 'cv.pdf', { type: 'application/pdf' }));
    component.jobDescription.set('Oferta válida con más de veinte caracteres');
    cvService.adaptCv.mockReturnValue(request);

    component.generateAdaptedCv();
    component.onJobDescriptionChange('Una oferta diferente que también es válida');
    request.next({ status: '1', msg: 'OK', data: adaptedCvFixture });

    expect(component.adaptedCv()).toBeNull();
    expect(component.infoMessage()).toContain('Adaptá el CV nuevamente');
  });

  it('switches to the proactive mode without removing the offer flow labels', () => {
    component.setMode('proactive');
    component.selectSector('multinacionales');
    fixture.detectChanges();
    let text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Tu CV para una empresa');
    expect(text).toContain('1 · Rubro de la organización');
    expect(text).toContain('Coca-Cola');
    expect(text).toContain('Mercado Libre');
    expect(text).not.toContain('Tu CV y la oferta');

    component.setMode('offer');
    fixture.detectChanges();
    text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Tu CV y la oferta');
    expect(text).not.toContain('1 · Rubro de la organización');
  });

  it('sends the chosen sector and organization to the proactive endpoint', () => {
    const request = new Subject<ApiResponse<ProactiveResult>>();
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });
    const sector = component.proactiveSectors.find((item) => item.id === 'multinacionales');
    const organization = sector?.organizations.find((item) => item.name === 'Coca-Cola Argentina');

    expect(organization).toBeDefined();

    cvService.proactiveCv.mockReturnValue(request);
    component.setMode('proactive');
    component.selectedFile.set(file);
    component.selectSector('multinacionales');
    component.selectOrganization(organization!);
    component.onDesiredRoleChange('Analista financiero');
    component.onProactiveNoteChange('Me interesa el área de finanzas.');

    component.generateAdaptedCv();

    expect(cvService.proactiveCv).toHaveBeenCalledTimes(1);
    const [sentFile, context] = cvService.proactiveCv.mock.calls[0];
    expect(sentFile).toBe(file);
    expect(context.sector).toBe(sector!.label);
    expect(context.organization).toBe('Coca-Cola Argentina');
    expect(context.organizationKind).toBe('Multinacional');
    expect(context.desiredRole).toBe('Analista financiero');
    expect(context.note).toBe('Me interesa el área de finanzas.');

    request.next({
      status: '1',
      msg: 'OK',
      data: { cv: adaptedCvFixture, note: 'Estimado equipo de Coca-Cola Argentina' }
    });
    fixture.detectChanges();

    expect(component.coverNote()).toBe('Estimado equipo de Coca-Cola Argentina');
    expect(fixture.nativeElement.textContent as string).toContain('Nota para acompañar tu CV');
  });

  it('does not call the proactive endpoint when the destination is missing', () => {
    component.setMode('proactive');
    component.selectedFile.set(new File(['cv'], 'cv.pdf', { type: 'application/pdf' }));
    component.selectSector('economia');

    component.generateAdaptedCv();

    expect(cvService.proactiveCv).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Elegí una empresa u organismo');
  });
});
