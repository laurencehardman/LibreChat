// client/src/hooks/Knowledge/useKnowledgeBaseManager.ts

import { useCallback, useState, useEffect } from 'react';
import { LocalStorageKeys, Permissions, PermissionTypes } from 'librechat-data-provider';
import { useLocalize, useHasAccess } from '~/hooks';
import { useGetKnowledgeBaseProjects } from '~/data-provider';

export interface KnowledgeBaseProject {
    name: string;
    displayName?: string;
    description?: string;
}

export interface KnowledgeBaseManager {
    isPinned: boolean;
    setIsPinned: (v: boolean) => void;
    selectedProject: string | null;
    selectableProjects: KnowledgeBaseProject[];
    selectProject: (name: string) => void;
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

    const { data: projects = [], isLoading } = useGetKnowledgeBaseProjects({ enabled: canUse });

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
    /*  Selected project state + localStorage persistence                  */
    /* ------------------------------------------------------------------ */
    const storageKey = `${LocalStorageKeys.LAST_KNOWLEDGE_BASE_}${conversationId ?? 'new'}`;

    const [selectedProject, setSelectedProject] = useState<string | null>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Support legacy array format: take first item
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed[0];
                }
                if (typeof parsed === 'string' && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch {
            // ignore
        }
        return null;
    });

    // Persist to localStorage whenever selection changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(selectedProject));
    }, [selectedProject, storageKey]);

    /* ------------------------------------------------------------------ */
    /*  Select (single-project, radio-style)                               */
    /* ------------------------------------------------------------------ */
    const selectProject = useCallback((name: string) => {
        setSelectedProject((prev) => (prev === name ? null : name));
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Placeholder                                                        */
    /* ------------------------------------------------------------------ */
    const placeholderText = localize('com_assistants_knowledge_base');

    return {
        isPinned,
        setIsPinned,
        selectedProject,
        selectableProjects: projects,
        selectProject,
        placeholderText,
        isLoading,
    };
}
