"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Swal from "sweetalert2";
import { Download, Loader2, Upload } from "lucide-react";
import {
  ALLOWED_HISTORY_DOCUMENT_FILES,
  HISTORY_DOCUMENT_TYPES,
  MAX_HISTORY_DOCUMENT_SIZE,
  getHistoryDocumentTypeLabel,
  type HistoryDocumentType,
} from "@/lib/patient-documents";
import {
  downloadHistoryDocument,
  fetchHistoryDocuments,
  uploadHistoryDocument,
  type HistoryDocument,
} from "@/services/history-documents";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  historyId: number;
  historyLabel: string;
}

function formatSize(value: number | string | null): string {
  const bytes = Number(value ?? 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "No se pudo procesar el documento";
  }
  return "No se pudo procesar el documento";
}

export function HistoryDocumentsModal({
  isOpen,
  onClose,
  patientId,
  historyId,
  historyLabel,
}: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tipoDocumento, setTipoDocumento] = useState<HistoryDocumentType | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const queryKey = ["history-documents", patientId, historyId];

  const { data: documents = [], isLoading, isError, error: documentsError, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchHistoryDocuments(patientId, historyId),
    enabled: isOpen && !!patientId && historyId > 0,
  });

  useEffect(() => {
    if (!isOpen) {
      setTipoDocumento("");
      setFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  const existingDocument = useMemo(
    () => documents.find((document) => document.tipo_documento === tipoDocumento),
    [documents, tipoDocumento],
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!tipoDocumento || !file) throw new Error("Datos incompletos");
      let replace = false;
      if (existingDocument) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Documento existente",
          text: "Esta historia ya tiene un documento de este tipo. ¿Desea reemplazarlo?",
          showCancelButton: true,
          confirmButtonText: "Sí, reemplazar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#0284c7",
        });
        if (!result.isConfirmed) throw new Error("UPLOAD_CANCELLED");
        replace = true;
      }
      return uploadHistoryDocument(patientId, historyId, tipoDocumento, file, replace);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setTipoDocumento("");
      setFile(null);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await Swal.fire({
        icon: "success",
        title: "Documento cargado",
        text: "Documento cargado correctamente.",
        confirmButtonColor: "#0284c7",
      });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "UPLOAD_CANCELLED") return;
      void Swal.fire({
        icon: "error",
        title: "Error al cargar",
        text: getErrorMessage(error),
        confirmButtonColor: "#0284c7",
      });
    },
  });

  const handleFileChange = (selected: File | null) => {
    setFile(null);
    setFileError(null);
    if (!selected) return;
    const extension = `.${selected.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!(extension in ALLOWED_HISTORY_DOCUMENT_FILES)) {
      setFileError("Solo se permiten archivos PDF, XLS o XLSX.");
      return;
    }
    if (selected.size === 0) {
      setFileError("El archivo está vacío.");
      return;
    }
    if (selected.size > MAX_HISTORY_DOCUMENT_SIZE) {
      setFileError("El archivo supera el límite de 10 MB.");
      return;
    }
    setFile(selected);
  };

  const handleDownload = async (document: HistoryDocument) => {
    setDownloadingId(document.id_archivo);
    try {
      await downloadHistoryDocument(patientId, historyId, document);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error de descarga",
        text: getErrorMessage(error),
        confirmButtonColor: "#0284c7",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Documentos de la historia clínica</h2>
            <p className="mt-1 text-xs text-slate-600">{historyLabel}</p>
          </div>
          <button type="button" onClick={onClose} disabled={uploadMutation.isPending} className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cerrar
          </button>
        </div>

        <div className="max-h-[75vh] space-y-5 overflow-y-auto p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase text-slate-700">Cargar documento</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-slate-700">
                <span>Tipo de documento</span>
                <select value={tipoDocumento} onChange={(event) => {
                  setTipoDocumento(event.target.value as HistoryDocumentType | "");
                  setFile(null);
                  setFileError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }} disabled={uploadMutation.isPending} className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-sky-500 disabled:cursor-not-allowed">
                  <option value="">Seleccione un tipo</option>
                  {HISTORY_DOCUMENT_TYPES.map((type) => <option key={type.code} value={type.code}>{type.label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-slate-700">
                <span>Archivo</span>
                <input ref={fileInputRef} type="file" accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} disabled={uploadMutation.isPending} className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white text-xs file:mr-3 file:cursor-pointer file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-sky-700 disabled:cursor-not-allowed" />
              </label>
            </div>
            {file && <p className="mt-2 text-xs text-slate-600">{file.name} · {file.name.split(".").pop()?.toUpperCase()} · {formatSize(file.size)}</p>}
            {fileError && <p className="mt-2 text-xs font-medium text-red-600">{fileError}</p>}
            {existingDocument && <p className="mt-2 text-xs font-medium text-amber-700">Ya existe este tipo de documento. Se solicitará confirmación para reemplazarlo.</p>}
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => uploadMutation.mutate()} disabled={!tipoDocumento || !file || !!fileError || uploadMutation.isPending} className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadMutation.isPending ? "Cargando documento..." : "Cargar documento"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-700">Documentos cargados</h3>
            {isLoading && <p className="text-xs text-slate-500">Cargando documentos...</p>}
            {isError && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div>
                  <p className="text-xs font-medium text-amber-800">No fue posible consultar los documentos en este momento.</p>
                  <p className="mt-0.5 text-[10px] text-amber-700">{getErrorMessage(documentsError)}</p>
                </div>
                <button type="button" onClick={() => void refetch()} className="cursor-pointer rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100">
                  Reintentar
                </button>
              </div>
            )}
            {!isLoading && !isError && documents.length === 0 && <p className="rounded-md border border-slate-200 p-4 text-xs text-slate-500">No hay documentos cargados para esta historia clínica.</p>}
            {!isLoading && !isError && documents.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><tr><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Archivo</th><th className="px-3 py-2">Carga</th><th className="px-3 py-2">Acción</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {documents.map((document) => (
                      <tr key={document.id_archivo}>
                        <td className="px-3 py-2 font-medium text-slate-800">{getHistoryDocumentTypeLabel(document.tipo_documento)}</td>
                        <td className="px-3 py-2 text-slate-600"><div className="max-w-[220px] truncate" title={document.nombre_archivo}>{document.nombre_archivo}</div><div className="text-[10px] text-slate-500">{formatSize(document.tamano_bytes)}</div></td>
                        <td className="px-3 py-2 text-slate-600">{new Date(document.fecha_subida).toLocaleString()}<div className="text-[10px] text-slate-500">{document.usuario || "Usuario no disponible"}</div></td>
                        <td className="px-3 py-2"><button type="button" onClick={() => handleDownload(document)} disabled={downloadingId === document.id_archivo} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-sky-300 px-2 py-1 font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50">{downloadingId === document.id_archivo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Descargar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
