import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getPatient,
  getPatientVisits,
  getPatientPrescriptions,
  getPatientExercisePlans,
  getPatientDoctorObservations,
  createVisit,
  createDoctorObservation,
  createExercisePlan,
  createCaseNote,
  getPatientCaseNotes,
  deleteCaseNote,
  updateVisit,
  deleteVisit,
  updateDoctorObservation,
  deleteDoctorObservation,
  updatePatient,
  deletePatient,
} from "@/services/firebase";
import type {
  Patient,
  Visit,
  Prescription,
  ExercisePlan,
  DoctorObservation,
} from "@/types";
import { AttendanceCalendar } from "@/components/patients/AttendanceCalendar";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  Loader2,
  FileText,
  Activity,
} from "lucide-react";

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canDeletePatient } = usePermissions();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [observations, setObservations] = useState<DoctorObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit dialogs state
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [visitForm, setVisitForm] = useState({
    visitDate: "",
    chiefComplaint: "",
    painSeverity: "",
    visitNotes: "",
  });

  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [editingObservation, setEditingObservation] =
    useState<DoctorObservation | null>(null);
  const [observationForm, setObservationForm] = useState({
    diagnosis: "",
    examinationFindings: "",
    warningsAndPrecautions: "",
    treatmentPlan: "",
  });
  // For Add Visit: dedicated fields for MRI/X-ray and Exercise protocol text
  const [mriFinding, setMriFinding] = useState("");
  const [xrayFinding, setXrayFinding] = useState("");
  const [exerciseProtocol, setExerciseProtocol] = useState("");

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      const [
        patientData,
        visitsData,
        prescriptionsData,
        exercisePlansData,
        observationsData,
      ] = await Promise.all([
        getPatient(id!),
        getPatientVisits(id!),
        getPatientPrescriptions(id!),
        getPatientExercisePlans(id!),
        getPatientDoctorObservations(id!),
      ]);

      setPatient(patientData);
      setVisits(visitsData);
      setPrescriptions(prescriptionsData);
      setExercisePlans(exercisePlansData);
      setObservations(observationsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (
    date: Date,
    status: "present" | "absent" | null,
  ) => {
    if (!patient || !id) return;

    const dateKey = format(date, "yyyy-MM-dd");
    const updatedAttendance = { ...(patient.attendance || {}) };

    if (status) {
      updatedAttendance[dateKey] = status;
    } else {
      delete updatedAttendance[dateKey];
    }

    // Optimistic update
    setPatient({ ...patient, attendance: updatedAttendance });

    try {
      await updatePatient(id, { attendance: updatedAttendance });
    } catch (error) {
      console.error("Failed to update attendance", error);
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
      loadPatientData();
    }
  };

  // Open create visit dialog
  const openAddVisit = () => {
    setEditingVisit(null);
    setVisitForm({
      visitDate: new Date().toISOString().slice(0, 10),
      chiefComplaint: "",
      painSeverity: "",
      visitNotes: "",
    });
    setObservationForm({
      diagnosis: "",
      examinationFindings: "",
      warningsAndPrecautions: "",
      treatmentPlan: "",
    });
    setMriFinding("");
    setXrayFinding("");
    setExerciseProtocol("");
    setVisitDialogOpen(true);
  };

  // Visit edit/delete handlers
  const openEditVisit = (v: Visit) => {
    setEditingVisit(v);
    setVisitForm({
      visitDate: new Date(v.visitDate).toISOString().slice(0, 10),
      chiefComplaint: v.chiefComplaint || "",
      painSeverity: (v.painSeverity ?? "").toString(),
      visitNotes: v.visitNotes || "",
    });
    // Prefill diagnosis / MRI / X-ray / precautions / Rx / exercise
    const obs = observations.find((o) => o.visitId === v.id) || null;
    if (obs) {
      setObservationForm({
        diagnosis: obs.diagnosis || "",
        examinationFindings: "",
        warningsAndPrecautions: obs.warningsAndPrecautions || "",
        treatmentPlan: obs.treatmentPlan || "",
      });
      // Parse findings into MRI/X-ray and other
      const findings = obs.examinationFindings || "";
      let mri = "";
      let xray = "";
      const rest: string[] = [];
      findings.split("\n").forEach((line) => {
        const t = line.trim();
        if (/^MRI\s*:/.test(t)) mri = t.replace(/^MRI\s*:\s*/i, "");
        else if (/^X-?ray\s*:/.test(t)) xray = t.replace(/^X-?ray\s*:\s*/i, "");
        else if (t) rest.push(t);
      });
      setMriFinding(mri);
      setXrayFinding(xray);
      // Put remaining findings back into observationForm.examinationFindings
      setObservationForm((prev) => ({
        ...prev,
        examinationFindings: rest.join("\n"),
      }));
    } else {
      setObservationForm({
        diagnosis: "",
        examinationFindings: "",
        warningsAndPrecautions: "",
        treatmentPlan: "",
      });
      setMriFinding("");
      setXrayFinding("");
    }
    const ex = exercisePlans.find((e) => e.visitId === v.id) || null;
    setExerciseProtocol(ex?.exercises?.[0]?.name || "");
    setVisitDialogOpen(true);
  };

  const saveVisit = async () => {
    try {
      if (editingVisit) {
        const updates: any = {
          visitDate: new Date(visitForm.visitDate).getTime(),
          chiefComplaint: visitForm.chiefComplaint,
        };
        if (visitForm.painSeverity !== "")
          updates.painSeverity = Number(visitForm.painSeverity);
        if (visitForm.visitNotes) updates.visitNotes = visitForm.visitNotes;
        await updateVisit(editingVisit.id, updates);
        // Upsert Observation and Exercise for this visit
        const combinedFindings = [
          mriFinding ? `MRI: ${mriFinding}` : "",
          xrayFinding ? `X-ray: ${xrayFinding}` : "",
          observationForm.examinationFindings || "",
        ]
          .filter(Boolean)
          .join("\n");
        const existingObs =
          observations.find((o) => o.visitId === editingVisit.id) || null;
        try {
          if (
            observationForm.diagnosis ||
            combinedFindings ||
            observationForm.warningsAndPrecautions ||
            observationForm.treatmentPlan
          ) {
            const obsPayload: any = {
              diagnosis: observationForm.diagnosis || undefined,
              examinationFindings: combinedFindings || undefined,
              warningsAndPrecautions:
                observationForm.warningsAndPrecautions || undefined,
              treatmentPlan: observationForm.treatmentPlan || undefined,
              updatedAt: Date.now(),
            };
            if (existingObs) {
              await updateDoctorObservation(existingObs.id, obsPayload);
            } else {
              await createDoctorObservation({
                visitId: editingVisit.id,
                patientId: id!,
                doctorId: user!.uid,
                doctorName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...obsPayload,
              } as any);
            }
          }
        } catch (e) {
          console.warn("Upsert diagnosis failed", e);
        }
        try {
          const existingPlan =
            exercisePlans.find((p) => p.visitId === editingVisit.id) || null;
          const trimmed = exerciseProtocol.trim();
          if (trimmed) {
            if (existingPlan) {
              // Shallow update: replace first exercise name
              const updated = {
                ...existingPlan,
                exercises: [...(existingPlan.exercises || [])],
              };
              if (updated.exercises.length)
                updated.exercises[0] = {
                  ...updated.exercises[0],
                  name: trimmed,
                };
              else
                updated.exercises = [
                  {
                    name: trimmed,
                    repetitions: "-",
                    sets: "-",
                    frequency: "-",
                    duration: "-",
                  },
                ];
              // Use createExercisePlan not suitable; we would need an updateExercisePlan, fallback by creating new entry
              await createExercisePlan({
                patientId: id!,
                patientName: patient!.fullName,
                visitId: editingVisit.id,
                exercises: updated.exercises,
                prescribedBy: user!.uid,
                prescribedByName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              } as any);
            } else {
              await createExercisePlan({
                patientId: id!,
                patientName: patient!.fullName,
                visitId: editingVisit.id,
                exercises: [
                  {
                    name: trimmed,
                    repetitions: "-",
                    sets: "-",
                    frequency: "-",
                    duration: "-",
                  },
                ],
                prescribedBy: user!.uid,
                prescribedByName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              } as any);
            }
          }
        } catch (e) {
          console.warn("Upsert exercise plan failed", e);
        }
        // Create a fresh CaseNote capturing the latest summary for Patients list
        try {
          // Keep only one latest CaseNote per patient: purge existing
          const existingNotes = await getPatientCaseNotes(id!);
          await Promise.all(existingNotes.map((n) => deleteCaseNote(n.id)));
          await createCaseNote({
            patientId: id!,
            patientName: patient!.fullName,
            date: new Date(visitForm.visitDate).getTime(),
            complaint: visitForm.chiefComplaint || "",
            diagnosis: observationForm.diagnosis || "",
            mriFinding: mriFinding || "",
            xrayFinding: xrayFinding || "",
            precautions: observationForm.warningsAndPrecautions || "",
            rxPlan: observationForm.treatmentPlan || "",
            exerciseProtocol: exerciseProtocol || "",
            createdBy: user!.uid,
            createdByName: user!.name || user!.email,
            createdAt: Date.now(),
            updatedBy: user!.uid,
            updatedByName: user!.name || user!.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote on edit failed", e);
        }
        toast({ title: "Updated", description: "Visit updated successfully" });
      } else {
        if (!id || !user || !patient) return;
        // 1) Create Visit
        const visitPayload: any = {
          patientId: id,
          patientName: patient.fullName,
          visitDate: new Date(visitForm.visitDate).getTime(),
          chiefComplaint: visitForm.chiefComplaint,
          attendingStaff: user.uid,
          attendingStaffName: user.name || user.email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (visitForm.painSeverity !== "")
          visitPayload.painSeverity = Number(visitForm.painSeverity);
        if (visitForm.visitNotes)
          visitPayload.visitNotes = visitForm.visitNotes;
        const visitId = await createVisit(visitPayload);
        // 2) Create Observation (Diagnosis & Plan)
        const combinedFindings = [
          mriFinding ? `MRI: ${mriFinding}` : "",
          xrayFinding ? `X-ray: ${xrayFinding}` : "",
          observationForm.examinationFindings || "",
        ]
          .filter(Boolean)
          .join("\n");
        if (
          observationForm.diagnosis ||
          combinedFindings ||
          observationForm.warningsAndPrecautions ||
          observationForm.treatmentPlan
        ) {
          try {
            const obsPayload: any = {
              visitId,
              patientId: id,
              doctorId: user.uid,
              doctorName: user.name || user.email,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            if (observationForm.diagnosis)
              obsPayload.diagnosis = observationForm.diagnosis;
            if (combinedFindings)
              obsPayload.examinationFindings = combinedFindings;
            if (observationForm.warningsAndPrecautions)
              obsPayload.warningsAndPrecautions =
                observationForm.warningsAndPrecautions;
            if (observationForm.treatmentPlan)
              obsPayload.treatmentPlan = observationForm.treatmentPlan;
            await createDoctorObservation(obsPayload);
          } catch (obsErr) {
            console.warn(
              "createDoctorObservation failed, visit created",
              obsErr,
            );
            toast({
              title: "Saved with warnings",
              description:
                "Visit saved, but diagnosis could not be saved due to permissions.",
              variant: "default",
            });
          }
        }
        // 3) Create Exercise Protocol (as a simple plan with one line)
        if (exerciseProtocol.trim()) {
          try {
            const planPayload: any = {
              patientId: id,
              patientName: patient.fullName,
              visitId,
              exercises: [
                {
                  name: exerciseProtocol.trim(),
                  repetitions: "-",
                  sets: "-",
                  frequency: "-",
                  duration: "-",
                },
              ],
              prescribedBy: user.uid,
              prescribedByName: user.name || user.email,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await createExercisePlan(planPayload);
          } catch (planErr) {
            console.warn("createExercisePlan failed, visit created", planErr);
            toast({
              title: "Saved with warnings",
              description:
                "Visit saved, but exercise protocol could not be saved due to permissions.",
              variant: "default",
            });
          }
        }
        // 4) Create unified CaseNote for Patients list
        try {
          // Keep only one latest CaseNote per patient: purge existing
          const existingNotes = await getPatientCaseNotes(id);
          await Promise.all(existingNotes.map((n) => deleteCaseNote(n.id)));
          await createCaseNote({
            patientId: id,
            patientName: patient.fullName,
            date: new Date(visitForm.visitDate).getTime(),
            complaint: visitForm.chiefComplaint || "",
            diagnosis: observationForm.diagnosis || "",
            mriFinding: mriFinding || "",
            xrayFinding: xrayFinding || "",
            precautions: observationForm.warningsAndPrecautions || "",
            rxPlan: observationForm.treatmentPlan || "",
            exerciseProtocol: exerciseProtocol || "",
            createdBy: user.uid,
            createdByName: user.name || user.email,
            createdAt: Date.now(),
            updatedBy: user.uid,
            updatedByName: user.name || user.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote failed", e);
        }
        toast({ title: "Added", description: "Visit added successfully" });
      }
      setVisitDialogOpen(false);
      setEditingVisit(null);
      await loadPatientData();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save visit",
        variant: "destructive",
      });
    }
  };

  const removeVisit = async (visitId: string) => {
    try {
      await deleteVisit(visitId);
      // After deletion, compute latest remaining summary and publish a CaseNote
      // Reload minimal data fresh to ensure we reflect backend state
      const remainingVisits = await getPatientVisits(id!);
      const remainingObs = await getPatientDoctorObservations(id!);
      // Pick latest visit by visitDate
      let complaint = "";
      let diagnosis = "";
      let rxPlan = "";
      let dateTs = Date.now();
      if (remainingVisits.length) {
        const latestVisit = [...remainingVisits].sort(
          (a, b) => b.visitDate - a.visitDate,
        )[0];
        complaint = latestVisit.chiefComplaint || "";
        dateTs = latestVisit.visitDate;
        const obs =
          remainingObs.find((o) => o.visitId === latestVisit.id) || null;
        if (obs) {
          diagnosis = obs.diagnosis || "";
          rxPlan = obs.treatmentPlan || "";
        }
      }
      if (patient && user) {
        try {
          // Remove existing notes for patient so only latest remains
          const existingNotes = await getPatientCaseNotes(id!);
          await Promise.all(existingNotes.map((n) => deleteCaseNote(n.id)));
          await createCaseNote({
            patientId: id!,
            patientName: patient.fullName,
            date: dateTs,
            complaint,
            diagnosis,
            rxPlan,
            createdBy: user.uid,
            createdByName: user.name || user.email,
            createdAt: Date.now(),
            updatedBy: user.uid,
            updatedByName: user.name || user.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote after delete failed", e);
        }
      }
      await loadPatientData();
      toast({ title: "Deleted", description: "Visit deleted" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete visit",
        variant: "destructive",
      });
    }
  };

  // Observation edit/delete handlers
  const openEditObservation = (o: DoctorObservation) => {
    setEditingObservation(o);
    setObservationForm({
      diagnosis: o.diagnosis || "",
      examinationFindings: o.examinationFindings || "",
      warningsAndPrecautions: o.warningsAndPrecautions || "",
      treatmentPlan: o.treatmentPlan || "",
    });
    setObservationDialogOpen(true);
  };

  const saveObservation = async () => {
    if (!editingObservation) return;
    try {
      await updateDoctorObservation(editingObservation.id, {
        diagnosis: observationForm.diagnosis || undefined,
        examinationFindings: observationForm.examinationFindings || undefined,
        warningsAndPrecautions:
          observationForm.warningsAndPrecautions || undefined,
        treatmentPlan: observationForm.treatmentPlan || undefined,
      });
      setObservationDialogOpen(false);
      setEditingObservation(null);
      await loadPatientData();
      toast({ title: "Updated", description: "Diagnosis & Plan updated" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update diagnosis & plan",
        variant: "destructive",
      });
    }
  };

  const removeObservation = async (obsId: string) => {
    try {
      await deleteDoctorObservation(obsId);
      await loadPatientData();
      toast({ title: "Deleted", description: "Diagnosis & Plan deleted" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete diagnosis & plan",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deletePatient(id);
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      navigate("/patients");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Patient not found</h2>
        <Button onClick={() => navigate("/patients")}>Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/patients")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.fullName}</h1>
            <p className="text-muted-foreground mt-1">Patient Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={openAddVisit}>
            <Plus className="w-4 h-4 mr-2" />
            Add Visit
          </Button>
          {canDeletePatient() && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar 
            attendance={patient?.attendance} 
            onAttendanceChange={handleAttendanceChange} 
          />
        </CardContent>
      </Card>

      {/* Unified newest-first timeline (visit-wise cards) */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Build latest observation/exercise per visit
            const obsByVisit: Record<string, DoctorObservation> = {};
            observations.forEach((o) => {
              if (!obsByVisit[o.visitId]) obsByVisit[o.visitId] = o;
            });
            const exByVisit: Record<string, ExercisePlan> = {};
            exercisePlans.forEach((ex) => {
              if (!exByVisit[ex.visitId]) exByVisit[ex.visitId] = ex;
            });

            const items = [...visits].sort((a, b) => b.visitDate - a.visitDate);
            if (!items.length) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <p>
                    No records yet. Start by adding a visit, diagnosis or
                    exercises.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {items.map((v) => {
                  const o = obsByVisit[v.id];
                  const ex = exByVisit[v.id];
                  return (
                    <div key={v.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div>
                            <div className="font-semibold">📌 New case</div>
                            <div className="text-sm text-muted-foreground">
                              🗓️{" "}
                              {new Date(v.visitDate).toLocaleDateString(
                                "en-GB",
                              )}{" "}
                              • by {v.attendingStaffName}
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">🪪 Name:</span>{" "}
                              {patient.fullName}
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="font-medium">📒 Complaint:</span>{" "}
                              {v.chiefComplaint}
                            </div>
                            <div className="mt-2">
                              {o?.diagnosis && (
                                <div className="text-sm">
                                  <span className="font-medium">
                                    📝 My diagnosis:
                                  </span>{" "}
                                  {o.diagnosis}
                                </div>
                              )}
                              {/* Parse MRI/X-ray from findings, always render both lines */}
                              {(() => {
                                const findings = o?.examinationFindings || "";
                                let mriText = "";
                                let xrayText = "";
                                const otherLines: string[] = [];
                                findings.split("\n").forEach((line) => {
                                  const t = line.trim();
                                  if (/^MRI\s*:/.test(t))
                                    mriText = t.replace(/^MRI\s*:\s*/i, "");
                                  else if (/^X-?ray\s*:/.test(t))
                                    xrayText = t.replace(/^X-?ray\s*:\s*/i, "");
                                  else if (t) otherLines.push(t);
                                });
                                return (
                                  <div className="mt-1 text-sm">
                                    <div>▫️MRI Finding: {mriText}</div>
                                    <div>▫️ X-ray finding: {xrayText}</div>
                                    {otherLines.map((line, i) => (
                                      <div key={i}>▫️ {line}</div>
                                    ))}
                                  </div>
                                );
                              })()}
                              {o?.warningsAndPrecautions && (
                                <div className="mt-1 text-sm">
                                  🛑 Precautions: {o.warningsAndPrecautions}
                                </div>
                              )}
                              {o?.treatmentPlan && (
                                <div className="mt-1 text-sm">
                                  ✳️ Rx plan: {o.treatmentPlan}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="text-sm">
                                ❇️ Exercise protocol:{" "}
                                {ex?.exercises?.[0]?.name || ""}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditVisit(v)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeVisit(v.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: Name | Age / Gender */}
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Age / Gender</p>
                  <p className="font-medium">
                    {patient.age ? `${patient.age} years` : "N/A"}
                    {patient.gender && ` • ${patient.gender}`}
                  </p>
                </div>
              </div>

              {/* Row 2: Medical History | Complaint */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Medical History
                </p>
                <p className="text-sm">{patient.medicalHistory || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Complaint</p>
                <p className="text-sm">{patient.complaint || "—"}</p>
              </div>

              {/* Row 3: Investigation | My diagnosis */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Investigation
                </p>
                <p className="text-sm">{patient.investigation || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  My diagnosis
                </p>
                <p className="text-sm">{patient.diagnosis || "—"}</p>
              </div>

              {/* Row 4: Precautions | Treatment Plan */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Precautions
                </p>
                <p className="text-sm">{patient.precautions || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Treatment Plan
                </p>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Electro therapy:</span>{" "}
                    {patient.treatmentPlan?.electroTherapy?.length
                      ? patient.treatmentPlan.electroTherapy.join(", ")
                      : "—"}
                  </div>
                  <div>
                    <span className="font-medium">Exercise therapy:</span>{" "}
                    {patient.treatmentPlan?.exerciseTherapy?.length
                      ? patient.treatmentPlan.exerciseTherapy.join(", ")
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t space-y-1">
              <p className="text-xs text-muted-foreground">
                Added by {patient.createdByName} on{" "}
                {new Date(patient.createdAt).toLocaleDateString("en-GB")}
              </p>
              {patient.updatedByName && patient.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated by {patient.updatedByName} on{" "}
                  {new Date(patient.updatedAt).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {false && (
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="visits" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visits">
                    Visits ({visits.length})
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions">
                    Prescriptions ({prescriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="exercises">
                    Exercises ({exercisePlans.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visits" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Visit History</h3>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/patients/${id}/visits/new`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Visit
                    </Button>
                  </div>
                  {visits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No visits recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visits.map((visit) => (
                        <Card
                          key={visit.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() =>
                            navigate(`/patients/${id}/visits/${visit.id}`)
                          }
                        >
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">
                                {visit.chiefComplaint}
                              </h4>
                              <Badge variant="outline">
                                {new Date(visit.visitDate).toLocaleDateString()}
                              </Badge>
                            </div>
                            {visit.painSeverity && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Pain Level: {visit.painSeverity}/10
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Attended by {visit.attendingStaffName}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Prescriptions</h3>
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No prescriptions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-3">
                              <Badge variant="outline">
                                {new Date(
                                  prescription.createdAt,
                                ).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {prescription.medicines.map((medicine, idx) => (
                                <div
                                  key={idx}
                                  className="border-l-2 border-primary pl-3"
                                >
                                  <p className="font-semibold">
                                    {medicine.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {medicine.dosage} • {medicine.frequency} •{" "}
                                    {medicine.duration}
                                  </p>
                                  {medicine.instructions && (
                                    <p className="text-sm text-muted-foreground">
                                      {medicine.instructions}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                              Prescribed by {prescription.prescribedByName}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="exercises" className="space-y-4 mt-4">
                  <h3 className="font-semibold">Exercise Plans</h3>
                  {exercisePlans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No exercise plans yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exercisePlans.map((plan) => (
                        <Card key={plan.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-3">
                              <Badge variant="outline">
                                {new Date(plan.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {plan.exercises.map((exercise, idx) => (
                                <div
                                  key={idx}
                                  className="border-l-2 border-chart-2 pl-3"
                                >
                                  <p className="font-semibold">
                                    {exercise.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.sets} sets ×{" "}
                                    {exercise.repetitions} reps •{" "}
                                    {exercise.frequency} • {exercise.duration}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                              Prescribed by {plan.prescribedByName}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient.fullName}'s record and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visit Edit Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingVisit ? "Edit Visit" : "Add Visit"}
            </DialogTitle>
          </DialogHeader>
          <div
            className="grid gap-4 py-2 overflow-y-auto pr-2"
            style={{ maxHeight: "65vh" }}
          >
            <div className="grid gap-2">
              <Label htmlFor="vdate">Date</Label>
              <Input
                id="vdate"
                type="date"
                value={visitForm.visitDate}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visitDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>📒 Complain</Label>
              <Input
                value={visitForm.chiefComplaint}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, chiefComplaint: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Pain Severity (0-10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={visitForm.painSeverity}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, painSeverity: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={visitForm.visitNotes}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visitNotes: e.target.value })
                }
              />
            </div>
            <div className="pt-2 border-t" />
            <div className="grid gap-2">
              <Label>📝 My diagnosis</Label>
              <Textarea
                value={observationForm.diagnosis}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>▫️MRI Finding</Label>
              <Textarea
                value={mriFinding}
                onChange={(e) => setMriFinding(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>▫️ X-ray finding</Label>
              <Textarea
                value={xrayFinding}
                onChange={(e) => setXrayFinding(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>🛑 Precautions</Label>
              <Textarea
                value={observationForm.warningsAndPrecautions}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    warningsAndPrecautions: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>✳️ Rx plan</Label>
              <Textarea
                value={observationForm.treatmentPlan}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    treatmentPlan: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>❇️ Exercise protocol</Label>
              <Textarea
                value={exerciseProtocol}
                onChange={(e) => setExerciseProtocol(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVisit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Observation Edit Dialog */}
      <Dialog
        open={observationDialogOpen}
        onOpenChange={setObservationDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Diagnosis & Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>My diagnosis</Label>
              <Textarea
                value={observationForm.diagnosis}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Findings</Label>
              <Textarea
                value={observationForm.examinationFindings}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    examinationFindings: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Precautions</Label>
              <Textarea
                value={observationForm.warningsAndPrecautions}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    warningsAndPrecautions: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Rx plan</Label>
              <Textarea
                value={observationForm.treatmentPlan}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    treatmentPlan: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveObservation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
