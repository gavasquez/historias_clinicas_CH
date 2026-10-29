const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ORDER = [
  // hijos de atencion
  "acompanante_atencion", "certificados_medicos", "desistimientos_programa",
  "eventos_seguimiento_cronico", "examenes_diagnosticos", "formulas_medicas",
  "recomendaciones_medicas", "rutas_activadas_atencion",
  "hc_anamnesis_atencion", "hc_antecedentes_atencion", "hc_antecedentes_traumaticos_atencion",
  "hc_atencion_cierre", "hc_examen_fisico_atencion", "hc_habitos_atencion",
  "hc_ssr_atencion", "hc_tamizajes_atencion", "hc_valoracion_sistemas_atencion",
  "diagnosticos_atencion",
  // seguimiento depende de diagnostico y paciente
  "seguimientos_cronicos",
  // historias: dependientes
  "notas_evolucion_historia_diagnosticos", "notas_evolucion_historia",
  "documentos_exportados",
  // nucleo
  "atenciones_salud",
  "citas",
  "historias_clinicas",
  // resto de pacientes
  "acompanantes", "consentimientos_paciente", "programas_paciente",
  "pacientes",
];

async function main() {
  // archivos_adjuntos polimórfico: revisar entidades antes de tocar
  const adjuntos = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT entidad FROM archivos_adjuntos`,
  );
  console.log("archivos_adjuntos entidades:", JSON.stringify(adjuntos));

  const results = await prisma.$transaction(async (tx) => {
    // romper autorreferencia de historias antes de borrar
    await tx.$executeRawUnsafe(
      `UPDATE historias_clinicas SET id_historia_vinculada = NULL WHERE id_historia_vinculada IS NOT NULL`,
    );

    const out = [];
    for (const table of ORDER) {
      const r = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
      out.push([table, Number(r)]);
    }
    // adjuntos ligados a entidades clínicas/paciente
    const adj = await tx.$executeRawUnsafe(
      `DELETE FROM archivos_adjuntos WHERE entidad IN ('paciente','atencion','historia','historia_clinica','documento_clinico','certificado','evolucion','nota_evolucion','cita')`,
    );
    out.push(["archivos_adjuntos (entidades clínicas)", Number(adj)]);
    return out;
  });

  results.forEach(([t, n]) => console.log(`  ${t}: ${n} eliminados`));

  const restantes = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM pacientes`,
  );
  console.log("Pacientes restantes:", JSON.stringify(restantes));
}

main().finally(() => prisma.$disconnect());
