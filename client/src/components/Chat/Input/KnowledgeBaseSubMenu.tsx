// client/src/components/Chat/Input/KnowledgeBaseSubMenu.tsx

import React from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronRight } from 'lucide-react';
import { PinIcon, VectorIcon } from '@librechat/client';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import KnowledgeBaseMenuList from '~/components/Chat/Input/KnowledgeBaseMenuList';
import { cn } from '~/utils';

interface KnowledgeBaseSubMenuProps {
  placeholder?: string;
}

const KnowledgeBaseSubMenu = React.forwardRef<HTMLDivElement, KnowledgeBaseSubMenuProps>(
  ({ placeholder, ...props }, ref) => {
    const localize = useLocalize();
    const context = useBadgeRowContext();
    const { knowledgeBaseManager } = context ?? {};

    const menuStore = Ariakit.useMenuStore({
      focusLoop: true,
      showTimeout: 100,
      placement: 'right',
    });

    if (!knowledgeBaseManager) {
      return null;
    }

    const { isPinned, setIsPinned, selectedProjects, selectableProjects, placeholderText } =
      knowledgeBaseManager;

    if (!selectableProjects || selectableProjects.length === 0) {
      return null;
    }

    const count = selectedProjects.length;
    const label =
      placeholder ||
      (count > 0 ? `${placeholderText} (${count})` : placeholderText) ||
      localize('com_assistants_knowledge_base');

    return (
      <div ref={ref}>
        <Ariakit.MenuProvider store={menuStore}>
          <Ariakit.MenuItem
            {...props}
            hideOnClick={false}
            render={
              <Ariakit.MenuButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  menuStore.toggle();
                }}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-surface-hover"
              />
            }
          >
            <div className="flex items-center gap-2">
              <VectorIcon className="h-5 w-5 flex-shrink-0 text-text-primary" aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPinned(!isPinned);
              }}
              className={cn(
                'rounded p-1 transition-all duration-200',
                'hover:bg-surface-tertiary hover:shadow-sm',
                !isPinned && 'text-text-secondary hover:text-text-primary',
              )}
              aria-label={isPinned ? localize('com_ui_unpin') : localize('com_ui_pin')}
            >
              <div className="h-4 w-4">
                <PinIcon unpin={isPinned} />
              </div>
            </button>
          </Ariakit.MenuItem>

          <Ariakit.Menu
            portal={true}
            unmountOnHide={true}
            aria-label={localize('com_assistants_knowledge_base')}
            className={cn(
              'animate-popover-left z-40 ml-3 flex min-w-[260px] max-w-[320px] flex-col rounded-xl',
              'border border-border-light bg-presentation p-1.5 shadow-lg',
            )}
          >
            <KnowledgeBaseMenuList manager={knowledgeBaseManager} />
          </Ariakit.Menu>
        </Ariakit.MenuProvider>
      </div>
    );
  },
);

KnowledgeBaseSubMenu.displayName = 'KnowledgeBaseSubMenu';

export default React.memo(KnowledgeBaseSubMenu);
