import { useQuery } from "@tanstack/react-query";
import {
  fetchTiposDocumento,
  fetchGeneros,
  fetchEstadosCiviles,
  fetchTiposSangre,
  fetchSedes,
  fetchProgramasPorTipoPoblacion,
  fetchEps,
  fetchTiposUsuario,
  fetchDepartamentos,
  fetchCiudades,
  type TipoDocumento,
  type Genero,
  type EstadoCivil,
  type TipoSangre,
  type Sede,
  type ProgramaAcademico,
  type Eps,
  type TipoUsuario,
  type Departamento,
  type Ciudad,
} from "@/services/catalogs";

export function usePatientCatalogs(idTipoUsuario?: number, idDepartamento?: number) {
  
  const {
    data: tiposDocumento,
    isLoading: loadingTipos,
  } = useQuery<TipoDocumento[]>({
    queryKey: ["tipos_documento"],
    queryFn: fetchTiposDocumento,
  });

  const { data: generos } = useQuery<Genero[]>({
    queryKey: ["generos"],
    queryFn: fetchGeneros,
  });

  const { data: estadosCiviles } = useQuery<EstadoCivil[]>({
    queryKey: ["estados_civiles"],
    queryFn: fetchEstadosCiviles,
  });

  const { data: tiposSangre } = useQuery<TipoSangre[]>({
    queryKey: ["tipos_sangre"],
    queryFn: fetchTiposSangre,
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: fetchSedes,
  });

  const { data: tiposUsuario } = useQuery<TipoUsuario[]>({
    queryKey: ["tipos_usuario"],
    queryFn: fetchTiposUsuario,
  });

  const { data: eps } = useQuery<Eps[]>({
    queryKey: ["eps"],
    queryFn: fetchEps,
  });

  const { data: departamentos } = useQuery<Departamento[]>({
    queryKey: ["departamentos"],
    queryFn: fetchDepartamentos,
  });

  const { data: ciudades } = useQuery<Ciudad[]>({
    queryKey: ["ciudades", idDepartamento],
    enabled: !!idDepartamento,
    queryFn: () => fetchCiudades(idDepartamento),
  });

  const { data: programas } = useQuery<ProgramaAcademico[]>({
    queryKey: ["programas", idTipoUsuario],
    enabled: !!idTipoUsuario && !!tiposUsuario?.length,
    queryFn: async () => {
      if (!idTipoUsuario || !tiposUsuario?.length) return [];
      const tipo = tiposUsuario.find(
        (tu: TipoUsuario) => tu.id_tipo_usuario === idTipoUsuario,
      )?.codigo;
      if (!tipo) return [];

      const tipoPoblacion = idTipoUsuario === 6 ? "ESTUDIANTE" : tipo;
      return fetchProgramasPorTipoPoblacion(tipoPoblacion);
    },
  });

  return {
    tiposDocumento,
    loadingTipos,
    generos,
    estadosCiviles,
    tiposSangre,
    sedes,
    tiposUsuario,
    eps,
    departamentos,
    ciudades,
    programas,
  };
}
