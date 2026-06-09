// client/src/components/Chat/Input/KnowledgeBaseSelect.tsx

import React, { memo } from 'react';
import * as Ariakit from '@ariakit/react';
import { ChevronDown } from 'lucide-react';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { TooltipAnchor, VectorIcon } from '@librechat/client';
import { useHasAccess } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';
import { cn } from '~/utils';

function KnowledgeBaseSelectContent() {
    const context = useBadgeRowContext();
    const manager = context?.knowledgeBaseManager;

    const menuStore = Ariakit.useMenuStore({ focusLoop: true });
    const isOpen = menuStore.useState('open');

    if (!manager) {
        return null;
    }

    const {
        selectedProject,
        selectableProjects,
        selectProject,
        placeholderText,
    } = manager;

    const selectedDisplayName =
        selectableProjects.find((p) => p.name === selectedProject)?.displayName ??
        selectedProject;
    const displayText = selectedDisplayName ?? placeholderText;

    return (
        <Ariakit.MenuProvider store={menuStore}>
            <TooltipAnchor
                description={placeholderText}
                disabled={isOpen}
                render={
                    <Ariakit.MenuButton
                        className={cn(
                            'group relative inline-flex items-center justify-center gap-1.5',
                            'border border-green-600/40 bg-green-500/10 text-sm font-medium transition-all',
                            'h-9 min-w-9 rounded-full px-2.5 shadow-sm',
                            'hover:bg-green-700/10 hover:shadow-md active:shadow-inner',
                            'md:w-fit md:justify-start md:px-3',
                            isOpen && 'bg-green-700/10',
                        )}
                    />
                }
            >
                <VectorIcon className="size-3.5 text-green-600 dark:text-green-400" />
                <span className="hidden truncate text-text-primary md:block">
                    {displayText}
                </span>
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
                <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
                    {selectableProjects.map((project) => {
                        const isSelected = selectedProject === project.name;
                        return (
                            <Ariakit.MenuItem
                                key={project.name}
                                hideOnClick={false}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    selectProject(project.name);
                                }}
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                                    'hover:bg-surface-hover transition-colors',
                                    isSelected && 'bg-green-50 dark:bg-green-950',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border',
                                        isSelected
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-border-medium bg-transparent',
                                    )}
                                >
                                    {isSelected && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    )}
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
                    })}
                </div>
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
