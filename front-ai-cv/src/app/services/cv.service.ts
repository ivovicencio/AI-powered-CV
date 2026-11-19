import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdaptedCv, ApiResponse, ProactiveContext, ProactiveResult } from '../interfaces/cv.interface';

@Injectable({
  providedIn: 'root'
})
export class CvService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  extractJobDescription(url: string): Observable<ApiResponse<{ description: string }>> {
    return this.http.post<ApiResponse<{ description: string }>>(`${this.apiUrl}/job/extract`, { url });
  }

  adaptCv(cvFile: File, jobDescription: string): Observable<ApiResponse<AdaptedCv>> {
    const formData = new FormData();
    formData.append('cvFile', cvFile);
    formData.append('jobDescription', jobDescription);

    return this.http.post<ApiResponse<AdaptedCv>>(`${this.apiUrl}/cv/adapt`, formData);
  }

  proactiveCv(cvFile: File, context: ProactiveContext): Observable<ApiResponse<ProactiveResult>> {
    const formData = new FormData();
    formData.append('cvFile', cvFile);
    formData.append('sector', context.sector);
    formData.append('organization', context.organization);
    formData.append('organizationKind', context.organizationKind);
    formData.append('desiredRole', context.desiredRole);
    formData.append('note', context.note);

    return this.http.post<ApiResponse<ProactiveResult>>(`${this.apiUrl}/cv/proactive`, formData);
  }

  exportDocx(cvData: AdaptedCv): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/cv/export/docx`, { cvData }, { responseType: 'blob' });
  }

  exportPdf(cvData: AdaptedCv): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/cv/export/pdf`, { cvData }, { responseType: 'blob' });
  }
}
