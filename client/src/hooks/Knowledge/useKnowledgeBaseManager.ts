// client/src/hooks/Knowledge/useKnowledgeBaseManager.ts

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToastContext } from '@librechat/client';
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
    selectedProjects: string[];
    selectableProjects: KnowledgeBaseProject[];
    toggleProject: (name: string) => void;
    placeholderText: string;
    isLoading: boolean;
}

export function useKnowledgeBaseManager({
                                            conversationId,
                                            storageContextKey,
                                        }: { conversationId?: string | null; storageContextKey?: string } = {}): KnowledgeBaseManager {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const queryClient = useQueryClient();

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
    /*  Selected projects state + localStorage persistence                 */
    /* ------------------------------------------------------------------ */
    const storageKey = `${LocalStorageKeys.LAST_KNOWLEDGE_BASE_}${conversationId ?? 'new'}`;

    const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch {
            // ignore
        }
        // Default: all projects selected
        return projects.map((p) => p.name);
    });

    const prevProjectsRef = useRef(projects);

    // When projects load for the first time, select all if nothing is stored
    useEffect(() => {
        if (
            projects.length > 0 &&
            prevProjectsRef.current.length === 0 &&
            selectedProjects.length === 0
        ) {
            setSelectedProjects(projects.map((p) => p.name));
        }
        prevProjectsRef.current = projects;
    }, [projects, selectedProjects.length]);

    // Persist to localStorage whenever selection changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(selectedProjects));
    }, [selectedProjects, storageKey]);

    /* ------------------------------------------------------------------ */
    /*  Toggle                                                             */
    /* ------------------------------------------------------------------ */
    const toggleProject = useCallback((name: string) => {
        setSelectedProjects((prev) => {
            if (prev.includes(name)) {
                const next = prev.filter((n) => n !== name);
                if (next.length === 0) {
                    showToast({
                        message: 'At least one project must be selected for Knowledge Base search to work.',
                        status: 'warning',
                    });
                    return prev;
                }
                return next;
            }
            return [...prev, name];
        });
    }, [showToast]);

    /* ------------------------------------------------------------------ */
    /*  Placeholder                                                        */
    /* ------------------------------------------------------------------ */
    const placeholderText = localize('com_assistants_knowledge_base');

    return {
        isPinned,
        setIsPinned,
        selectedProjects,
        selectableProjects: projects,
        toggleProject,
        placeholderText,
        isLoading,
    };
}