// client/src/components/Chat/Input/KnowledgeBaseSelect.tsx

import React, { memo } from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronDown, Database } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import KnowledgeBaseMenuList from '~/components/Chat/Input/KnowledgeBaseMenuList';
import { useHasAccess, useLocalize } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';
import { cn } from '~/utils';

function KnowledgeBaseSelectContent() {
  const localize = useLocalize();
  const context = useBadgeRowContext();
  const manager = context?.knowledgeBaseManager;

  const menuStore = Ariakit.useMenuStore({ focusLoop: true });
  const isOpen = menuStore.useState('open');

  if (!manager) {
    return null;
  }

  const { selectedProjects, selectableProjects, isGlobalSelected, placeholderText } = manager;

  const count = selectedProjects.length;
  const total = selectableProjects.length;
  let displayText = placeholderText;
  if (count > 0) {
    displayText = isGlobalSelected
      ? localize('com_ui_all_projects')
      : `${placeholderText} (${count}/${total})`;
  }
  const hasProject = count > 0;

  return (
    <Ariakit.MenuProvider store={menuStore}>
      <TooltipAnchor
        description={placeholderText}
        disabled={isOpen}
        render={
          <Ariakit.MenuButton
            className={cn(
              'group relative inline-flex items-center justify-center gap-1.5',
              hasProject
                ? 'border-status-success-border bg-status-success-strong/10 border text-sm font-medium transition-all'
                : 'border-border-medium border bg-transparent text-sm font-medium transition-all',
              'h-9 min-w-9 rounded-full px-2.5 shadow-sm',
              'hover:bg-status-success-strong/10 hover:shadow-md active:shadow-inner',
              'md:w-fit md:justify-start md:px-3',
              isOpen && (hasProject ? 'bg-status-success-strong/10' : 'bg-surface-hover'),
            )}
          />
        }
      >
        <Database
          aria-hidden="true"
          className={cn('size-3.5', hasProject ? 'text-status-success' : 'text-text-secondary')}
        />
        <span className="text-text-primary hidden truncate md:block">{displayText}</span>
        <ChevronDown
          className={cn(
            'text-text-secondary hidden h-3 w-3 transition-transform md:block',
            isOpen && 'rotate-180',
          )}
        />
      </TooltipAnchor>

      <Ariakit.Menu
        portal={true}
        gutter={8}
        modal={true}
        unmountOnHide={true}
        aria-label={placeholderText}
        className={cn(
          'rounded-theme-menu-panel z-50 flex max-w-[320px] min-w-[260px] flex-col',
          'border-border-light bg-presentation border p-1.5 shadow-lg',
          'origin-top opacity-0 transition duration-200 ease-out',
          'data-[enter]:scale-100 data-[enter]:opacity-100',
          'scale-95 data-[leave]:scale-95 data-[leave]:opacity-0',
        )}
      >
        <KnowledgeBaseMenuList manager={manager} />
      </Ariakit.Menu>
    </Ariakit.MenuProvider>
  );
}

function KnowledgeBaseSelect() {
  const context = useBadgeRowContext();
  const { selectableProjects } = context?.knowledgeBaseManager ?? {};

  const canUse = useHasAccess({
    permissionType: PermissionTypes.FILE_SEARCH,
    permission: Permissions.USE,
  });

  if (!canUse || !selectableProjects || selectableProjects.length === 0) {
    return null;
  }

  return <KnowledgeBaseSelectContent />;
}

export default memo(KnowledgeBaseSelect);
