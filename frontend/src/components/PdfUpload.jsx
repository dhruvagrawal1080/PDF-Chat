import React from "react";

const PdfUpload = ({ pdfName, pdfFile, loading, fileInputRef, onFileChange, onRemovePdf, onUpload }) => (
  <div className="flex flex-col items-center gap-6">
    <label className="w-full flex flex-col items-center px-4 py-8 bg-amber-50 rounded-xl border-2 border-dashed border-amber-300 cursor-pointer hover:bg-amber-100 transition">
      <svg className="w-12 h-12 text-amber-400 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3.5 3.5M12 8l3.5 3.5M21 16.5V19a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19v-2.5A2.5 2.5 0 0 1 5.5 14h13a2.5 2.5 0 0 1 2.5 2.5Z" />
      </svg>
      <span className="text-amber-700 font-semibold">Click to upload PDF</span>
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFileChange}
        ref={fileInputRef}
      />
    </label>
    {pdfName && (
      <div className="flex items-center gap-3 bg-amber-100 px-4 py-2 rounded-lg shadow">
        <span className="truncate max-w-xs text-amber-800 font-medium">{pdfName}</span>
        <button
          className={`ml-2 text-red-500 hover:text-red-700 transition ${loading && "hidden"}`}
          onClick={onRemovePdf}
          aria-label="Remove PDF"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )}
    <button
      className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!pdfFile || loading}
      onClick={onUpload}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          Uploading & Indexing...
        </span>
      ) : (
        "Prepare PDF"
      )}
    </button>
  </div>
);

export default PdfUpload; 