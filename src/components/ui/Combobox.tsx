import { useMemo, useRef, useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto usado no filtro de busca; padrão = label */
  searchText?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

const DIACRITIC_RANGE = /[̀-ͯ]/g;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(DIACRITIC_RANGE, "")
    .toLowerCase()
    .trim();

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  disabled,
}: ComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typedQuery, setTypedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) || null,
    [options, value]
  );

  // Enquanto fechado, exibe o rótulo do item selecionado; enquanto aberto, exibe o texto digitado.
  const displayedValue = open ? typedQuery : (selectedOption ? selectedOption.label : "");

  const filteredOptions = useMemo(() => {
    if (!open) return options;
    const normalizedQuery = normalize(typedQuery);
    if (!normalizedQuery) return options;

    return options.filter(option =>
      normalize(option.searchText || option.label).includes(normalizedQuery)
    );
  }, [options, typedQuery, open]);

  const effectiveHighlightedIndex = Math.min(highlightedIndex, Math.max(filteredOptions.length - 1, 0));

  const closeDropdown = () => {
    setOpen(false);
    setTypedQuery("");
  };

  const handleClickAway = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      closeDropdown();
    }
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    closeDropdown();
  };

  const handleFocus = () => {
    if (disabled) return;
    setTypedQuery(selectedOption ? selectedOption.label : "");
    setHighlightedIndex(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const handleChange = (nextValue: string) => {
    setTypedQuery(nextValue);
    setHighlightedIndex(0);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return setOpen(true);
      setHighlightedIndex(index => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(index => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[effectiveHighlightedIndex];
      if (option) handleSelect(option);
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  };

  const handleClear = () => {
    onChange("");
    setTypedQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)} onBlur={handleClickAway}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayedValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-brand-brown/20 bg-background px-3 py-2 pr-16 text-sm text-brand-brown focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-brand-brown/40 hover:text-brand-brown"
              aria-label="Limpar seleção"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-brand-brown/40" />
        </div>
      </div>

      {open && !disabled && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-brand-brown/20 bg-white py-1 text-sm shadow-lg">
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-brand-brown/50">{emptyMessage}</li>
          )}
          {filteredOptions.map((option, index) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full px-3 py-2 text-left text-brand-brown",
                  index === effectiveHighlightedIndex ? "bg-brand-bg" : "hover:bg-brand-bg/60",
                  option.value === value && "font-semibold"
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
