import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdaptedCv, ApiResponse } from '../interfaces/cv.interface';

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

  exportDocx(cvData: AdaptedCv): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/cv/export/docx`, { cvData }, { responseType: 'blob' });
  }

  exportPdf(cvData: AdaptedCv): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/cv/export/pdf`, { cvData }, { responseType: 'blob' });
  }
}
