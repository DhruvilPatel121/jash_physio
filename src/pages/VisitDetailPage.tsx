import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  getVisit, 
  getDoctorObservation,
  createDoctorObservation,
  updateDoctorObservation,
  getPrescription,
  createPrescription,
  getExercisePlan,
  createExercisePlan
} from '@/services/firebase';
import type { Visit, DoctorObservation, Prescription, ExercisePlan, Medicine, Exercise } from '@/types';
import { ArrowLeft, Loader2, Save, Plus, Trash2, Stethoscope, FileText, Activity } from 'lucide-react';

export default function VisitDetailPage() {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [observation, setObservation] = useState<DoctorObservation | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  
  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';

  useEffect(() => {
    if (visitId) {
      loadVisitData();
    }
  }, [visitId]);

  const loadVisitData = async () => {
    try {
      const [visitData, observationData, prescriptionData, exercisePlanData] = await Promise.all([
        getVisit(visitId!),
        getDoctorObservation(visitId!),
        getPrescription(visitId!),
        getExercisePlan(visitId!)
      ]);
      
      setVisit(visitData);
      setObservation(observationData);
      setPrescription(prescriptionData);
      setExercisePlan(exercisePlanData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load visit data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Visit not found</h2>
        <Button onClick={() => navigate(`/patients/${patientId}`)}>Back to Patient</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${patientId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Visit Details</h1>
          <p className="text-muted-foreground mt-1">{visit.patientName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Visit Information</CardTitle>
            <Badge>{new Date(visit.visitDate).toLocaleDateString()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Chief Complaint</p>
            <p className="font-medium">{visit.chiefComplaint}</p>
          </div>
          {visit.durationOfProblem && (
            <div>
              <p className="text-sm text-muted-foreground">Duration of Problem</p>
              <p className="font-medium">{visit.durationOfProblem}</p>
            </div>
          )}
          {visit.previousTreatment && (
            <div>
              <p className="text-sm text-muted-foreground">Previous Treatment</p>
              <p className="font-medium">{visit.previousTreatment}</p>
            </div>
          )}
          {visit.painSeverity && (
            <div>
              <p className="text-sm text-muted-foreground">Pain Severity</p>
              <p className="font-medium">{visit.painSeverity}/10</p>
            </div>
          )}
          {visit.visitNotes && (
            <div>
              <p className="text-sm text-muted-foreground">Visit Notes</p>
              <p className="font-medium">{visit.visitNotes}</p>
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Attended by {visit.attendingStaffName}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="observation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="observation">Doctor Observation</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="observation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Doctor Observation
                </CardTitle>
                {isDoctorOrAdmin && (
                  <DoctorObservationDialog
                    visitId={visitId!}
                    patientId={patientId!}
                    observation={observation}
                    onSave={loadVisitData}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {observation ? (
                <div className="space-y-4">
                  {observation.examinationFindings && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Examination Findings</p>
                      <p>{observation.examinationFindings}</p>
                    </div>
                  )}
                  {observation.diagnosis && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Diagnosis</p>
                      <p>{observation.diagnosis}</p>
                    </div>
                  )}
                  {observation.treatmentPlan && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Treatment Plan</p>
                      <p>{observation.treatmentPlan}</p>
                    </div>
                  )}
                  {observation.estimatedRecoveryTime && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Estimated Recovery Time</p>
                      <p>{observation.estimatedRecoveryTime}</p>
                    </div>
                  )}
                  {observation.warningsAndPrecautions && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Warnings & Precautions</p>
                      <p>{observation.warningsAndPrecautions}</p>
                    </div>
                  )}
                  {observation.doctorNotes && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Doctor Notes</p>
                      <p>{observation.doctorNotes}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      By {observation.doctorName} on {new Date(observation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No doctor observation recorded yet</p>
                  {!isDoctorOrAdmin && (
                    <p className="text-sm mt-2">Only doctors can add observations</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Prescription
                </CardTitle>
                {!prescription && (
                  <PrescriptionDialog
                    visitId={visitId!}
                    patientId={patientId!}
                    patientName={visit.patientName}
                    onSave={loadVisitData}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {prescription ? (
                <div className="space-y-3">
                  {prescription.medicines.map((medicine, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                      <p className="font-semibold">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                      </p>
                      {medicine.instructions && (
                        <p className="text-sm text-muted-foreground mt-1">{medicine.instructions}</p>
                      )}
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Prescribed by {prescription.prescribedByName} on {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No prescription added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Exercise Plan
                </CardTitle>
                {!exercisePlan && (
                  <ExerciseDialog
                    visitId={visitId!}
                    patientId={patientId!}
                    patientName={visit.patientName}
                    onSave={loadVisitData}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {exercisePlan ? (
                <div className="space-y-3">
                  {exercisePlan.exercises.map((exercise, idx) => (
                    <div key={idx} className="border-l-2 border-chart-2 pl-4 py-2">
                      <p className="font-semibold">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} sets × {exercise.repetitions} reps • {exercise.frequency} • {exercise.duration}
                      </p>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Prescribed by {exercisePlan.prescribedByName} on {new Date(exercisePlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No exercise plan added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Doctor Observation Dialog Component
function DoctorObservationDialog({ 
  visitId, 
  patientId, 
  observation, 
  onSave 
}: { 
  visitId: string; 
  patientId: string; 
  observation: DoctorObservation | null; 
  onSave: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    examinationFindings: observation?.examinationFindings || '',
    diagnosis: observation?.diagnosis || '',
    treatmentPlan: observation?.treatmentPlan || '',
    estimatedRecoveryTime: observation?.estimatedRecoveryTime || '',
    warningsAndPrecautions: observation?.warningsAndPrecautions || '',
    doctorNotes: observation?.doctorNotes || ''
  });

  useEffect(() => {
    if (observation) {
      setFormData({
        examinationFindings: observation.examinationFindings || '',
        diagnosis: observation.diagnosis || '',
        treatmentPlan: observation.treatmentPlan || '',
        estimatedRecoveryTime: observation.estimatedRecoveryTime || '',
        warningsAndPrecautions: observation.warningsAndPrecautions || '',
        doctorNotes: observation.doctorNotes || ''
      });
    }
  }, [observation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (observation) {
        await updateDoctorObservation(observation.id, formData);
      } else {
        await createDoctorObservation({
          visitId,
          patientId,
          ...formData,
          doctorId: user.uid,
          doctorName: user.name,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      toast({
        title: 'Success',
        description: 'Doctor observation saved successfully'
      });
      setOpen(false);
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save observation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          {observation ? 'Edit' : 'Add'} Observation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doctor Observation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="examinationFindings">Examination Findings</Label>
            <Textarea
              id="examinationFindings"
              value={formData.examinationFindings}
              onChange={(e) => setFormData({ ...formData, examinationFindings: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatmentPlan">Treatment Plan</Label>
            <Textarea
              id="treatmentPlan"
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedRecoveryTime">Estimated Recovery Time</Label>
            <Input
              id="estimatedRecoveryTime"
              value={formData.estimatedRecoveryTime}
              onChange={(e) => setFormData({ ...formData, estimatedRecoveryTime: e.target.value })}
              placeholder="e.g., 2-3 weeks"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warningsAndPrecautions">Warnings & Precautions</Label>
            <Textarea
              id="warningsAndPrecautions"
              value={formData.warningsAndPrecautions}
              onChange={(e) => setFormData({ ...formData, warningsAndPrecautions: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctorNotes">Doctor Notes</Label>
            <Textarea
              id="doctorNotes"
              value={formData.doctorNotes}
              onChange={(e) => setFormData({ ...formData, doctorNotes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Prescription Dialog Component
function PrescriptionDialog({ 
  visitId, 
  patientId, 
  patientName, 
  onSave 
}: { 
  visitId: string; 
  patientId: string; 
  patientName: string; 
  onSave: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validMedicines = medicines.filter(m => m.name && m.dosage && m.frequency && m.duration);
    if (validMedicines.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one medicine',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await createPrescription({
        visitId,
        patientId,
        patientName,
        medicines: validMedicines,
        prescribedBy: user.uid,
        prescribedByName: user.name,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast({
        title: 'Success',
        description: 'Prescription added successfully'
      });
      setOpen(false);
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add prescription',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {medicines.map((medicine, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Medicine {index + 1}</h4>
                  {medicines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedicine(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Medicine Name *</Label>
                  <Input
                    value={medicine.name}
                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Dosage *</Label>
                    <Input
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Input
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      placeholder="e.g., 2x daily"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Input
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Input
                    value={medicine.instructions}
                    onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    placeholder="e.g., After meals"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addMedicine} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Medicine
          </Button>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Prescription
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Exercise Dialog Component
function ExerciseDialog({ 
  visitId, 
  patientId, 
  patientName, 
  onSave 
}: { 
  visitId: string; 
  patientId: string; 
  patientName: string; 
  onSave: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', repetitions: '', sets: '', frequency: '', duration: '' }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', repetitions: '', sets: '', frequency: '', duration: '' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validExercises = exercises.filter(ex => ex.name && ex.repetitions && ex.sets && ex.frequency && ex.duration);
    if (validExercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one exercise',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await createExercisePlan({
        visitId,
        patientId,
        patientName,
        exercises: validExercises,
        prescribedBy: user.uid,
        prescribedByName: user.name,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast({
        title: 'Success',
        description: 'Exercise plan added successfully'
      });
      setOpen(false);
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add exercise plan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {exercises.map((exercise, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Exercise {index + 1}</h4>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Exercise Name *</Label>
                  <Input
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Repetitions *</Label>
                    <Input
                      value={exercise.repetitions}
                      onChange={(e) => updateExercise(index, 'repetitions', e.target.value)}
                      placeholder="e.g., 10-15"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sets *</Label>
                    <Input
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                      placeholder="e.g., 3"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Input
                      value={exercise.frequency}
                      onChange={(e) => updateExercise(index, 'frequency', e.target.value)}
                      placeholder="e.g., Daily"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration *</Label>
                    <Input
                      value={exercise.duration}
                      onChange={(e) => updateExercise(index, 'duration', e.target.value)}
                      placeholder="e.g., 2 weeks"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addExercise} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Exercise
          </Button>
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Exercise Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
