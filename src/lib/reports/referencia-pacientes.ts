/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReportData, ReportDefinition } from "./types";

export interface ReferenciaDiagnostico {
  codigo: string;
  nombre: string;
  tipo: string;
  esPrincipal: boolean;
}

export interface ReferenciaPacientesMeta {
  prestadorEmisor: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    departamento: string;
    municipio: string;
  };
  prestadorReferencia: {
    nombre: string;
    nit: string;
  };
  paciente: {
    nombreCompleto: string;
    numeroDocumento: string;
    tipoDocumento: string;
    fechaNacimiento: string;
    edad: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
  };
  responsable: {
    nombreCompleto: string;
    relacion: string;
    numeroDocumento: string;
    tipoDocumento: string;
    fechaNacimiento: string;
    edad: string;
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
  };
  personalRefiere: {
    nombre: string;
    celular: string;
    servicio: string;
    telefono: string;
  };
  informacionClinica: string;
  signosVitales: {
    fc: string;
    fr: string;
    temp: string;
    satO2: string;
    ta: string;
    glasgow: string;
    otros: string;
  };
  hallazgosExamenFisico: string;
  diagnosticos: ReferenciaDiagnostico[];
  firmas: {
    remite: {
      nombre: string;
      cargo: string;
      cedula: string;
    };
    recibe: {
      nombre: string;
      cargo: string;
      cedula: string;
    };
  };
}

function valueOrDefault(value: string | undefined | null, fallback = ""): string {
  return value ?? fallback;
}

function sectionTitle(text: string) {
  return { text, style: "sectionTitle" };
}

function fieldTable(rows: [string, string | null | undefined][]) {
  return {
    table: {
      widths: ["40%", "60%"],
      body: rows.map(([label, val]) => [
        { text: `${label}:`, bold: true, fontSize: 9 },
        { text: valueOrDefault(val), fontSize: 9 },
      ]) as any,
    },
    layout: "noBorders",
    margin: [0, 0, 0, 8],
  };
}

