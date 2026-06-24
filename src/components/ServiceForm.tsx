/**
 * ServiceForm component — modal dialog for adding or editing a service.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  TextInput,
  TextArea,
  Radio,
  InputGroup,
  InputGroupItem,
  Select,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import type { ServiceEntry, ServiceFormData, HttpsMode, ValidationErrors } from '../lib/types';
import { validateServiceForm } from '../lib/validators';
import { resolveServiceUrl, isRelativePort } from '../lib/url';
import { _ } from '../lib/i18n';

export interface ServiceFormProps {
  service?: ServiceEntry;
  onSave: (data: ServiceFormData) => Promise<void>;
  onClose: () => void;
}

const EMPTY_FORM: ServiceFormData = {
  name: '',
  url: '',
  iconType: 'auto',
  iconUrl: '',
  description: '',
  httpsMode: 'follow',
};

const HTTPS_OPTIONS: { value: HttpsMode; label: string }[] = [
  { value: 'follow', label: 'Follow Cockpit' },
  { value: 'https', label: 'Force HTTPS' },
  { value: 'http', label: 'Force HTTP' },
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <FormHelperText style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>{msg}</FormHelperText>;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSave, onClose }) => {
  const isEditing = !!service;

  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ValidationErrors>(null);
  const [saving, setSaving] = useState(false);
  const [httpsOpen, setHttpsOpen] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        url: service.url,
        iconType: service.iconType,
        iconUrl: service.iconUrl || '',
        description: service.description,
        httpsMode: service.httpsMode || 'follow',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors(null);
  }, [service]);

  const updateField = useCallback(
    <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors && errors[field]) {
        setErrors((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          delete next[field];
          return Object.keys(next).length > 0 ? next : null;
        });
      }
    },
    [errors]
  );

  const urlPreview = formData.url.trim() ? resolveServiceUrl(formData.url, formData.httpsMode) : '';
  const showPreview = formData.url.trim() && isRelativePort(formData.url);

  const handleSave = async () => {
    const validationErrors = validateServiceForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (_) {
      // Error handled by useServices
    } finally {
      setSaving(false);
    }
  };

  const canSave = !saving;

  return (
    <Modal
      variant="medium"
      title={isEditing ? _('Edit Service') : _('Add Service')}
      isOpen={true}
      onClose={onClose}
      actions={[
        <Button key="save" variant="primary" onClick={handleSave} isDisabled={!canSave} isLoading={saving}>{_('Save')}</Button>,
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={saving}>{_('Cancel')}</Button>,
      ]}
      aria-label={isEditing ? _('Edit service form') : _('Add service form')}
    >
      <Form>
        {/* Name */}
        <FormGroup label={_('Name')} isRequired fieldId="service-name">
          <TextInput id="service-name" value={formData.name}
            onChange={(_ev, value) => updateField('name', value)}
            placeholder={_('e.g., Portainer, Grafana, Wiki')}
            validated={errors?.name ? 'error' : 'default'} maxLength={100} />
          <FieldError msg={errors?.name} />
        </FormGroup>

        {/* URL / Port */}
        <FormGroup label={_('URL or Port')} isRequired fieldId="service-url">
          <InputGroup>
            <InputGroupItem isFill>
              <TextInput id="service-url" value={formData.url}
                onChange={(_ev, value) => updateField('url', value)}
                placeholder={_('https://example.com:3000 or just 8080')}
                validated={errors?.url ? 'error' : 'default'} maxLength={2048} />
            </InputGroupItem>
          </InputGroup>
          <FormHelperText>
            {_('Enter a full URL (https://...) or just a port number (e.g., 8080). Relative ports use the current Cockpit host and protocol.')}
          </FormHelperText>
          <FieldError msg={errors?.url} />
          {showPreview && (
            <div className="servicenav-form__url-preview">
              {_('Resolved URL')}: <strong>{urlPreview}</strong>
            </div>
          )}
        </FormGroup>

        {/* HTTPS Mode (per-service) */}
        <FormGroup label={_('HTTPS Mode')} fieldId="https-mode">
          <Select
            isOpen={httpsOpen}
            selected={formData.httpsMode}
            onSelect={(_ev: any, val: any) => { updateField('httpsMode', val as HttpsMode); setHttpsOpen(false); }}
            onOpenChange={setHttpsOpen}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle ref={toggleRef} onClick={() => setHttpsOpen(!httpsOpen)} isExpanded={httpsOpen}>
                {_(HTTPS_OPTIONS.find((o) => o.value === formData.httpsMode)?.label || 'Follow Cockpit')}
              </MenuToggle>
            )}
          >
            {HTTPS_OPTIONS.map((opt) => (
              <SelectOption key={opt.value} value={opt.value}>{_(opt.label)}</SelectOption>
            ))}
          </Select>
          <FormHelperText>
            {_('Protocol for relative-port services. Absolute URLs are not affected.')}
          </FormHelperText>
        </FormGroup>

        {/* Icon */}
        <FormGroup label={_('Icon')} fieldId="icon-type" role="radiogroup">
          <Radio id="icon-auto" name="iconType"
            label={_('Auto-fetch favicon from service')}
            isChecked={formData.iconType === 'auto'}
            onChange={() => updateField('iconType', 'auto')}
            description={_('Try to load /favicon.ico from the service URL automatically.')} />
          <Radio id="icon-url" name="iconType"
            label={_('Custom icon URL')}
            isChecked={formData.iconType === 'url'}
            onChange={() => updateField('iconType', 'url')}
            description={_('Use a custom icon from any HTTP/HTTPS URL.')} />
          <Radio id="icon-none" name="iconType"
            label={_('Default icon')}
            isChecked={formData.iconType === 'none'}
            onChange={() => updateField('iconType', 'none')}
            description={_('Use the default cube icon.')} />
        </FormGroup>

        {/* Custom Icon URL */}
        {formData.iconType === 'url' && (
          <FormGroup label={_('Icon URL')} isRequired fieldId="icon-url-input">
            <TextInput id="icon-url-input" value={formData.iconUrl}
              onChange={(_ev, value) => updateField('iconUrl', value)}
              placeholder="https://example.com/icon.png"
              validated={errors?.iconUrl ? 'error' : 'default'} maxLength={2048} />
            <FieldError msg={errors?.iconUrl} />
          </FormGroup>
        )}

        {/* Description */}
        <FormGroup label={_('Description')} fieldId="service-description">
          <TextArea id="service-description" value={formData.description}
            onChange={(_ev, value) => updateField('description', value)}
            placeholder={_('Optional brief description of this service')}
            validated={errors?.description ? 'error' : 'default'} maxLength={500} rows={3} />
          <FormHelperText>{formData.description.length}/500</FormHelperText>
          <FieldError msg={errors?.description} />
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default ServiceForm;
