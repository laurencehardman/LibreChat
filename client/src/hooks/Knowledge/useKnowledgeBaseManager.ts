// client/src/hooks/Knowledge/useKnowledgeBaseManager.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocalStorageKeys, Permissions, PermissionTypes } from 'librechat-data-provider';
import { useGetKnowledgeBaseProjects } from '~/data-provider';
import { useLocalize, useHasAccess } from '~/hooks';

export interface KnowledgeBaseProject {
  name: string;
  displayName?: string;
  description?: string;
}

const EMPTY_PROJECTS: KnowledgeBaseProject[] = [];

export interface KnowledgeBaseManager {
  isPinned: boolean;
  setIsPinned: (v: boolean) => void;
  selectedProjects: string[];
  selectableProjects: KnowledgeBaseProject[];
  toggleProject: (name: string) => void;
  toggleGlobal: () => void;
  isGlobalSelected: boolean;
  placeholderText: string;
  isLoading: boolean;
}

export function useKnowledgeBaseManager({
  conversationId,
  storageContextKey,
}: { conversationId?: string | null; storageContextKey?: string } = {}): KnowledgeBaseManager {
  const localize = useLocalize();

  const canUse = useHasAccess({
    permissionType: PermissionTypes.FILE_SEARCH,
    permission: Permissions.USE,
  });

  const { data: projectsData, isLoading } = useGetKnowledgeBaseProjects({ enabled: canUse });
  /* Stable identity while the query has no data: a fresh default array per
     render would defeat the memo below and, through it, the provider's. */
  const projects = projectsData ?? EMPTY_PROJECTS;

  /* ------------------------------------------------------------------ */
  /*  Pin state                                                          */
  /* ------------------------------------------------------------------ */
  const [isPinned, setIsPinnedState] = useState(() => {
    const stored = localStorage.getItem(
      `${LocalStorageKeys.PIN_KNOWLEDGE_BASE_}${storageContextKey ?? conversationId ?? 'new'}`,
    );
    return stored === 'true';
  });

  const setIsPinned = useCallback(
    (v: boolean) => {
      setIsPinnedState(v);
      localStorage.setItem(
        `${LocalStorageKeys.PIN_KNOWLEDGE_BASE_}${storageContextKey ?? conversationId ?? 'new'}`,
        String(v),
      );
    },
    [conversationId, storageContextKey],
  );

  /* ------------------------------------------------------------------ */
  /*  Selected projects state + localStorage persistence                 */
  /* ------------------------------------------------------------------ */
  const storageKey = `${LocalStorageKeys.LAST_KNOWLEDGE_BASE_}${conversationId ?? 'new'}`;

  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (name): name is string => typeof name === 'string' && name.length > 0,
          );
        }
        // Support legacy single-project format
        if (typeof parsed === 'string' && parsed.length > 0) {
          return [parsed];
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Prune selections to projects that still exist once the list loads
  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    setSelectedProjects((prev) => {
      const validNames = new Set(projects.map((p) => p.name));
      const pruned = prev.filter((name) => validNames.has(name));
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [projects]);

  // Persist to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(selectedProjects));
  }, [selectedProjects, storageKey]);

  /* ------------------------------------------------------------------ */
  /*  Multi-select (checkbox-style) + global (select all)                */
  /* ------------------------------------------------------------------ */
  const toggleProject = useCallback((name: string) => {
    setSelectedProjects((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }, []);

  const isGlobalSelected = useMemo(
    () =>
      projects.length > 0 &&
      selectedProjects.length > 0 &&
      projects.every((p) => selectedProjects.includes(p.name)),
    [projects, selectedProjects],
  );

  const toggleGlobal = useCallback(() => {
    setSelectedProjects((prev) => {
      const allSelected = projects.length > 0 && projects.every((p) => prev.includes(p.name));
      return allSelected ? [] : projects.map((p) => p.name);
    });
  }, [projects]);

  /* ------------------------------------------------------------------ */
  /*  Placeholder                                                        */
  /* ------------------------------------------------------------------ */
  const placeholderText = localize('com_assistants_knowledge_base');

  /* Memoized: BadgeRowProvider holds this in its memoized context value, so a
     fresh object per render would invalidate every consumer on each keystroke. */
  return useMemo(
    () => ({
      isPinned,
      setIsPinned,
      selectedProjects,
      selectableProjects: projects,
      toggleProject,
      toggleGlobal,
      isGlobalSelected,
      placeholderText,
      isLoading,
    }),
    [
      isPinned,
      setIsPinned,
      selectedProjects,
      projects,
      toggleProject,
      toggleGlobal,
      isGlobalSelected,
      placeholderText,
      isLoading,
    ],
  );
}
