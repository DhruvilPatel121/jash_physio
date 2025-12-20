import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getPatient, 
  getPatientVisits, 
  getPatientPrescriptions, 
  getPatientExercisePlans,
  deletePatient 
} from '@/services/firebase';
import type { Patient, Visit, Prescription, ExercisePlan } from '@/types';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  Loader2,
  FileText,
  Activity,
  Stethoscope
} from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      const [patientData, visitsData, prescriptionsData, exercisePlansData] = await Promise.all([
        getPatient(id!),
        getPatientVisits(id!),
        getPatientPrescriptions(id!),
        getPatientExercisePlans(id!)
      ]);
      
      setPatient(patientData);
      setVisits(visitsData);
      setPrescriptions(prescriptionsData);
      setExercisePlans(exercisePlansData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patient data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      await deletePatient(id);
      toast({
        title: 'Success',
        description: 'Patient deleted successfully'
      });
      navigate('/patients');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete patient',
        variant: 'destructive'
      });
      setDeleting(false);
    }
  };

  const canDelete = user?.role === 'doctor' || user?.role === 'admin';

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
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.fullName}</h1>
            <p className="text-muted-foreground mt-1">Patient Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/patients/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient.phoneNumber}</p>
              </div>
            </div>
            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email}</p>
                </div>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Age / Gender</p>
                <p className="font-medium">
                  {patient.age ? `${patient.age} years` : 'N/A'} 
                  {patient.gender && ` • ${patient.gender}`}
                </p>
              </div>
            </div>
            {patient.emergencyContact && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{patient.emergencyContact}</p>
                </div>
              </div>
            )}
            {patient.medicalHistory && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Medical History</p>
                <p className="text-sm">{patient.medicalHistory}</p>
              </div>
            )}
            {patient.currentMedications && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Medications</p>
                <p className="text-sm">{patient.currentMedications}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Added by {patient.createdByName} on {new Date(patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="visits" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
                <TabsTrigger value="exercises">Exercises ({exercisePlans.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visits" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Visit History</h3>
                  <Button size="sm" onClick={() => navigate(`/patients/${id}/visits/new`)}>
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
                        onClick={() => navigate(`/patients/${id}/visits/${visit.id}`)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{visit.chiefComplaint}</h4>
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
                              {new Date(prescription.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {prescription.medicines.map((medicine, idx) => (
                              <div key={idx} className="border-l-2 border-primary pl-3">
                                <p className="font-semibold">{medicine.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                                </p>
                                {medicine.instructions && (
                                  <p className="text-sm text-muted-foreground">{medicine.instructions}</p>
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
                              <div key={idx} className="border-l-2 border-chart-2 pl-3">
                                <p className="font-semibold">{exercise.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.repetitions} reps • {exercise.frequency} • {exercise.duration}
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
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient.fullName}'s record and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
