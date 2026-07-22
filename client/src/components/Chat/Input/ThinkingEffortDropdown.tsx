import React, { useState } from 'react';
import * as Ariakit from '@ariakit/react';
import { Brain, ChevronDown } from 'lucide-react';
import { ThinkingEffort } from 'librechat-data-provider';
import { useSetIndexOptions } from '~/hooks';
import { useChatContext } from '~/Providers';
import { cn } from '~/utils';

const OPTIONS = [
  { value: ThinkingEffort.auto, label: 'Auto' },
  { value: ThinkingEffort.low, label: 'Low' },
  { value: ThinkingEffort.high, label: 'High' },
] as const;

export default function ThinkingEffortDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { setOption } = useSetIndexOptions();
  const { conversation } = useChatContext();
  const currentValue = conversation?.thinkingEffort ?? ThinkingEffort.auto;
  const isNonDefault = currentValue !== ThinkingEffort.auto;

  const handleSelect = (value: ThinkingEffort) => {
    setOption('thinkingEffort')(value);
    setIsOpen(false);
  };

  const currentLabel = OPTIONS.find((o) => o.value === currentValue)?.label ?? 'Auto';

  return (
    <Ariakit.MenuProvider open={isOpen} setOpen={setIsOpen}>
      <Ariakit.MenuButton
        className={cn(
          'group relative inline-flex items-center justify-center gap-1.5',
          'border border-border-medium text-sm font-medium transition-all',
          'h-9 min-w-9 rounded-full bg-transparent px-2.5 shadow-sm',
          'hover:bg-surface-hover hover:shadow-md active:shadow-inner',
          isNonDefault && 'md:w-fit md:justify-start md:px-3',
          isOpen && 'bg-surface-hover',
        )}
      >
        <Brain className="h-4 w-4" aria-hidden="true" />
        {isNonDefault && (
          <>
            <span className="hidden text-text-primary md:block">{currentLabel}</span>
            <ChevronDown
              className={cn(
                'hidden h-3 w-3 text-text-secondary transition-transform md:block',
                isOpen && 'rotate-180',
              )}
            />
          </>
        )}
      </Ariakit.MenuButton>
      <Ariakit.Menu
        portal={true}
        gutter={8}
        modal={true}
        unmountOnHide={true}
        className={cn(
          'z-50 flex min-w-[120px] flex-col rounded-xl',
          'border border-border-light bg-presentation p-1.5 shadow-lg',
          'origin-top opacity-0 transition-[opacity,transform] duration-200 ease-out',
          'data-[enter]:scale-100 data-[enter]:opacity-100',
          'scale-95 data-[leave]:scale-95 data-[leave]:opacity-0',
        )}
      >
        <div className="flex flex-col gap-0.5">
          {OPTIONS.map((option) => (
            <Ariakit.MenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm',
                'hover:bg-surface-hover',
                currentValue === option.value && 'bg-surface-active font-medium',
              )}
            >
              {option.label}
            </Ariakit.MenuItem>
          ))}
        </div>
      </Ariakit.Menu>
    </Ariakit.MenuProvider>
  );
}
