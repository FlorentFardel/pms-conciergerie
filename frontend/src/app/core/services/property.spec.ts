import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
}

export interface CreatePropertyDto {
  name: string;
  address: string;
  city: string;
  postal_code: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/properties';

  properties = signal<Property[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async loadProperties(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<Property[]>(this.apiUrl));
      this.properties.set(data);
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement des propriétés');
    } finally {
      this.loading.set(false);
    }
  }

  async createProperty(property: CreatePropertyDto): Promise<Property> {
    this.loading.set(true);
    try {
      const newProperty = await firstValueFrom(
        this.http.post<Property>(this.apiUrl, property)
      );
      this.properties.update(list => [newProperty, ...list]);
      return newProperty;
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors de la création');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProperty(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
      this.properties.update(list => list.filter(p => p.id !== id));
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors de la suppression');
      throw err;
    }
  }
}