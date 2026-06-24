/**
 * ServiceForm component — modal dialog for adding or editing a service.
 *
 * Handles both add (empty form) and edit (pre-populated form) modes.
 * Provides live URL preview for relative port entries.
 * Validates all fields before allowing save.
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
} from '@patternfly/react-core';
import type { ServiceEntry, ServiceFormData, IconType, ValidationErrors } from '../lib/types';
import { validateServiceForm } from '../lib/validators';
import { resolveServiceUrl, isRelativePort } from '../lib/url';
import { _ } from '../lib/i18n';

export interface ServiceFormProps {
  /** Existing service for edit mode; undefined for add mode */
  service?: ServiceEntry;
  /** Called when user saves the form */
  onSave: (data: ServiceFormData) => Promise<void>;
  /** Called when user cancels or closes the modal */
  onClose: () => void;
}

/** Empty form data for add mode */
const EMPTY_FORM: ServiceFormData = {
  name: '',
  url: '',
  iconType: 'auto',
  iconUrl: '',
  description: '',
};

export const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSave, onClose }) => {
  const isEditing = !!service;

  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ValidationErrors>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form from existing service (edit mode)
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        url: service.url,
        iconType: service.iconType,
        iconUrl: service.iconUrl || '',
        description: service.description,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors(null);
  }, [service]);

  // Update a single field
  const updateField = useCallback(
    <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user types
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

  // Live URL preview
  const urlPreview = formData.url.trim()
    ? resolveServiceUrl(formData.url)
    : '';

  const showPreview = formData.url.trim() && isRelativePort(formData.url);

  // Handle save
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
    } catch (err) {
      // Error handling is done by the parent (useServices)
      // Keep modal open so user can retry
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
        <Button
          key="save"
          variant="primary"
          onClick={handleSave}
          isDisabled={!canSave}
          isLoading={saving}
        >
          {_('Save')}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={saving}>
          {_('Cancel')}
        </Button>,
      ]}
      aria-label={isEditing ? _('Edit service form') : _('Add service form')}
    >
      <Form>
        {/* Service Name */}
        <FormGroup
          label={_('Name')}
          isRequired
          fieldId="service-name"
          validated={errors?.name ? 'error' : 'default'}
          helperTextInvalid={errors?.name}
        >
          <TextInput
            id="service-name"
            value={formData.name}
            onChange={(_ev, value) => updateField('name', value)}
            placeholder={_('e.g., Portainer, Grafana, Wiki')}
            validated={errors?.name ? 'error' : 'default'}
            maxLength={100}
          />
        </FormGroup>

        {/* Service URL/Port */}
        <FormGroup
          label={_('URL or Port')}
          isRequired
          fieldId="service-url"
          validated={errors?.url ? 'error' : 'default'}
          helperTextInvalid={errors?.url}
        >
          <InputGroup>
            <InputGroupItem isFill>
              <TextInput
                id="service-url"
                value={formData.url}
                onChange={(_ev, value) => updateField('url', value)}
                placeholder={_('https://example.com:3000 or just 8080')}
                validated={errors?.url ? 'error' : 'default'}
                maxLength={2048}
              />
            </InputGroupItem>
          </InputGroup>
          <FormHelperText>
            {_('Enter a full URL (https://...) or just a port number (e.g., 8080). Relative ports use the current Cockpit host and protocol.')}
          </FormHelperText>
          {showPreview && (
            <div className="servicenav-form__url-preview">
              {_('Resolved URL')}: <strong>{urlPreview}</strong>
            </div>
          )}
        </FormGroup>

        {/* Icon Type */}
        <FormGroup label={_('Icon')} fieldId="icon-type" role="radiogroup">
          <Radio
            id="icon-auto"
            name="iconType"
            label={_('Auto-fetch favicon from service')}
            isChecked={formData.iconType === 'auto'}
            onChange={() => updateField('iconType', 'auto')}
            description={_('Try to load /favicon.ico from the service URL automatically.')}
          />
          <Radio
            id="icon-url"
            name="iconType"
            label={_('Custom icon URL')}
            isChecked={formData.iconType === 'url'}
            onChange={() => updateField('iconType', 'url')}
            description={_('Use a custom icon from any HTTP/HTTPS URL.')}
          />
          <Radio
            id="icon-none"
            name="iconType"
            label={_('Default icon')}
            isChecked={formData.iconType === 'none'}
            onChange={() => updateField('iconType', 'none')}
            description={_('Use the default cube icon.')}
          />
        </FormGroup>

        {/* Custom Icon URL (only when type is 'url') */}
        {formData.iconType === 'url' && (
          <FormGroup
            label={_('Icon URL')}
            isRequired
            fieldId="icon-url-input"
            validated={errors?.iconUrl ? 'error' : 'default'}
            helperTextInvalid={errors?.iconUrl}
          >
            <TextInput
              id="icon-url-input"
              value={formData.iconUrl}
              onChange={(_ev, value) => updateField('iconUrl', value)}
              placeholder="https://example.com/icon.png"
              validated={errors?.iconUrl ? 'error' : 'default'}
              maxLength={2048}
            />
          </FormGroup>
        )}

        {/* Description */}
        <FormGroup
          label={_('Description')}
          fieldId="service-description"
          validated={errors?.description ? 'error' : 'default'}
          helperTextInvalid={errors?.description}
        >
          <TextArea
            id="service-description"
            value={formData.description}
            onChange={(_ev, value) => updateField('description', value)}
            placeholder={_('Optional brief description of this service')}
            validated={errors?.description ? 'error' : 'default'}
            maxLength={500}
            rows={3}
          />
          <FormHelperText>
            {formData.description.length}/500
          </FormHelperText>
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default ServiceForm;
