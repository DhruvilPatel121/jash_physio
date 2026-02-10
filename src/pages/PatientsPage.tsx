import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  subscribeToPatients,
  getAllCaseNotes,
  subscribeToCaseNotes,
} from "@/services/firebase";
import type { Patient, CaseNote } from "@/types";
import { Search, Plus, User, Loader2, Download } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadJsPDF = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // If already loaded
      // @ts-ignore
      if (window.jspdf && window.jspdf.jsPDF)
        return resolve(window.jspdf.jsPDF);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("jsPDF failed to load"));
      };
      script.onerror = () => reject(new Error("Failed to load jsPDF"));
      document.body.appendChild(script);
    });
  };

  const exportPatientsPdf = async () => {
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 36; // 0.5 inch
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Patient Records Export", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 20;
    const dateStr = `${new Date().toLocaleDateString(
      "en-GB",
    )} ${new Date().toLocaleTimeString()}`;
    doc.setTextColor(100);
    doc.text(
      `Generated on ${dateStr} • Total Patients: ${patients.length}`,
      margin,
      y,
    );
    doc.setTextColor(0);
    y += 30;

    patients.forEach((patient, index) => {
      // Check if we need a new page
      if (y + 200 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      // Patient header
      doc.setFillColor(59, 130, 246); // Blue background
      doc.rect(margin, y - 15, pageWidth - margin * 2, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${patient.fullName}`, margin + 5, y);

      // Add patient ID for reference
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`ID: ${patient.id}`, pageWidth - margin - 80, y);

      doc.setTextColor(0, 0, 0);
      y += 35;

      // Basic Information Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Basic Information:", margin, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      const basicInfo = [
        `Phone: ${patient.phoneNumber || "N/A"}`,
        `Email: ${patient.email || "N/A"}`,
        `Age: ${patient.age || "N/A"} ${
          patient.dateOfBirth ? `(${patient.dateOfBirth})` : ""
        }`,
        `Gender: ${patient.gender || "N/A"}`,
        `Address: ${patient.address || "N/A"}`,
        `Emergency Contact: ${patient.emergencyContact || "N/A"}`,
      ];

      basicInfo.forEach((info) => {
        if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(info, margin + 10, y);
        y += 12;
      });

      // Medical Information Section
      if (patient.medicalHistory || patient.currentMedications) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Medical Information:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        if (patient.medicalHistory) {
          doc.text("Medical History:", margin + 10, y);
          y += 12;
          const historyLines = doc.splitTextToSize(
            patient.medicalHistory,
            pageWidth - margin * 2 - 20,
          );
          historyLines.forEach((line: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 15, y);
            y += 12;
          });
        }

        if (patient.currentMedications) {
          y += 5;
          doc.text("Current Medications:", margin + 10, y);
          y += 12;
          const medLines = doc.splitTextToSize(
            patient.currentMedications,
            pageWidth - margin * 2 - 20,
          );
          medLines.forEach((line: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 15, y);
            y += 12;
          });
        }
      }

      // Clinical Information Section
      if (
        patient.complaint ||
        patient.diagnosis ||
        patient.investigation ||
        patient.precautions
      ) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Clinical Information:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        const clinicalInfo = [
          { label: "Chief Complaint:", value: patient.complaint },
          { label: "Diagnosis:", value: patient.diagnosis },
          { label: "Investigation:", value: patient.investigation },
          { label: "Precautions:", value: patient.precautions },
        ];

        clinicalInfo.forEach((info) => {
          if (info.value) {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.text(info.label, margin + 10, y);
            y += 12;
            doc.setFont("helvetica", "normal");
            const valueLines = doc.splitTextToSize(
              info.value,
              pageWidth - margin * 2 - 25,
            );
            valueLines.forEach((line: string) => {
              if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + 15, y);
              y += 12;
            });
            y += 5;
          }
        });
      }

      // Treatment Plan Section
      if (patient.treatmentPlan) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Treatment Plan:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        if (
          patient.treatmentPlan.electroTherapy &&
          patient.treatmentPlan.electroTherapy.length > 0
        ) {
          doc.text("Electrotherapy:", margin + 10, y);
          y += 12;
          patient.treatmentPlan.electroTherapy.forEach((therapy: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(`• ${therapy}`, margin + 15, y);
            y += 12;
          });
        }

        if (
          patient.treatmentPlan.exerciseTherapy &&
          patient.treatmentPlan.exerciseTherapy.length > 0
        ) {
          y += 5;
          doc.text("Exercise Therapy:", margin + 10, y);
          y += 12;
          patient.treatmentPlan.exerciseTherapy.forEach((therapy: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(`• ${therapy}`, margin + 15, y);
            y += 12;
          });
        }
      }

      // Record Information
      y += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100);
      const recordInfo = `Created by: ${
        patient.createdByName || "Unknown"
      } on ${new Date(patient.createdAt).toLocaleDateString("en-GB")}`;
      doc.text(recordInfo, margin, y);
      if (patient.updatedBy && patient.updatedAt !== patient.createdAt) {
        y += 10;
        const updateInfo = `Last updated by: ${
          patient.updatedByName || "Unknown"
        } on ${new Date(patient.updatedAt).toLocaleDateString("en-GB")}`;
        doc.text(updateInfo, margin, y);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      y += 25; // Space between patients
    });

    doc.save(`patients_complete_${new Date().getTime()}.pdf`);
  };

  useEffect(() => {
    // Subscribe to real-time patient updates
    const unsubscribePatients = subscribeToPatients((updatedPatients) => {
      setPatients(updatedPatients);
      setFilteredPatients(updatedPatients);
      setLoading(false);
    });
    // Subscribe to real-time case notes so cards refresh instantly
    const unsubscribeNotes = subscribeToCaseNotes((notes) => {
      setCaseNotes(notes);
    });

    return () => {
      unsubscribePatients();
      unsubscribeNotes();
    };
  }, []);

  // Build latest case note by patientId
  const latestCaseNoteByPatient = useMemo(() => {
    const map: Record<string, CaseNote> = {};
    for (const n of caseNotes) {
      if (!map[n.patientId]) map[n.patientId] = n;
    }
    return map;
  }, [caseNotes]);

  useEffect(() => {
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase().trim();
      const filtered = patients.filter((patient) => {
        // Search in patient basic info
        const nameMatch =
          patient.fullName?.toLowerCase().includes(term) || false;
        const phoneMatch =
          patient.phoneNumber?.includes(debouncedSearch) || false;
        const emailMatch = patient.email?.toLowerCase().includes(term) || false;
        const addressMatch =
          patient.address?.toLowerCase().includes(term) || false;
        const emergencyMatch =
          patient.emergencyContact?.toLowerCase().includes(term) || false;

        // Search in case notes if available
        const note = latestCaseNoteByPatient[patient.id];
        let caseNoteMatch = false;
        if (note) {
          const combined = [
            note.complaint,
            note.diagnosis,
            note.mriFinding,
            note.xrayFinding,
            note.precautions,
            note.rxPlan,
            note.exerciseProtocol,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          caseNoteMatch = combined.includes(term);
        }

        return (
          nameMatch ||
          phoneMatch ||
          emailMatch ||
          addressMatch ||
          emergencyMatch ||
          caseNoteMatch
        );
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [debouncedSearch, patients, latestCaseNoteByPatient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedPatientsByCreated = [...filteredPatients].sort((a, b) => {
    const ac = a.createdAt || 0;
    const bc = b.createdAt || 0;
    if (ac !== bc) return ac - bc;
    const aid = typeof a.id === "string" ? a.id : "";
    const bid = typeof b.id === "string" ? b.id : "";
    return aid.localeCompare(bid);
  });
  const numberById = new Map<string, number>();
  sortedPatientsByCreated.forEach((p, idx) => {
    numberById.set(p.id as string, idx + 1);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPatientsPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => navigate("/patients/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, phone, diagnosis, Rx plan, findings, or exercise protocol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try a different search term"
                  : "Get started by adding your first patient"}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate("/patients/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    navigate(
                      `/patients/${patient.id}?num=${numberById.get(
                        patient.id as string,
                      )}`,
                    )
                  }
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 text-white font-semibold shadow-sm">
                            {numberById.get(patient.id as string)}
                          </div>
                          <CardTitle className="text-lg">
                            {patient.fullName}
                          </CardTitle>
                        </div>
                        {patient.age && (
                          <Badge variant="secondary" className="mt-2">
                            {patient.age} years
                          </Badge>
                        )}
                      </div>
                      {patient.gender && (
                        <Badge variant="outline">{patient.gender}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const note = latestCaseNoteByPatient[patient.id];

                      return (
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">
                              Complaint:
                            </span>{" "}
                            <span className="text-muted-foreground line-clamp-2">
                              {note?.complaint || patient.complaint || "—"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">
                              Diagnosis:
                            </span>{" "}
                            <span className="text-muted-foreground line-clamp-2">
                              {note?.diagnosis || patient.diagnosis || "—"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">
                              Rx plan:
                            </span>{" "}
                            <span className="text-muted-foreground line-clamp-2">
                              {/* Always show dash as requested, avoiding detailed treatment plan display */}
                              {"—"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="text-xs text-muted-foreground mt-2">
                      Updated on{" "}
                      {new Date(
                        patient.updatedAt || patient.createdAt,
                      ).toLocaleDateString("en-GB")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
