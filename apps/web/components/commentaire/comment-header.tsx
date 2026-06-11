"use client";

import { useState, useRef, useEffect } from "react";

export default function CommentHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Récents");
  
  const menuRef = useRef<HTMLDivElement>(null);
  const filters = ["Récents", "Populaires", "Tendances"];

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full px-4 py-3 border-b border-gray-100 flex items-center select-none relative" ref={menuRef}>
      {/* Déclencheur du menu */}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[15px] font-bold text-gray-900 hover:opacity-80 transition"
      >
        {selectedFilter}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5} 
          stroke="currentColor" 
          className={`w-4 h-4 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Options du filtre */}
      {isOpen && (
        <div className="absolute top-11 left-4 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setSelectedFilter(filter);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-[14px] transition-colors ${
                selectedFilter === filter 
                  ? "bg-gray-50 font-semibold text-gray-900" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}