// client/src/components/Chat/Input/KnowledgeBaseSubMenu.tsx

import React from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronRight, Database, Check } from 'lucide-react';
import { PinIcon } from '@librechat/client';
import { useBadgeRowContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface KnowledgeBaseProject {
    name: string;
    displayName?: string;
    description?: string;
}

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

        const {
            isPinned,
            setIsPinned,
            selectedProjects,
            selectableProjects,
            toggleProject,
            placeholderText,
        } = knowledgeBaseManager;

        if (!selectableProjects || selectableProjects.length === 0) {
            return null;
        }

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
                            <Database className="h-5 w-5 flex-shrink-0 text-text-primary" aria-hidden="true" />
                            <span>{placeholder || placeholderText || localize('com_assistants_knowledge_base')}</span>
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
                        <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
                            {selectableProjects.map((project) => (
                                <KnowledgeBaseProjectMenuItem
                                    key={project.name}
                                    project={project}
                                    isSelected={selectedProjects?.includes(project.name) ?? false}
                                    onToggle={() => toggleProject(project.name)}
                                />
                            ))}
                        </div>
                    </Ariakit.Menu>
                </Ariakit.MenuProvider>
            </div>
        );
    },
);

KnowledgeBaseSubMenu.displayName = 'KnowledgeBaseSubMenu';

/* ------------------------------------------------------------------ */
/*  Inline item — you can extract this to its own file if preferred   */
/* ------------------------------------------------------------------ */

function KnowledgeBaseProjectMenuItem({
                                          project,
                                          isSelected,
                                          onToggle,
                                      }: {
    project: KnowledgeBaseProject;
    isSelected: boolean;
    onToggle: () => void;
}) {
    return (
        <Ariakit.MenuItem
            hideOnClick={false}
            onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onToggle();
            }}
            className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                'hover:bg-surface-hover transition-colors',
                isSelected && 'bg-green-50 dark:bg-green-950',
            )}
        >
            <div
                className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border',
                    isSelected
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-border-medium bg-transparent',
                )}
            >
                {isSelected && <Check className="h-3.5 w-3.5" />}
            </div>
            <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {project.displayName || project.name}
        </span>
                {project.description && (
                    <span className="truncate text-xs text-text-secondary">
            {project.description}
          </span>
                )}
            </div>
        </Ariakit.MenuItem>
    );
}

export default React.memo(KnowledgeBaseSubMenu);