import { z } from "zod";

 export const patientSchema = z.object({
  id_tipo_documento: z.number().int().positive("El tipo de documento es obligatorio"),
  numero_documento: z
    .string()
    .min(3, "El documento debe tener al menos 3 caracteres"),
  nombres: z.string().min(1, "Los nombres son obligatorios"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  telefono: z
    .string()
    .min(1, "El teléfono es obligatorio"),
  email: z.string().min(1, "El correo es obligatorio").email("Correo no válido"),
  id_genero: z.number().int().positive("El género es obligatorio"),
  id_estado_civil: z
    .number()
    .int()
    .positive("El estado civil es obligatorio"),
  id_ciudad: z.number().int().positive("La ciudad es obligatoria"),
  direccion: z.string().min(1, "La dirección es obligatoria"),
  grupo_poblacional: z
    .enum([
      "DISCAPACIDAD",
      "VICTIMA_CONFLICTO_ARMADO",
      "NINGUNA",
      "OTRA",
    ])
    .optional(),
  grupo_poblacional_otro: z.string().optional(),
  id_tipo_sangre: z.number().int().optional(),
  id_sede: z.number().int().positive("La sede es obligatoria"),
  id_programa_academico: z
    .number()
    .int()
    .positive("El programa/área es obligatorio"),
  id_eps: z.number().int().optional(),
  condicion_particular: z.string().optional(),
  id_tipo_usuario: z
    .number()
    .int()
    .positive("El tipo de usuario es obligatorio"),
}).superRefine((data, ctx) => {
  if (data.grupo_poblacional === "OTRA") {
    const cual = (data.grupo_poblacional_otro ?? "").trim();
    if (!cual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grupo_poblacional_otro"],
        message: "Debe especificar cuál",
      });
    }
  }
});

export type PatientFormData = z.infer<typeof patientSchema>;
