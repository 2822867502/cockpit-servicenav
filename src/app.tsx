/**
 * App component — root orchestrator for the servicenav plugin.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Page, PageSection, PageSectionVariants,
  Title, Button, Flex, FlexItem,
  Alert, AlertActionCloseButton, Spinner, Bullseye,
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

interface ModalState {
  type: 'add' | 'edit' | null;
  service?: ServiceEntry;
}

const App: React.FC = () => {
  const { services, loading, error, viewMode, addService, updateService, removeService, setViewMode, clearError } = useServices();

  const [modal, setModal] = useState<ModalState>({ type: null });
  const [deleteTarget, setDeleteTarget] = useState<ServiceEntry | null>(null);

  // ---- Theme sync: apply parent Cockpit theme before first paint ----
  useEffect(() => {
    const sync = () => {
      try {
        const p = window.parent.document.documentElement.classList;
        document.documentElement.classList.toggle('pf-theme-dark', p.contains('pf-theme-dark'));
      } catch (_) { /* cross-origin */ }
    };
    sync();
    let obs: MutationObserver | null = null;
    try {
      obs = new MutationObserver(sync);
      obs.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (_) { /* cross-origin */ }
    return () => obs?.disconnect();
  }, []);

  const safeServices = Array.isArray(services) ? services : [];

  const openAddModal = useCallback(() => setModal({ type: 'add' }), []);
  const closeModal = useCallback(() => setModal({ type: null }), []);
  const openEditModal = useCallback((id: string) => {
    const svc = safeServices.find((s) => s.id === id);
    if (svc) setModal({ type: 'edit', service: svc });
  }, [safeServices]);
  const requestDelete = useCallback((id: string) => {
    const svc = safeServices.find((s) => s.id === id);
    if (svc) setDeleteTarget(svc);
  }, [safeServices]);
  const confirmDelete = useCallback(async () => {
    if (deleteTarget) {
      try { await removeService(deleteTarget.id); } catch { /* handled */ }
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeService]);
  const handleSave = useCallback(async (data: ServiceFormData) => {
    try {
      if (modal.type === 'add') await addService(data);
      else if (modal.type === 'edit' && modal.service) await updateService(modal.service.id, data);
    } catch { /* handled */ }
  }, [modal, addService, updateService]);

  if (loading) {
    return <Page><PageSection><Bullseye><Spinner aria-label={_('Loading services')} /></Bullseye></PageSection></Page>;
  }

  return (
    <Page className="servicenav-page">
      <PageSection variant={PageSectionVariants.light}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} flexWrap={{ default: 'wrap' }}>
          <FlexItem><Title headingLevel="h1">{_('Service Navigation')}</Title></FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              <Button variant="primary" onClick={openAddModal} icon={<PlusCircleIcon />}>{_('Add Service')}</Button>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {error && (
        <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
          <Alert variant="danger" isInline title={_('Error')} actionClose={<AlertActionCloseButton onClose={clearError} />}>{error}</Alert>
        </PageSection>
      )}

      <PageSection>
        {safeServices.length === 0 ? (
          <EmptyState onAddService={openAddModal} />
        ) : viewMode === 'grid' ? (
          <ServiceGrid services={safeServices} onEdit={openEditModal} onDelete={requestDelete} />
        ) : (
          <ServiceList services={safeServices} onEdit={openEditModal} onDelete={requestDelete} />
        )}
      </PageSection>

      {modal.type !== null && <ServiceForm service={modal.service} onSave={handleSave} onClose={closeModal} />}
      {deleteTarget && <DeleteConfirmDialog service={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
    </Page>
  );
};

export default App;
