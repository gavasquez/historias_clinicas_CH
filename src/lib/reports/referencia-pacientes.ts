/* eslint-disable @typescript-eslint/no-explicit-any */

import { unifiedForm } from "./base";
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
    telefono: string;
    direccion: string;
    departamento: string;
    municipio: string;
  };
  personalRefiere: {
    nombre: string;
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
    telefono: "",
    direccion: "",
    departamento: "",
    municipio: "",
  };

  const personal = meta?.personalRefiere ?? { nombre: "", servicio: "", telefono: "" };
  const signos = meta?.signosVitales ?? { fc: "", fr: "", temp: "", satO2: "", ta: "", glasgow: "", otros: "" };
  const diagnosticos = meta?.diagnosticos ?? [];
  const firmas = meta?.firmas ?? { remite: { nombre: "", cargo: "", cedula: "" }, recibe: { nombre: "", cargo: "", cedula: "" } };

  const diagnosticosRows = (diagnosticos.length
    ? diagnosticos.map((d) => [d.codigo, d.nombre, d.tipo, d.esPrincipal ? "Sí" : "No"])
    : [["", "", "", ""]]) as any;

  const sections: { title: string; content: any }[] = [
    {
      title: "1. Información del prestador o entidad emisora",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "Nombre:", bold: true }, { text: valueOrDefault(pe?.nombre) }],
            [{ text: "NIT:", bold: true }, { text: valueOrDefault(pe?.nit) }],
            [{ text: "Dirección:", bold: true }, { text: valueOrDefault(pe?.direccion) }],
            [{ text: "Teléfono:", bold: true }, { text: valueOrDefault(pe?.telefono) }],
            [{ text: "Departamento:", bold: true }, { text: valueOrDefault(pe?.departamento) }],
            [{ text: "Municipio:", bold: true }, { text: valueOrDefault(pe?.municipio) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "2. Información del prestador de referencia",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "Nombre:", bold: true }, { text: valueOrDefault(pr?.nombre) }],
            [{ text: "NIT:", bold: true }, { text: valueOrDefault(pr?.nit) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "3. Datos del paciente",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "Nombre completo:", bold: true }, { text: valueOrDefault(paciente.nombreCompleto) }],
            [{ text: "Número de documento:", bold: true }, { text: valueOrDefault(paciente.numeroDocumento) }],
            [{ text: "Tipo de documento:", bold: true }, { text: valueOrDefault(paciente.tipoDocumento) }],
            [{ text: "Fecha de nacimiento:", bold: true }, { text: valueOrDefault(paciente.fechaNacimiento) }],
            [{ text: "Edad:", bold: true }, { text: valueOrDefault(paciente.edad) }],
            [{ text: "Teléfono:", bold: true }, { text: valueOrDefault(paciente.telefono) }],
            [{ text: "Dirección:", bold: true }, { text: valueOrDefault(paciente.direccion) }],
            [{ text: "Departamento:", bold: true }, { text: valueOrDefault(paciente.departamento) }],
            [{ text: "Municipio:", bold: true }, { text: valueOrDefault(paciente.municipio) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "4. Datos de la persona responsable del paciente",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "Nombre completo:", bold: true }, { text: valueOrDefault(responsable.nombreCompleto) }],
            [{ text: "Relación con el paciente:", bold: true }, { text: valueOrDefault(responsable.relacion) }],
            [{ text: "Número de documento:", bold: true }, { text: valueOrDefault(responsable.numeroDocumento) }],
            [{ text: "Tipo de documento:", bold: true }, { text: valueOrDefault(responsable.tipoDocumento) }],
            [{ text: "Teléfono:", bold: true }, { text: valueOrDefault(responsable.telefono) }],
            [{ text: "Dirección actual:", bold: true }, { text: valueOrDefault(responsable.direccion) }],
            [{ text: "Departamento:", bold: true }, { text: valueOrDefault(responsable.departamento) }],
            [{ text: "Municipio:", bold: true }, { text: valueOrDefault(responsable.municipio) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "5. Personal que refiere",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "Nombre:", bold: true }, { text: valueOrDefault(personal.nombre) }],
            [{ text: "Servicio:", bold: true }, { text: valueOrDefault(personal.servicio) }],
            [{ text: "Teléfono:", bold: true }, { text: valueOrDefault(personal.telefono) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "6. Información clínica relevante",
      content: { text: valueOrDefault(meta?.informacionClinica, "Sin información registrada"), fontSize: 10 },
    },
    {
      title: "6.1 Signos vitales",
      content: {
        table: {
          widths: ["40%", "60%"],
          body: [
            [{ text: "FC:", bold: true }, { text: valueOrDefault(signos.fc) }],
            [{ text: "FR:", bold: true }, { text: valueOrDefault(signos.fr) }],
            [{ text: "TEMP:", bold: true }, { text: valueOrDefault(signos.temp) }],
            [{ text: "SAT O2:", bold: true }, { text: valueOrDefault(signos.satO2) }],
            [{ text: "TA:", bold: true }, { text: valueOrDefault(signos.ta) }],
            [{ text: "Glasgow:", bold: true }, { text: valueOrDefault(signos.glasgow) }],
            [{ text: "Otros:", bold: true }, { text: valueOrDefault(signos.otros) }],
          ],
        },
        layout: "noBorders",
      },
    },
    {
      title: "6.2 Hallazgos del examen físico",
      content: { text: valueOrDefault(meta?.hallazgosExamenFisico, "Sin hallazgos registrados"), fontSize: 10 },
    },
    {
      title: "7. Diagnósticos CIE-10",
      content: {
        table: {
          widths: ["20%", "40%", "25%", "15%"],
          headerRows: 1,
          body: [
            [
              { text: "Código", bold: true, fontSize: 9, fillColor: "#f3f4f6" },
              { text: "Nombre", bold: true, fontSize: 9, fillColor: "#f3f4f6" },
              { text: "Tipo", bold: true, fontSize: 9, fillColor: "#f3f4f6" },
              { text: "Principal", bold: true, fontSize: 9, fillColor: "#f3f4f6" },
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
      },
    },
    {
      title: "8. Firmas",
      content: {
        table: {
          widths: ["50%", "50%"],
          body: [
            [
              { text: "Personal que remite", bold: true, fontSize: 9, alignment: "center", fillColor: "#f3f4f6" },
              { text: "Personal que recibe", bold: true, fontSize: 9, alignment: "center", fillColor: "#f3f4f6" },
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
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#d1d5db",
          vLineColor: () => "#d1d5db",
        } as any,
      },
    },
  ];

  return [{ text: "REFERENCIA DE PACIENTES", alignment: "center", bold: true, fontSize: 13, margin: [0, 0, 0, 12] }, unifiedForm(sections)];
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
