import React from "react";

const PdfHeader = ({ pdfName, onRemovePdf }) => (
  <div className="flex items-center gap-3 bg-amber-100 px-4 py-2 rounded-lg shadow mb-2">
    <span className="truncate max-w-xs text-amber-800 font-medium">{pdfName}</span>
    <button
      className="ml-2 text-red-500 hover:text-red-700 transition"
      onClick={onRemovePdf}
      aria-label="Remove PDF"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default PdfHeader; 