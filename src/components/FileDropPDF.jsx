import React from "react";

export function FileDropPDF({
  onFile,
  error,
  hint = "Drag & drop your CV (PDF) or browse",
}) {
  const inputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  function handleFiles(files) {
    const f = files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") return alert("Please upload a PDF file.");
    onFile(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300
        ${dragging ? "border-accent bg-accent/10" : "border-border hover:border-primary"}
        ${error ? "border-red-500 bg-red-500/10" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      
      <div className="space-y-4">
        <div className="text-4xl">
          {dragging ? "📥" : "📄"}
        </div>
        
        <div>
          <p className="text-lg font-medium text-text-hi">{hint}</p>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>
        
        <p className="text-sm text-text-lo">
          PDF files only, up to 10MB
        </p>
      </div>
    </div>
  );
}