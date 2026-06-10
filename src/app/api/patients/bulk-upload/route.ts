import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función para normalizar texto (eliminar tildes y convertir a mayúsculas)
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "super_admin" && userRole !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden cargar pacientes masivamente" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "El archivo debe ser formato CSV" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "El archivo CSV está vacío o no tiene datos" }, { status: 400 });
    }

    // Detectar separador (coma, tabulación o punto y coma)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;

    let separator = ",";
    if (tabCount > commaCount && tabCount > semicolonCount) {
      separator = "\t";
    } else if (semicolonCount > commaCount) {
      separator = ";";
    }

    const headers = firstLine.split(separator).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const requiredHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "fecha_nacimiento", "telefono", "email", "tipo_usuario", "sede", "programa_academico"];

    // Mapeo de nombres de columnas alternativos
    const headerMapping: { [key: string]: string } = {
      "programa": "programa_academico",
    };

    // Aplicar mapeo de headers
    const mappedHeaders = headers.map(h => headerMapping[h] || h);

    for (const required of requiredHeaders) {
      if (!mappedHeaders.includes(required)) {
        return NextResponse.json({ 
          error: `Falta columna requerida: ${required}. Columnas encontradas: ${headers.join(", ")}` 
        }, { status: 400 });
      }
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Cargar todos los programas una sola vez para optimizar
    const allPrograms = await prisma.programas_academicos.findMany();
    const normalizedPrograms = allPrograms.map(p => ({
      ...p,
      normalizedNombre: normalizeText(p.nombre)
    }));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(separator).map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      
      headers.forEach((header, index) => {
        const mappedHeader = headerMapping[header] || header;
        row[mappedHeader] = values[index] || "";
      });

      try {
        // Validar campos obligatorios
        const requiredFields = ["tipo_documento", "numero_documento", "nombres", "apellidos", "fecha_nacimiento", "email", "tipo_usuario", "sede", "programa_academico"];
        const missingFields = requiredFields.filter(field => !row[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
        }

        // Mapear tipos de documento
        const tipoDocMap: { [key: string]: string } = {
          "P": "PT",
          "C": "CC",
          "T": "TI",
          "R": "RC",
          "PPT": "PT", // PPT también mapea a PT (Pasaporte)
        };
        row.tipo_documento = tipoDocMap[row.tipo_documento.toUpperCase()] || row.tipo_documento.toUpperCase();

        // Validar y convertir formato de fecha (acepta DD/MM/YY o DD/MM/YYYY)
        let fechaNacimiento: string;
        const dateRegexDDMMYY = /^(\d{2})\/(\d{2})\/(\d{2})$/;
        const dateRegexDDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const dateRegexYYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

        if (dateRegexDDMMYY.test(row.fecha_nacimiento)) {
          const [, day, month, year] = row.fecha_nacimiento.match(dateRegexDDMMYY)!;
          const fullYear = parseInt(year) >= 50 ? `19${year}` : `20${year}`;
          fechaNacimiento = `${fullYear}-${month}-${day}`;
        } else if (dateRegexDDMMYYYY.test(row.fecha_nacimiento)) {
          const [, day, month, year] = row.fecha_nacimiento.match(dateRegexDDMMYYYY)!;
          fechaNacimiento = `${year}-${month}-${day}`;
        } else if (dateRegexYYYYMMDD.test(row.fecha_nacimiento)) {
          fechaNacimiento = row.fecha_nacimiento;
        } else {
          throw new Error("Formato de fecha inválido (debe ser DD/MM/YY, DD/MM/YYYY o YYYY-MM-DD)");
        }

        // Mapear sede SEDE QUIRINAL a Neiva, SEDE PRADO ALTO a Prado Alto, y SEDE PITALITO a Pitalito
        const sedeMap: { [key: string]: string } = {
          "SEDE QUIRINAL": "Neiva",
          "SEDE PRADO ALTO": "Prado Alto",
          "SEDE PITALITO": "Pitalito",
        };
        if (sedeMap[row.sede.toUpperCase()]) {
          row.sede = sedeMap[row.sede.toUpperCase()];
        }

        // Buscar o crear tipo de documento
        const tipoDoc = await prisma.tipos_documento.findFirst({
          where: { codigo: row.tipo_documento.toUpperCase() },
        });

        if (!tipoDoc) {
          throw new Error(`Tipo de documento no válido: ${row.tipo_documento}`);
        }

        // Buscar o crear tipo de usuario
        const tipoUsuario = await prisma.tipos_usuario.findFirst({
          where: { codigo: row.tipo_usuario.toUpperCase() },
        });

        if (!tipoUsuario) {
          throw new Error(`Tipo de usuario no válido: ${row.tipo_usuario}`);
        }

        // Buscar sede si se proporciona
        let sede = null;
        if (row.sede) {
          sede = await prisma.sedes.findFirst({
            where: { nombre: { contains: row.sede, mode: "insensitive" } },
          });
          if (!sede) {
            throw new Error(`Sede no válida: ${row.sede}`);
          }
        }

        // Buscar programa académico si se proporciona
        let programa = null;
        if (row.programa_academico) {
          const normalizedProgramName = normalizeText(row.programa_academico);
          
          // Primero intentar buscar por código (si el valor es un código)
          programa = normalizedPrograms.find(p => p.codigo === row.programa_academico.toUpperCase());
          
          // Si no encuentra por código, buscar por nombre normalizado
          if (!programa) {
            programa = normalizedPrograms.find(p => {
              const normalizedDbName = p.normalizedNombre;
              
              // Coincidencia exacta
              if (normalizedDbName === normalizedProgramName) return true;
              
              // Coincidencia parcial (uno contiene al otro)
              if (normalizedDbName.includes(normalizedProgramName) || normalizedProgramName.includes(normalizedDbName)) return true;
              
              // Coincidencia por palabras clave (separar por espacios y verificar si todas las palabras clave están presentes)
              const searchWords = normalizedProgramName.split(' ').filter(w => w.length > 3);
              const dbWords = normalizedDbName.split(' ').filter(w => w.length > 3);
              
              if (searchWords.length > 0 && dbWords.length > 0) {
                const matchingWords = searchWords.filter(sw => dbWords.some(dw => dw.includes(sw) || sw.includes(dw)));
                if (matchingWords.length >= Math.min(searchWords.length, 2)) return true;
              }
              
              return false;
            });
          }

          if (!programa) {
            // Buscar programas similares para dar sugerencia en el error
            const similarPrograms = normalizedPrograms
              .filter(p => {
                const normalizedDbName = p.normalizedNombre;
                const searchWords = normalizedProgramName.split(' ').filter(w => w.length > 3);
                return searchWords.some(sw => normalizedDbName.includes(sw));
              })
              .slice(0, 3)
              .map(p => `${p.nombre} (Código: ${p.codigo})`);
            
            const errorMsg = similarPrograms.length > 0 
              ? `Programa académico no válido: ${row.programa_academico}. Programas similares: ${similarPrograms.join(', ')}`
              : `Programa académico no válido: ${row.programa_academico}`;
            
            throw new Error(errorMsg);
          }
        }

        // Buscar EPS si se proporciona
        let eps = null;
        if (row.eps) {
          eps = await prisma.eps.findFirst({
            where: { nombre: { contains: row.eps, mode: "insensitive" } },
          });
        }

        // Verificar si el paciente ya existe
        const existingPatient = await prisma.pacientes.findFirst({
          where: {
            numero_documento: row.numero_documento,
          },
        });

        if (existingPatient) {
          throw new Error("El paciente ya existe");
        }

        // Crear paciente
        await prisma.pacientes.create({
          data: {
            id_tipo_documento: tipoDoc.id_tipo_documento,
            numero_documento: row.numero_documento,
            nombres: row.nombres,
            apellidos: row.apellidos,
            fecha_nacimiento: new Date(fechaNacimiento),
            telefono: row.telefono,
            email: row.email || null,
            id_tipo_usuario: tipoUsuario.id_tipo_usuario,
            id_sede: sede?.id_sede,
            id_programa_academico: programa?.id_programa_academico,
            id_eps: eps?.id_eps,
            activo: true,
          },
        });

        successCount++;
        results.push({
          row: i + 1,
          documento: row.numero_documento,
          nombre: `${row.nombres} ${row.apellidos}`,
          status: "success",
        });
      } catch (error: any) {
        errorCount++;
        errors.push({
          row: i + 1,
          documento: row.numero_documento,
          nombre: `${row.nombres} ${row.apellidos}`,
          error: error.message,
        });
      }
    }

    // Generar contenido del archivo de errores
    let erroresContent = "";
    if (errors.length > 0) {
      erroresContent = "REPORTE DE ERRORES - CARGA MASIVA DE PACIENTES\n";
      erroresContent += "=".repeat(60) + "\n\n";
      erroresContent += `Total procesados: ${lines.length - 1}\n`;
      erroresContent += `Exitosos: ${successCount}\n`;
      erroresContent += `Con errores: ${errorCount}\n\n`;
      erroresContent += "-".repeat(60) + "\n";
      erroresContent += "DETALLE DE ERRORES\n";
      erroresContent += "-".repeat(60) + "\n\n";
      
      errors.forEach((error: any) => {
        erroresContent += `Fila ${error.row}:\n`;
        erroresContent += `  Documento: ${error.documento}\n`;
        erroresContent += `  Nombre: ${error.nombre}\n`;
        erroresContent += `  Error: ${error.error}\n\n`;
      });
    }

    return NextResponse.json({
      success: true,
      total: lines.length - 1,
      successCount,
      errorCount,
      results,
      errors,
      erroresContent,
    });
  } catch (error: any) {
    console.error("Error en carga masiva:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la carga masiva" },
      { status: 500 }
    );
  }
}
