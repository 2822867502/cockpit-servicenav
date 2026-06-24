/**
 * Type definitions for the servicenav Cockpit plugin.
 */

export type IconType = 'auto' | 'url' | 'none';
export type ViewMode = 'grid' | 'list';
export type HttpsMode = 'follow' | 'http' | 'https';

export interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  iconType: IconType;
  iconUrl: string | null;
  description: string;
  /** Per-service HTTPS mode. Defaults to 'follow' for backward compat. */
  httpsMode: HttpsMode;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  name: string;
  url: string;
  iconType: IconType;
  iconUrl: string;
  description: string;
  httpsMode: HttpsMode;
}

export interface ServicenavConfig {
  version: number;
  viewMode: ViewMode;
  services: ServiceEntry[];
}

export type ValidationErrors = Partial<Record<keyof ServiceFormData, string>>;
export type ValidationResult = ValidationErrors | null;
