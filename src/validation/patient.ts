import { z } from "zod";

export const patientSchema = z.object({
  id_tipo_documento: z.number().int().positive("El tipo de documento es obligatorio"),
  numero_documento: z
    .string()
    .min(3, "El documento debe tener al menos 3 caracteres"),
  nombres: z.string().min(1, "Los nombres son obligatorios"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  telefono: z.string().optional(),
  email: z.string().min(1, "El correo es obligatorio").email("Correo no válido"),
  id_genero: z.number().int().positive("El género es obligatorio"),
  id_estado_civil: z
    .number()
    .int()
    .positive("El estado civil es obligatorio"),
  direccion: z.string().optional(),
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
});

export type PatientFormData = z.infer<typeof patientSchema>;
