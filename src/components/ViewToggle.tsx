/**
 * ViewToggle component — toggles between grid and list layout views.
 *
 * Uses PatternFly's ToggleGroup for a clean, accessible toggle UI.
 * The active view mode is communicated through the pressed state of each button.
 */

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { ThIcon, ListIcon } from '@patternfly/react-icons';
import { _ } from '../lib/i18n';

export interface ViewToggleProps {
  /** Current active view mode */
  viewMode: 'grid' | 'list';
  /** Called when the user switches view mode */
  onChange: (mode: 'grid' | 'list') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange }) => {
  const handleChange = (_event: React.MouseEvent<any> | React.KeyboardEvent | any, selected: boolean) => {
    // ToggleGroupItem passes the event; we determine based on which item was clicked
    // The PF ToggleGroup manages the state internally but we control it via props
  };

  return (
    <div className="servicenav-view-toggle">
      <ToggleGroup aria-label={_('View mode toggle')}>
        <ToggleGroupItem
          text={_('Grid')}
          icon={<ThIcon />}
          buttonId="view-grid"
          isSelected={viewMode === 'grid'}
          onChange={() => viewMode !== 'grid' && onChange('grid')}
          aria-label={_('Grid view')}
        />
        <ToggleGroupItem
          text={_('List')}
          icon={<ListIcon />}
          buttonId="view-list"
          isSelected={viewMode === 'list'}
          onChange={() => viewMode !== 'list' && onChange('list')}
          aria-label={_('List view')}
        />
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;
