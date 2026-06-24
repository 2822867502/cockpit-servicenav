/**
 * Type definitions for the servicenav Cockpit plugin.
 *
 * These types define the shape of the configuration file and all UI state.
 */

/** Valid icon source types */
export type IconType = 'auto' | 'url' | 'none';

/** Valid view modes for the service display */
export type ViewMode = 'grid' | 'list';

/** A single service entry in the configuration */
export interface ServiceEntry {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Human-readable service name (1-100 chars) */
  name: string;

  /**
   * Service URL or port.
   * - Full absolute URL: "https://grafana.example.com:3000"
   * - Relative port: "8080" (uses current Cockpit host/protocol)
   * - Relative port with path: "9090/admin"
   */
  url: string;

  /** Icon source mode */
  iconType: IconType;

  /** Custom icon URL (only used when iconType === 'url') */
  iconUrl: string | null;

  /** Optional description text (max 500 chars) */
  description: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last modification */
  updatedAt: string;
}

/** Form data used in the Add/Edit service modal (excludes auto-generated fields) */
export interface ServiceFormData {
  name: string;
  url: string;
  iconType: IconType;
  iconUrl: string;
  description: string;
}

/** Root configuration file schema */
export interface ServicenavConfig {
  /** Schema version for forward compatibility */
  version: number;

  /** UI preference: view mode */
  viewMode: ViewMode;

  /** Array of configured services */
  services: ServiceEntry[];
}

/** Validation error map: field name -> error message */
export type ValidationErrors = Partial<Record<keyof ServiceFormData, string>>;

/** Result of form validation: null = valid, object = errors */
export type ValidationResult = ValidationErrors | null;
