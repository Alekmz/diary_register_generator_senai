import React, { useState, useRef, useEffect } from 'react';

interface ComboboxProps {
  id: string;
  label: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function Combobox({ 
  id, 
  label, 
  placeholder = "Digite para buscar...", 
  options, 
  value, 
  onChange, 
  required = false 
}: ComboboxProps) {
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
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpar searchTerm quando o valor muda (após seleção)
  useEffect(() => {
    if (value && !isOpen) {
      setSearchTerm('');
    }
  }, [value, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    onChange(newValue);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
    // Não focar no input após seleção para evitar reabrir o dropdown
  };

  const handleInputFocus = () => {
    if (!value) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

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
          value={isOpen ? searchTerm : (value || '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500"
          autoComplete="off"
        />
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-gray-900 font-medium"
                >
                  {option}
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
