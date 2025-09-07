import React, { useMemo, useState } from "react";
import { normalize } from "../utils/normalize";

export type ComboOption = { value: string; label: string; aliases?: string[] };

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  noOptionsText?: string;
  options: ComboOption[];
  value: string | undefined;                 // valor atual exibido no input (label)
  onChange: (label: string) => void;         // envia LABEL ao backend, preservando contrato
  required?: boolean;
  disabled?: boolean;
};

export default function Combobox({
  id, label, placeholder, noOptionsText = "Sem opções",
  options, value, onChange, required, disabled
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter(opt => {
      const hay = [opt.label, ...(opt.aliases ?? []), opt.value].map(normalize);
      return hay.some(h => h.includes(q));
    });
  }, [options, query]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        type="text"
        className="border rounded px-3 py-2"
        placeholder={placeholder}
        value={value ?? query}
        onChange={(e) => {
          setQuery(e.target.value);
          // não dispara onChange até selecionar uma opção
        }}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      <div className="border rounded mt-1 max-h-44 overflow-auto bg-white">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">{noOptionsText}</div>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                onChange(opt.label); // ✅ mantém label para o backend
                setQuery(opt.label);
              }}
            >
              {opt.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
