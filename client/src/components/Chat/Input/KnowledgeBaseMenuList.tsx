// client/src/components/Chat/Input/KnowledgeBaseMenuList.tsx

import React from 'react';
import * as Ariakit from '@ariakit/react';
import { Check } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

import type {
  KnowledgeBaseManager,
  KnowledgeBaseProject,
} from '~/hooks/Knowledge/useKnowledgeBaseManager';

function CheckboxIndicator({ isSelected }: { isSelected: boolean }) {
  return (
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
  );
}

function KnowledgeBaseMenuListItem({
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
        'transition-colors hover:bg-surface-hover',
        isSelected && 'bg-green-50 dark:bg-green-950',
      )}
    >
      <CheckboxIndicator isSelected={isSelected} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{project.displayName || project.name}</span>
        {project.description && (
          <span className="truncate text-xs text-text-secondary">{project.description}</span>
        )}
      </div>
    </Ariakit.MenuItem>
  );
}

function KnowledgeBaseMenuList({ manager }: { manager: KnowledgeBaseManager }) {
  const localize = useLocalize();
  const { selectedProjects, selectableProjects, toggleProject, toggleGlobal, isGlobalSelected } =
    manager;

  const selectedSet = new Set(selectedProjects);

  return (
    <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
      <Ariakit.MenuItem
        hideOnClick={false}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          toggleGlobal();
        }}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
          'transition-colors hover:bg-surface-hover',
          isGlobalSelected && 'bg-green-50 dark:bg-green-950',
        )}
      >
        <CheckboxIndicator isSelected={isGlobalSelected} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{localize('com_ui_all_projects')}</span>
        </div>
      </Ariakit.MenuItem>
      <div className="my-1 h-px flex-shrink-0 bg-border-light" aria-hidden="true" />
      {selectableProjects.map((project) => (
        <KnowledgeBaseMenuListItem
          key={project.name}
          project={project}
          isSelected={selectedSet.has(project.name)}
          onToggle={() => toggleProject(project.name)}
        />
      ))}
    </div>
  );
}

export default React.memo(KnowledgeBaseMenuList);
