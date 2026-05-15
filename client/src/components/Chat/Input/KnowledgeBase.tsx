import React, { memo } from 'react';
import { CheckboxButton, VectorIcon } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

function KnowledgeBase() {
    const localize = useLocalize();
    const context = useBadgeRowContext();
    const { toggleState: knowledgeBaseEnabled, debouncedChange, isPinned } = context?.knowledgeBase ?? {};
    console.log('KnowledgeBase:', { knowledgeBaseEnabled, isPinned });

    const canUseKnowledgeBase = useHasAccess({
        permissionType: PermissionTypes.FILE_SEARCH,  // or a new permission type
        permission: Permissions.USE,
    });

    if (!canUseKnowledgeBase) {
        return null;
    }


    return (
        <>
            {(knowledgeBaseEnabled || isPinned) && (
                <CheckboxButton
                    className="max-w-fit"
                    checked={knowledgeBaseEnabled}
                    setValue={debouncedChange}
                    label={localize('com_assistants_knowledge_base')}
                    isCheckedClassName="border-green-600/40 bg-green-500/10 hover:bg-green-700/10"
                    icon={<VectorIcon className="icon-md" />}
                />
            )}
        </>
    );
}

export default memo(KnowledgeBase);