"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { bulkUploadPatients } from "@/services/patients";
import Swal from "sweetalert2";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useMutation({
    mutationFn: bulkUploadPatients,
    onSuccess: (data) => {
      let errorMessage = "";
      if (data.errorCount > 0) {
        const sampleErrors = data.errors.slice(0, 10);
        errorMessage = sampleErrors.map((e: any) => 
          `Fila ${e.row}: ${e.documento} - ${e.error}`
        ).join("\n");
        if (data.errorCount > 10) {
          errorMessage += `\n... y ${data.errorCount - 10} errores más`;
        }
      }

      Swal.fire({
        title: "Carga completada",
        html: `
          <div class="text-left text-sm">
            <p><strong>Total procesados:</strong> ${data.total}</p>
            <p class="text-emerald-600"><strong>Exitosos:</strong> ${data.successCount}</p>
            <p class="text-red-600"><strong>Con errores:</strong> ${data.errorCount}</p>
            ${data.errorCount > 0 ? `
              <div class="mt-3 p-2 bg-red-50 rounded text-xs max-h-40 overflow-y-auto">
                <p class="font-semibold mb-1">Primeros errores:</p>
                <pre class="whitespace-pre-wrap text-red-700">${errorMessage}</pre>
              </div>
              <button id="downloadErrors" class="mt-3 w-full bg-sky-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-sky-700">
                Descargar reporte de errores (.txt)
              </button>
            ` : ''}
          </div>
        `,
        icon: data.errorCount > 0 ? "warning" : "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#0ea5e9",
        width: data.errorCount > 0 ? "600px" : undefined,
        didOpen: () => {
          if (data.errorCount > 0 && data.erroresContent) {
            const downloadBtn = document.getElementById('downloadErrors');
            if (downloadBtn) {
              downloadBtn.addEventListener('click', () => {
                const blob = new Blob([data.erroresContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `errores_carga_pacientes_${new Date().toISOString().slice(0,10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }
          }
        },
      }).then(() => {
        onSuccess();
        onClose();
        setFile(null);
      });
    },
    onError: (error: any) => {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "No se pudo procesar el archivo",
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      Swal.fire({
        title: "Formato inválido",
        text: "El archivo debe ser formato CSV",
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#ef4444",
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (!file) {
      Swal.fire({
        title: "Archivo requerido",
        text: "Debe seleccionar un archivo CSV",
        icon: "warning",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#0ea5e9",
      });
      return;
    }
    mutation.mutate(file);
  };

  const downloadTemplate = () => {
    const template = `tipo_documento,numero_documento,nombres,apellidos,fecha_nacimiento,telefono,email,tipo_usuario,sede,programa_academico,eps
CC,123456789,Juan,Pérez,1990-01-15,3101234567,juan.perez@email.com,ESTUDIANTE,Neiva,INGENIERÍA DE SISTEMAS,Nueva EPS
TI,987654321,Maria,García,1995-05-20,3209876543,maria.garcia@email.com,ESTUDIANTE,Pitalito,ADMINISTRACIÓN DE EMPRESAS,Sanitas EPS`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_pacientes.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Carga Masiva de Pacientes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
          <p className="font-semibold mb-1">Campos obligatorios:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>tipo_documento (P=PT, C=CC, T=TI, R=RC, PPT=PT, o código completo)</li>
            <li>numero_documento</li>
            <li>nombres</li>
            <li>apellidos</li>
            <li>fecha_nacimiento (DD/MM/YY, DD/MM/YYYY o YYYY-MM-DD)</li>
            <li>email</li>
            <li>tipo_usuario (ESTUDIANTE, PROFESOR, ADMINISTRATIVO, EGRESADO, EXTERNO)</li>
            <li>sede (Neiva, Pitalito, Prado Alto, SEDE QUIRINAL, SEDE PRADO ALTO, SEDE PITALITO)</li>
            <li>programa_academico (código ej: "30" o nombre del programa)</li>
          </ul>
          <p className="font-semibold mt-2 mb-1">Campos opcionales:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>telefono</li>
            <li>eps</li>
          </ul>
        </div>

        <div className="mb-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-xs font-medium text-sky-600 hover:text-sky-700 underline"
          >
            Descargar plantilla de ejemplo
          </button>
        </div>

        <div
          className={`mb-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
          >
            <div className="flex flex-col items-center">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-1 text-xs text-slate-600">
                Arrastra un archivo CSV aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-400">
                Solo archivos CSV
              </p>
            </div>
          </label>
        </div>

        {file && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-2">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || mutation.isPending}
            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? "Procesando..." : "Cargar Pacientes"}
          </button>
        </div>
      </div>
    </div>
  );
}
