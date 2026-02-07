import { apiClient } from "@/lib/api";
import type { PatientClinicalRecordsResponse } from "@/types/patient-records";

export async function fetchPatientRecords(
  patientId: string,
): Promise<PatientClinicalRecordsResponse> {
  const res = await apiClient.get<PatientClinicalRecordsResponse>(`/patients/${patientId}/records`);
  return res.data;
}
