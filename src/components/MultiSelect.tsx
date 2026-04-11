import { useState } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
};

export function MultiSelect({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder = "Выберите значения",
  label 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeSelected = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div style={{ position: "relative" }}>
      {label && (
        <label style={{ 
          display: "block", 
          marginBottom: "4px", 
          fontWeight: 500, 
          fontSize: "14px",
          color: "white" 
        }}>
          {label}
        </label>
      )}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "14px",
          minHeight: "42px",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor: "white",
        }}
      >
        {selectedOptions.length === 0 ? (
          <span style={{ color: "#999" }}>{placeholder}</span>
        ) : (
          selectedOptions.map(opt => (
            <span
              key={opt.value}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                backgroundColor: "#686ACF",
                color: "white",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              {opt.label}
              <span
                onClick={(e) => removeSelected(opt.value, e)}
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            </span>
          ))
        )}
        <span style={{ 
          marginLeft: "auto", 
          color: "#666",
          fontSize: "12px"
        }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxHeight: "200px",
              overflowY: "auto",
              color: "#333",
            }}
          >
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: selectedValues.includes(opt.value) ? "#f0f0ff" : "white",
                  borderBottom: "1px solid #eee",
                  color: "#333",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = selectedValues.includes(opt.value) ? "#e0e0ff" : "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedValues.includes(opt.value) ? "#f0f0ff" : "white";
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={() => {}}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ fontSize: "14px", color: "#333" }}>{opt.label}</span>
              </div>
            ))}
            {options.length === 0 && (
              <div style={{ padding: "12px", color: "#999", textAlign: "center" }}>
                Нет доступных опций
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
