'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const [hours, minutes] = value.split(':');
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHourChange = (hour: string) => {
    onChange(`${hour.padStart(2, '0')}:${minutes || '00'}`);
  };

  const handleMinuteChange = (minute: string) => {
    onChange(`${hours || '00'}:${minute.padStart(2, '0')}`);
    setShowPicker(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <input
        type="text"
        readOnly
        value={value}
        onClick={() => setShowPicker(!showPicker)}
        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />

      {showPicker && (
        <div
          className={cn(
            'absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3',
            'w-56 max-w-[calc(100vw-1rem)]'
          )}
        >
          {/* Hora */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Hora</p>
            <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourChange(hour)}
                    className={cn(
                      'h-8 text-sm rounded-md font-medium tabular-nums transition-colors',
                      hours === hour
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                    )}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Minutos</p>
            <div className="grid grid-cols-4 gap-1">
              {['00', '15', '30', '45'].map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => handleMinuteChange(minute)}
                  className={cn(
                    'h-9 text-sm rounded-md font-medium tabular-nums transition-colors',
                    minutes === minute
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                  )}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
