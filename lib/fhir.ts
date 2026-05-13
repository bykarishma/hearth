export interface PatientMedication {
  name: string;
  instructions: string;
}

export interface PatientInfo {
  name: string;
  dob: string;
  gender: string;
}

export async function fetchPatientInfo(
  patientId: string
): Promise<PatientInfo> {
  const res = await fetch(`https://hapi.fhir.org/baseR4/Patient/${patientId}`);
  const patient = await res.json();

  const given = patient.name?.[0]?.given?.[0] ?? "";
  const family = patient.name?.[0]?.family ?? "";
  const name = [given, family].filter(Boolean).join(" ") || "Unknown";

  return {
    name,
    dob: patient.birthDate ?? "Unknown",
    gender: patient.gender ?? "Unknown",
  };
}

export async function fetchPatientConditions(
  patientId: string
): Promise<{ name: string }[]> {
  const res = await fetch(
    `https://hapi.fhir.org/baseR4/Condition?patient=${patientId}&clinical-status=active&_format=json`
  );
  if (!res.ok) throw new Error("Failed to fetch conditions");
  const data = await res.json();
  if (!data.entry) return [];
  return data.entry
    .map((e: { resource?: { code?: { coding?: { display?: string }[]; text?: string } } }) => ({
      name: e.resource?.code?.coding?.[0]?.display || e.resource?.code?.text || null,
    }))
    .filter((c: { name: string | null }) => c.name);
}

export async function fetchPatientMedications(
  patientId: string
): Promise<PatientMedication[]> {
  const res = await fetch(
    `https://hapi.fhir.org/baseR4/MedicationRequest?patient=${patientId}&status=active`
  );
  const bundle = await res.json();

  if (!bundle.entry || bundle.entry.length === 0) {
    return [];
  }

  return bundle.entry.map((entry: { resource: { medicationCodeableConcept?: { text?: string }; dosageInstruction?: { text?: string }[] } }) => ({
    name: entry.resource.medicationCodeableConcept?.text ?? "",
    instructions: entry.resource.dosageInstruction?.[0]?.text ?? "",
  }));
}
