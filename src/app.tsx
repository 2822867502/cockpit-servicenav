/**
 * App component — root orchestrator for the servicenav plugin.
 *
 * Responsibilities:
 * - Wire useServices hook to all child components
 * - Manage modal open/close state (add, edit, delete)
 * - Handle service CRUD operations
 * - Render appropriate view based on state (loading, error, empty, populated)
 */

import React, { useState, useCallback } from 'react';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Flex,
  FlexItem,
  Alert,
  AlertActionCloseButton,
  Spinner,
  Bullseye,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useServices } from './hooks/useServices';
import { ServiceGrid } from './components/ServiceGrid';
import { ServiceList } from './components/ServiceList';
import { ServiceForm } from './components/ServiceForm';
import { ViewToggle } from './components/ViewToggle';
import { EmptyState } from './components/EmptyState';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import type { ServiceEntry, ServiceFormData } from './lib/types';
import { _ } from './lib/i18n';

/** Modal state: which modal is open and with what data */
interface ModalState {
  type: 'add' | 'edit' | null;
  service?: ServiceEntry;
}

const App: React.FC = () => {
  const {
    services,
    loading,
    error,
    viewMode,
    addService,
    updateService,
    removeService,
    setViewMode,
    clearError,
  } = useServices();

  const [modal, setModal] = useState<ModalState>({ type: null });
  const [deleteTarget, setDeleteTarget] = useState<ServiceEntry | null>(null);

  // --- Modal handlers ---
  const openAddModal = useCallback(() => {
    setModal({ type: 'add' });
  }, []);

  const openEditModal = useCallback((id: string) => {
    const service = services.find((s) => s.id === id);
    if (service) {
      setModal({ type: 'edit', service });
    }
  }, [services]);

  const closeModal = useCallback(() => {
    setModal({ type: null });
  }, []);

  // --- Delete handlers ---
  const requestDelete = useCallback((id: string) => {
    const service = services.find((s) => s.id === id);
    if (service) {
      setDeleteTarget(service);
    }
  }, [services]);

  const confirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await removeService(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeService]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // --- Save handler ---
  const handleSave = useCallback(
    async (data: ServiceFormData) => {
      if (modal.type === 'add') {
        await addService(data);
      } else if (modal.type === 'edit' && modal.service) {
        await updateService(modal.service.id, data);
      }
    },
    [modal, addService, updateService]
  );

  // --- Loading state ---
  if (loading) {
    return (
      <Page>
        <PageSection>
          <Bullseye>
            <Spinner aria-label={_('Loading services')} />
          </Bullseye>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page className="servicenav-page">
      {/* Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          flexWrap={{ default: 'wrap' }}
        >
          <FlexItem>
            <Title headingLevel="h1">{_('Service Navigation')}</Title>
          </FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              <Button variant="primary" onClick={openAddModal} icon={<PlusCircleIcon />}>
                {_('Add Service')}
              </Button>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Error alert */}
      {error && (
        <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
          <Alert
            variant="danger"
            isInline
            title={_('Error')}
            actionClose={<AlertActionCloseButton onClose={clearError} />}
          >
            {error}
          </Alert>
        </PageSection>
      )}

      {/* Content */}
      <PageSection>
        {services.length === 0 ? (
          <EmptyState onAddService={openAddModal} />
        ) : viewMode === 'grid' ? (
          <ServiceGrid
            services={services}
            onEdit={openEditModal}
            onDelete={requestDelete}
          />
        ) : (
          <ServiceList
            services={services}
            onEdit={openEditModal}
            onDelete={requestDelete}
          />
        )}
      </PageSection>

      {/* Add/Edit Modal */}
      {modal.type !== null && (
        <ServiceForm
          service={modal.service}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          service={deleteTarget}
          onConfirm={confirmDelete}
          onClose={cancelDelete}
        />
      )}
    </Page>
  );
};

export default App;
