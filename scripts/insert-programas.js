const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const programas = [
  // Programas académicos (ESTUDIANTE)
  { nombre: "ADMINISTRACION BANCARIA Y FINANCIERA", codigo: "30", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION BANCARIA Y FINANCIERA-PITALITO", codigo: "31", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION COMERCIAL", codigo: "60", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION COMERCIAL-PITALITO", codigo: "61", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION DE EMPRESAS AGROPECUARIAS", codigo: "10", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION DE EMPRESAS AGROPECUARIAS-PITALITO", codigo: "16", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION DE EMPRESAS TURISTICAS", codigo: "15", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACIÓN DE EMPRESAS TURÍSTICAS - Virtual", codigo: "27", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL", codigo: "32", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL - PITALITO", codigo: "33", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ADMINISTRACION TURISTICA", codigo: "11", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ELECTIVA", codigo: "ELTVA", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN ARQUITECTURA DE SOFTWARE - Virtual", codigo: "56", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN BIG DATA Y ANALÍTICA DE DATOS - Virtual", codigo: "36", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN CIBERSEGURIDAD - Virtual", codigo: "73", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN GERENCIA DE EMPRESAS", codigo: "13", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN GERENCIA DE SISTEMAS INTEGRADOS DE CALIDAD", codigo: "14", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN GERENCIA LOGÍSTICA Y CADENAS DE SUMINISTRO", codigo: "22", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO", codigo: "18", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO - Virtual", codigo: "74", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN HIDROINFORMÁTICA - Presencial", codigo: "25", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN HIDROINFORMÁTICA - Virtual", codigo: "26", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN INGENIERÍA DE SOFTWARE - Virtual", codigo: "34", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN INTELIGENCIA ARTIFICIAL - Virtual", codigo: "35", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN MACHINE LEARNING PARA INTERNET DE LAS COSAS (IoT) - Virtual", codigo: "29", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN MARKETING DIGITAL - Virtual", codigo: "28", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN SANIDAD Y PRODUCCIÓN DE PECES DE AGUAS CONTINENTALES", codigo: "37", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN SANIDAD Y PRODUCCIÓN DE PECES DE AGUAS CONTINENTALES", codigo: "21", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ESPECIALIZACIÓN EN SISTEMAS INTEGRADOS DE GESTIÓN - Virtual", codigo: "24", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA AGRONÓMICA", codigo: "38", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA AGRONÓMICA - PITALITO", codigo: "55", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA AMBIENTAL", codigo: "80", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA DE SISTEMAS", codigo: "90", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA DE SISTEMAS - PITALITO", codigo: "91", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA DE SOFTWARE - Hibrida", codigo: "58", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA DE SOFTWARE - Virtual", codigo: "57", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA EN ENERGIAS RENOVABLES", codigo: "19", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA EN INTELIGENCIA ARTIFICIAL - Híbrida", codigo: "72", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERÍA EN INTELIGENCIA ARTIFICIAL - Virtual", codigo: "71", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA INDUSTRIAL", codigo: "40", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA INDUSTRIAL-PITALITO", codigo: "41", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INGENIERIA MECATRONICA", codigo: "17", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "INTERCAMBIO INSTITUCIONAL", codigo: "OU", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "MEDICINA VETERINARIA Y ZOOTECNIA", codigo: "50", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "MEDICINA VETERINARIA Y ZOOTECNIA-PITALITO", codigo: "51", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "MERCADEO, PUBLICIDAD Y VENTAS", codigo: "70", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "MERCADEO Y PUBLICIDAD", codigo: "23", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "NEGOCIOS INTERNACIONALES", codigo: "12", tipo_poblacion: "ESTUDIANTE" },
  { nombre: "ZOOTECNIA", codigo: "20", tipo_poblacion: "ESTUDIANTE" },

  // Áreas administrativas (ADMIN)
  { nombre: "INFORMACION - VENTANILLA UNICA - CONTACTO", codigo: "AREA_001", tipo_poblacion: "ADMIN" },
  { nombre: "ADMINISTRADOR DE SEDE", codigo: "AREA_002", tipo_poblacion: "ADMIN" },
  { nombre: "ADMISIONES", codigo: "AREA_003", tipo_poblacion: "ADMIN" },
  { nombre: "GESTIÓN DOCUMENTAL - ARCHIVO", codigo: "AREA_004", tipo_poblacion: "ADMIN" },
  { nombre: "BIBLIOTECA", codigo: "AREA_005", tipo_poblacion: "ADMIN" },
  { nombre: "BIENESTAR - QUIRINAL", codigo: "AREA_006", tipo_poblacion: "ADMIN" },
  { nombre: "BIENESTAR - PSICOLOGIA", codigo: "AREA_007", tipo_poblacion: "ADMIN" },
  { nombre: "BIENESTAR - CONSULTORIO MEDICO", codigo: "AREA_008", tipo_poblacion: "ADMIN" },
  { nombre: "CTel", codigo: "AREA_009", tipo_poblacion: "ADMIN" },
  { nombre: "CLINICA VETERINARIA", codigo: "AREA_010", tipo_poblacion: "ADMIN" },
  { nombre: "COMPRAS BIENES Y SERVICIOS", codigo: "AREA_011", tipo_poblacion: "ADMIN" },
  { nombre: "CONTABILIDAD", codigo: "AREA_012", tipo_poblacion: "ADMIN" },
  { nombre: "CONTROL INTERNO", codigo: "AREA_013", tipo_poblacion: "ADMIN" },
  { nombre: "CORPORACION CULTURAL JOSE EUSTASIO RIVERA", codigo: "AREA_014", tipo_poblacion: "ADMIN" },
  { nombre: "DERECHOS PECUNIARIOS", codigo: "AREA_015", tipo_poblacion: "ADMIN" },
  { nombre: "AMBIENTES VIRTUALES DAVA", codigo: "AREA_016", tipo_poblacion: "ADMIN" },
  { nombre: "DIRECCIÓN DE CURRÍCULO", codigo: "AREA_017", tipo_poblacion: "ADMIN" },
  { nombre: "FACULTAD DE CIENCIAS ECONÓMICAS Y ADMINISTRATIVAS", codigo: "AREA_018", tipo_poblacion: "ADMIN" },
  { nombre: "FACULTAD DE MEDICINA VETERINARIA Y CIENCIAS AFINES", codigo: "AREA_019", tipo_poblacion: "ADMIN" },
  { nombre: "FACULTAD DE INGENIERIAS", codigo: "AREA_020", tipo_poblacion: "ADMIN" },
  { nombre: "SECRETRARIA DECANATURA INGENIERIA", codigo: "AREA_021", tipo_poblacion: "ADMIN" },
  { nombre: "GESTION DE TIC E INNOVACIÓN TECNOLOGICA", codigo: "AREA_022", tipo_poblacion: "ADMIN" },
  { nombre: "INSCRIPCIONES - MERCADEO", codigo: "AREA_023", tipo_poblacion: "ADMIN" },
  { nombre: "OFICINA DE COMUNICACIONES", codigo: "AREA_024", tipo_poblacion: "ADMIN" },
  { nombre: "PERSONAL Y TALENTO HUMANO", codigo: "AREA_025", tipo_poblacion: "ADMIN" },
  { nombre: "PLANEACIÓN", codigo: "AREA_026", tipo_poblacion: "ADMIN" },
  { nombre: "EGRESADOS", codigo: "AREA_027", tipo_poblacion: "ADMIN" },
  { nombre: "BOLSA DE EMPLEO", codigo: "AREA_028", tipo_poblacion: "ADMIN" },
  { nombre: "EMPRENDIMIENTO", codigo: "AREA_029", tipo_poblacion: "ADMIN" },
  { nombre: "SIG - CALIDAD", codigo: "AREA_030", tipo_poblacion: "ADMIN" },
  { nombre: "SEGURIDAD Y SALUD EN EL TRABAJO", codigo: "AREA_031", tipo_poblacion: "ADMIN" },
  { nombre: "PORTERIA QUIRINAL", codigo: "AREA_032", tipo_poblacion: "ADMIN" },
  { nombre: "PORTERIA PRADO ALTO", codigo: "AREA_033", tipo_poblacion: "ADMIN" },
  { nombre: "PRESUPUESTO", codigo: "AREA_034", tipo_poblacion: "ADMIN" },
  { nombre: "PROG. ADMON COMERCIAL", codigo: "AREA_035", tipo_poblacion: "ADMIN" },
  { nombre: "ADMINISTRACIÓN FINANCIERA Y BURSÁTIL", codigo: "AREA_036", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA ADMINISTRACIÓN DE EMPRESAS TURÍSTICAS", codigo: "AREA_037", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA MERCADEO, PUBLICIDAD Y VENTAS", codigo: "AREA_038", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA NEGOCIOS INTERNACIONALES", codigo: "AREA_039", tipo_poblacion: "ADMIN" },
  { nombre: "RECTORIA", codigo: "AREA_040", tipo_poblacion: "ADMIN" },
  { nombre: "REGISTRO Y CONTROL", codigo: "AREA_041", tipo_poblacion: "ADMIN" },
  { nombre: "SALA DE DOCENTES BLOQUE B - QUIRINAL", codigo: "AREA_042", tipo_poblacion: "ADMIN" },
  { nombre: "SALA DE DOCENTES BLOQUE C - QUIRINAL", codigo: "AREA_043", tipo_poblacion: "ADMIN" },
  { nombre: "SALA DE DOCENTES BLOQUE B - PRADO ALTO", codigo: "AREA_044", tipo_poblacion: "ADMIN" },
  { nombre: "SECRETARÍA GENERAL", codigo: "AREA_045", tipo_poblacion: "ADMIN" },
  { nombre: "TESORERIA", codigo: "AREA_046", tipo_poblacion: "ADMIN" },
  { nombre: "VICERRECTORIA ACADEMICA", codigo: "AREA_047", tipo_poblacion: "ADMIN" },
  { nombre: "VICERRECTORIA ADMINISTRATIVA", codigo: "AREA_048", tipo_poblacion: "ADMIN" },
  { nombre: "EXTENSIÓN Y PROYECCION SOCIAL", codigo: "AREA_049", tipo_poblacion: "ADMIN" },
  { nombre: "DEPARTAMENTO DE LENGUAS MODERNAS", codigo: "AREA_050", tipo_poblacion: "ADMIN" },
  { nombre: "ORI - OFICINA DE RELACIONES INTERNAC.", codigo: "AREA_051", tipo_poblacion: "ADMIN" },
  { nombre: "LABORATORIO REPRODUCCIÓN", codigo: "AREA_052", tipo_poblacion: "ADMIN" },
  { nombre: "LABORATORIO BIOTECNOLOGÍA SANITARIA", codigo: "AREA_053", tipo_poblacion: "ADMIN" },
  { nombre: "LABORATORIO AGROAMBIENTAL - RECEPCIÓN", codigo: "AREA_054", tipo_poblacion: "ADMIN" },
  { nombre: "LABORATORIO AGROAMBIENTAL- AGUAS", codigo: "AREA_055", tipo_poblacion: "ADMIN" },
  { nombre: "LABORATORIO AGROAMBIENTAL - SUELOS", codigo: "AREA_056", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA INGENIERÍA AMBIENTAL", codigo: "AREA_057", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA INGENIERÍA EN ENERGÍAS RENOVABLES", codigo: "AREA_058", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA INGENIERÍA INDUSTRIAL", codigo: "AREA_059", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA INGENIERÍA MECATRÓNICA", codigo: "AREA_060", tipo_poblacion: "ADMIN" },
  { nombre: "PROGRAMA INGENIERÍA DE SISTEMAS", codigo: "AREA_061", tipo_poblacion: "ADMIN" },
];

async function main() {
  console.log('Iniciando inserción de programas académicos...');
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const programa of programas) {
    try {
      const result = await prisma.programas_academicos.upsert({
        where: { codigo: programa.codigo },
        update: { 
          nombre: programa.nombre, 
          tipo_poblacion: programa.tipo_poblacion 
        },
        create: programa,
      });

      if (result.createdAt === result.updatedAt) {
        inserted++;
        console.log(`✓ Insertado: ${programa.nombre}`);
      } else {
        updated++;
        console.log(`↻ Actualizado: ${programa.nombre}`);
      }
    } catch (error) {
      errors++;
      console.error(`✗ Error en ${programa.nombre}:`, error.message);
    }
  }

  console.log('\n--- Resumen ---');
  console.log(`Insertados: ${inserted}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Errores: ${errors}`);
  console.log(`Total procesados: ${programas.length}`);
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
