import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CvService } from './cv.service';

describe('CvService', () => {
  let service: CvService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CvService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts the proactive context as multipart data to /api/cv/proactive', () => {
    const file = new File(['cv'], 'cv.pdf', { type: 'application/pdf' });

    service
      .proactiveCv(file, {
        sector: 'Multinacionales en Argentina',
        organization: 'Coca-Cola Argentina',
        organizationKind: 'Multinacional',
        desiredRole: 'Analista financiero',
        note: 'Me interesa el área de finanzas.',
      })
      .subscribe();

    const request = httpMock.expectOne('/api/cv/proactive');
    expect(request.request.method).toBe('POST');

    const body = request.request.body as FormData;
    expect(body.get('cvFile')).toBe(file);
    expect(body.get('sector')).toBe('Multinacionales en Argentina');
    expect(body.get('organization')).toBe('Coca-Cola Argentina');
    expect(body.get('organizationKind')).toBe('Multinacional');
    expect(body.get('desiredRole')).toBe('Analista financiero');
    expect(body.get('note')).toBe('Me interesa el área de finanzas.');

    request.flush({ status: '1', msg: 'OK' });
  });
});
