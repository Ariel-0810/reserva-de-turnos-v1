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
    setShowPicker(false);
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
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 grid grid-cols-2 gap-2 max-h-64 overflow-auto">
          <div>
            <p className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white">Hora</p>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourChange(hour)}
                    className={cn(
                      'px-2 py-1 text-sm rounded hover:bg-violet-100 transition-colors',
                      hours === hour && 'bg-violet-600 text-white hover:bg-violet-700'
                    )}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white">Min</p>
            <div className="grid grid-cols-4 gap-1">
              {['00', '15', '30', '45'].map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => handleMinuteChange(minute)}
                  className={cn(
                    'px-2 py-1 text-sm rounded hover:bg-violet-100 transition-colors',
                    minutes === minute && 'bg-violet-600 text-white hover:bg-violet-700'
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
