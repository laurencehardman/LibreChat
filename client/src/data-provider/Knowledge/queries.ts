// client/src/data-provider/Knowledge/queries.ts

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, QueryObserverResult } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';

export interface KnowledgeBaseProject {
    name: string;
    displayName?: string;
    description?: string;
}

export function useGetKnowledgeBaseProjects<TData = KnowledgeBaseProject[]>(
    config?: UseQueryOptions<KnowledgeBaseProject[], unknown, TData>,
): QueryObserverResult<TData> {
    return useQuery<KnowledgeBaseProject[], unknown, TData>(
        [QueryKeys.knowledgeBaseProjects],
        () => dataService.getKnowledgeBaseProjects(),
        {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: true,
            ...config,
        },
    );
}