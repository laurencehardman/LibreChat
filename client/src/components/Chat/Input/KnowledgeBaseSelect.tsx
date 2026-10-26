// client/src/components/Chat/Input/KnowledgeBaseSelect.tsx

import React, { memo } from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronDown } from 'lucide-react';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { TooltipAnchor, VectorIcon } from '@librechat/client';
import { useHasAccess, useLocalize } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';
import KnowledgeBaseMenuList from '~/components/Chat/Input/KnowledgeBaseMenuList';
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
                ? 'border border-green-600/40 bg-green-500/10 text-sm font-medium transition-all'
                : 'border border-border-medium bg-transparent text-sm font-medium transition-all',
              'h-9 min-w-9 rounded-full px-2.5 shadow-sm',
              'hover:bg-green-700/10 hover:shadow-md active:shadow-inner',
              'md:w-fit md:justify-start md:px-3',
              isOpen && (hasProject ? 'bg-green-700/10' : 'bg-surface-hover'),
            )}
          />
        }
      >
        <VectorIcon
          className={cn(
            'size-3.5',
            hasProject ? 'text-green-600 dark:text-green-400' : 'text-text-secondary',
          )}
        />
        <span className="hidden truncate text-text-primary md:block">{displayText}</span>
        <ChevronDown
          className={cn(
            'hidden h-3 w-3 text-text-secondary transition-transform md:block',
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
          'z-50 flex min-w-[260px] max-w-[320px] flex-col rounded-xl',
          'border border-border-light bg-presentation p-1.5 shadow-lg',
          'origin-top opacity-0 transition-[opacity,transform] duration-200 ease-out',
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
