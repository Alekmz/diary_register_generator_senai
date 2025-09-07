import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  id: string;
  label: string;
  placeholder?: string;
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}

export default function MultiSelect({ 
  id, 
  label, 
  placeholder = "Digite para buscar...", 
  options, 
  value, 
  onChange, 
  required = false 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opções baseado no termo de busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    const newValue = value.includes(option) 
      ? value.filter(v => v !== option)
      : [...value, option];
    
    onChange(newValue);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const removeSelected = (optionToRemove: string) => {
    onChange(value.filter(v => v !== optionToRemove));
  };

  const displayValue = value.length > 0 ? `${value.length} estratégia(s) selecionada(s)` : '';

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={dropdownRef} className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required && value.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
          autoComplete="off"
        />
        
        {/* Mostrar valores selecionados */}
        {value.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.map((selected, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
              >
                <span className="mr-2">{selected}</span>
                <button
                  type="button"
                  onClick={() => removeSelected(selected)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-blue-200 transition-colors"
                  title="Remover"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-gray-900 font-medium border-b border-gray-100 last:border-b-0 ${
                    value.includes(option) ? 'bg-blue-50 text-blue-900' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      value.includes(option) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {value.includes(option) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
