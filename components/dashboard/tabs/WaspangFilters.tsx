"use client";

import { Filter, ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface FilterState {
  typeCapex: string[];
  statusSap: string[];
  distrik: string[];
  subDistrik: string[];
  wbs: string[];
}

interface Props {
  onFilterChange: (filters: FilterState) => void;
  availableOptions?: {
    distrik?: string[];
    subDistrik?: string[];
    wbs?: string[];
  };
}

const DEFAULT_OPTIONS = {
  typeCapex: ["NEW", "CO"],
  statusSap: ["PO", "IR", "GR"],
  distrik: [],
  subDistrik: [],
  wbs: [],
};

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelect: (value: string, checked: boolean) => void;
  onClear: () => void;
}

function FilterDropdown({
  label,
  options,
  selectedValues,
  onSelect,
  onClear,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer hover:border-red-400 transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <span>{label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-slate-300 rounded shadow-lg min-w-[180px]">
          <div className="p-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {label}
            </span>
            {selectedValues.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[200px] overflow-y-auto p-2">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 cursor-pointer text-xs text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => onSelect(option, e.target.checked)}
                  className="w-3 h-3 accent-red-600 rounded cursor-pointer"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {selectedValues.length > 0 && (
            <div className="px-2 py-1.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
              {selectedValues.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WaspangFilters({
  onFilterChange,
  availableOptions = {},
}: Props) {
  const [filters, setFilters] = useState<FilterState>({
    typeCapex: [],
    statusSap: [],
    distrik: [],
    subDistrik: [],
    wbs: [],
  });

  const options = {
    typeCapex: DEFAULT_OPTIONS.typeCapex,
    statusSap: DEFAULT_OPTIONS.statusSap,
    distrik: availableOptions.distrik || DEFAULT_OPTIONS.distrik,
    subDistrik: availableOptions.subDistrik || DEFAULT_OPTIONS.subDistrik,
    wbs: availableOptions.wbs || DEFAULT_OPTIONS.wbs,
  };

  const handleFilterSelect = (
    filterKey: keyof FilterState,
    value: string,
    checked: boolean,
  ) => {
    setFilters((prev) => {
      const newFilter = { ...prev };
      if (checked) {
        if (!newFilter[filterKey].includes(value)) {
          newFilter[filterKey] = [...newFilter[filterKey], value];
        }
      } else {
        newFilter[filterKey] = newFilter[filterKey].filter((v) => v !== value);
      }
      onFilterChange(newFilter);
      return newFilter;
    });
  };

  const handleClearFilter = (filterKey: keyof FilterState) => {
    setFilters((prev) => {
      const newFilter = { ...prev, [filterKey]: [] };
      onFilterChange(newFilter);
      return newFilter;
    });
  };

  const totalSelected = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const handleResetAll = () => {
    const emptyFilters: FilterState = {
      typeCapex: [],
      statusSap: [],
      distrik: [],
      subDistrik: [],
      wbs: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
          <Filter className="w-4 h-4" /> FILTERS:
        </div>

        <FilterDropdown
          label="TYPE CAPEX"
          options={options.typeCapex}
          selectedValues={filters.typeCapex}
          onSelect={(value, checked) =>
            handleFilterSelect("typeCapex", value, checked)
          }
          onClear={() => handleClearFilter("typeCapex")}
        />

        <FilterDropdown
          label="Status SAP"
          options={options.statusSap}
          selectedValues={filters.statusSap}
          onSelect={(value, checked) =>
            handleFilterSelect("statusSap", value, checked)
          }
          onClear={() => handleClearFilter("statusSap")}
        />

        <FilterDropdown
          label="DISTRIK"
          options={options.distrik}
          selectedValues={filters.distrik}
          onSelect={(value, checked) =>
            handleFilterSelect("distrik", value, checked)
          }
          onClear={() => handleClearFilter("distrik")}
        />

        <FilterDropdown
          label="SUB DISTRIK"
          options={options.subDistrik}
          selectedValues={filters.subDistrik}
          onSelect={(value, checked) =>
            handleFilterSelect("subDistrik", value, checked)
          }
          onClear={() => handleClearFilter("subDistrik")}
        />

        <FilterDropdown
          label="WBS"
          options={options.wbs}
          selectedValues={filters.wbs}
          onSelect={(value, checked) =>
            handleFilterSelect("wbs", value, checked)
          }
          onClear={() => handleClearFilter("wbs")}
        />

        {totalSelected > 0 && (
          <button
            onClick={handleResetAll}
            className="ml-auto text-xs bg-slate-200 text-slate-700 px-3 py-2 rounded hover:bg-slate-300 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>
    </div>
  );
}