function buildContent(data: ReportData): any[] {
  const meta = (data.meta as ReferenciaPacientesMeta | undefined);
  const patient = data.patient;

  const pe = meta?.prestadorEmisor;
  const pr = meta?.prestadorReferencia;

  const paciente = meta?.paciente ?? {
    nombreCompleto: patient ? `${patient.nombres} ${patient.apellidos}`.trim() : "",
    numeroDocumento: patient?.numero_documento ?? "",
    tipoDocumento: patient?.tipos_documento?.codigo ?? "",
    fechaNacimiento: "",
    edad: "",
    telefono: "",
    direccion: "",
    departamento: "",
    municipio: "",
  };

  const responsable = meta?.responsable ?? {
    nombreCompleto: "",
    relacion: "",
    numeroDocumento: "",
    tipoDocumento: "",
    fechaNacimiento: "",
    edad: "",
    telefono: "",
    direccion: "",
    departamento: "",
    municipio: "",
  };

  const personal = meta?.personalRefiere ?? { nombre: "", celular: "", servicio: "", telefono: "" };
  const signos = meta?.signosVitales ?? { fc: "", fr: "", temp: "", satO2: "", ta: "", glasgow: "", otros: "" };
  const diagnosticos = meta?.diagnosticos ?? [];
  const firmas = meta?.firmas ?? { remite: { nombre: "", cargo: "", cedula: "" }, recibe: { nombre: "", cargo: "", cedula: "" } };

  const diagnosticosRows = (diagnosticos.length
    ? diagnosticos.map((d) => [d.codigo, d.nombre, d.tipo, d.esPrincipal ? "Sí" : "No"])
    : [["", "", "", ""]]) as any;

  return [
    { text: "REFERENCIA DE PACIENTES", alignment: "center", bold: true, fontSize: 13, margin: [0, 0, 0, 12] },

    sectionTitle("1. Información del prestador o entidad emisora"),
    fieldTable([
      ["Nombre", pe?.nombre],
      ["NIT", pe?.nit],
      ["Dirección", pe?.direccion],
      ["Teléfono", pe?.telefono],
      ["Departamento", pe?.departamento],
      ["Municipio", pe?.municipio],
    ]),

    sectionTitle("2. Información del prestador de referencia"),
    fieldTable([
      ["Nombre", pr?.nombre],
      ["NIT", pr?.nit],
    ]),

    sectionTitle("3. Datos del paciente"),
    fieldTable([
      ["Nombre completo", paciente.nombreCompleto],
      ["Número de documento", paciente.numeroDocumento],
      ["Tipo de documento", paciente.tipoDocumento],
      ["Fecha de nacimiento", paciente.fechaNacimiento],
      ["Edad", paciente.edad],
      ["Teléfono", paciente.telefono],
      ["Dirección", paciente.direccion],
      ["Departamento", paciente.departamento],
      ["Municipio", paciente.municipio],
    ]),

    sectionTitle("4. Datos de la persona responsable del paciente"),
    fieldTable([
      ["Nombre completo", responsable.nombreCompleto],
      ["Relación con el paciente", responsable.relacion],
      ["Número de documento", responsable.numeroDocumento],
      ["Tipo de documento", responsable.tipoDocumento],
      ["Fecha de nacimiento", responsable.fechaNacimiento],
      ["Edad", responsable.edad],
      ["Teléfono", responsable.telefono],
      ["Dirección actual", responsable.direccion],
      ["Departamento", responsable.departamento],
      ["Municipio", responsable.municipio],
    ]),

    sectionTitle("5. Personal que refiere"),
    fieldTable([
      ["Nombre", personal.nombre],
      ["Celular", personal.celular],
      ["Servicio", personal.servicio],
      ["Número de teléfono", personal.telefono],
    ]),

    sectionTitle("6. Información clínica relevante"),
    {
      text: valueOrDefault(meta?.informacionClinica, "Sin información registrada"),
      margin: [0, 0, 0, 8],
      fontSize: 9,
    },

    sectionTitle("6.1 Signos vitales"),
    fieldTable([
      ["FC", signos.fc],
      ["FR", signos.fr],
      ["TEMP", signos.temp],
      ["SAT O2", signos.satO2],
      ["TA", signos.ta],
      ["Glasgow", signos.glasgow],
      ["Otros", signos.otros],
    ]),

    sectionTitle("6.2 Hallazgos del examen físico"),
    {
      text: valueOrDefault(meta?.hallazgosExamenFisico, "Sin hallazgos registrados"),
      margin: [0, 0, 0, 8],
      fontSize: 9,
    },

    sectionTitle("7. Diagnósticos CIE-10"),
    {
      table: {
        widths: ["20%", "40%", "25%", "15%"],
        headerRows: 1,
        body: [
          [
            { text: "Código", bold: true, fontSize: 9 },
            { text: "Nombre", bold: true, fontSize: 9 },
            { text: "Tipo", bold: true, fontSize: 9 },
            { text: "Principal", bold: true, fontSize: 9 },
          ],
          ...diagnosticosRows,
        ] as any,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#d1d5db",
        vLineColor: () => "#d1d5db",
        fillColor: (rowIndex: number) => (rowIndex === 0 ? "#f3f4f6" : null),
      } as any,
      margin: [0, 0, 0, 8],
    },

    sectionTitle("8. Firmas"),
    {
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "Personal que remite", bold: true, fontSize: 9, alignment: "center" },
            { text: "Personal que recibe", bold: true, fontSize: 9, alignment: "center" },
          ],
          [
            {
              stack: [
                { text: "Firma: _________________________________", fontSize: 9, margin: [0, 12, 0, 0] },
                { text: `Nombre: ${firmas.remite.nombre}`, fontSize: 9, margin: [0, 4, 0, 0] },
                { text: `Cargo: ${firmas.remite.cargo}`, fontSize: 9 },
                { text: `Cédula / Registro Profesional: ${firmas.remite.cedula}`, fontSize: 9 },
              ],
            },
            {
              stack: [
                { text: "Firma: _________________________________", fontSize: 9, margin: [0, 12, 0, 0] },
                { text: `Nombre: ${firmas.recibe.nombre}`, fontSize: 9, margin: [0, 4, 0, 0] },
                { text: `Cargo: ${firmas.recibe.cargo}`, fontSize: 9 },
                { text: `Cédula / Registro Profesional: ${firmas.recibe.cedula}`, fontSize: 9 },
              ],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 8],
    },
  ];
}

const referenciaPacientesReport: ReportDefinition = {
  id: "referencia-pacientes",
  name: "Referencia de Pacientes",
  code: "FO-BI-SA-34",
  version: "01",
  vigencia: "Septiembre 24 de 2024",
  buildContent,
};

export { referenciaPacientesReport };
export default referenciaPacientesReport;
