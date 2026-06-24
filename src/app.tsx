/**
 * App component — root orchestrator for the servicenav plugin.
 *
 * - Syncs dark-mode theme from parent Cockpit shell to the plugin iframe
 * - Manages service CRUD, view mode, and HTTPS mode settings
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Select,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useServices } from './hooks/useServices';
import { ServiceGrid } from './components/ServiceGrid';
import { ServiceList } from './components/ServiceList';
import { ServiceForm } from './components/ServiceForm';
import { ViewToggle } from './components/ViewToggle';
import { EmptyState } from './components/EmptyState';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import type { ServiceEntry, ServiceFormData, HttpsMode } from './lib/types';
import { _ } from './lib/i18n';

interface ModalState {
  type: 'add' | 'edit' | null;
  service?: ServiceEntry;
}

const HTTPS_LABELS: Record<HttpsMode, string> = {
  follow: 'HTTPS: ' + 'Follow Cockpit',
  on: 'HTTPS: ' + 'On',
  off: 'HTTPS: ' + 'Off',
};

const App: React.FC = () => {
  const {
    services,
    loading,
    error,
    viewMode,
    httpsMode,
    addService,
    updateService,
    removeService,
    setViewMode,
    setHttpsMode,
    clearError,
  } = useServices();

  const [modal, setModal] = useState<ModalState>({ type: null });
  const [deleteTarget, setDeleteTarget] = useState<ServiceEntry | null>(null);
  const [httpsOpen, setHttpsOpen] = useState(false);

  // ---- Theme sync: copy pf-theme-dark class from parent Cockpit to our iframe ----
  useEffect(() => {
    const applyTheme = () => {
      try {
        const parentHtml = window.parent.document.documentElement;
        const ourHtml = document.documentElement;
        if (parentHtml.classList.contains('pf-theme-dark')) {
          ourHtml.classList.add('pf-theme-dark');
        } else {
          ourHtml.classList.remove('pf-theme-dark');
        }
      } catch (_) { /* cross-origin — ignore */ }
    };

    applyTheme();
    // Observe parent theme changes
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(applyTheme);
      observer.observe(window.parent.document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    } catch (_) { /* cross-origin */ }

    return () => observer?.disconnect();
  }, []);

  // ---- Modal handlers ----
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

  // ---- Loading ----
  if (loading) {
    return (
      <Page><PageSection><Bullseye><Spinner aria-label={_('Loading services')} /></Bullseye></PageSection></Page>
    );
  }

  return (
    <Page className="servicenav-page">
      <PageSection variant={PageSectionVariants.light}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} flexWrap={{ default: 'wrap' }}>
          <FlexItem><Title headingLevel="h1">{_('Service Navigation')}</Title></FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              {/* HTTPS mode selector */}
              <Select
                isOpen={httpsOpen}
                selected={httpsMode}
                onSelect={(_ev: any, val: any) => { setHttpsMode(val as HttpsMode); setHttpsOpen(false); }}
                onOpenChange={setHttpsOpen}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle ref={toggleRef} onClick={() => setHttpsOpen(!httpsOpen)} isExpanded={httpsOpen}>
                    {_(HTTPS_LABELS[httpsMode])}
                  </MenuToggle>
                )}
              >
                <SelectOption value="follow">{_('Follow Cockpit')}</SelectOption>
                <SelectOption value="on">{_('Always HTTPS')}</SelectOption>
                <SelectOption value="off">{_('Always HTTP')}</SelectOption>
              </Select>

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
          <ServiceGrid services={safeServices} httpsMode={httpsMode} onEdit={openEditModal} onDelete={requestDelete} />
        ) : (
          <ServiceList services={safeServices} httpsMode={httpsMode} onEdit={openEditModal} onDelete={requestDelete} />
        )}
      </PageSection>

      {modal.type !== null && <ServiceForm service={modal.service} onSave={handleSave} onClose={closeModal} />}
      {deleteTarget && <DeleteConfirmDialog service={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
    </Page>
  );
};

export default App;
