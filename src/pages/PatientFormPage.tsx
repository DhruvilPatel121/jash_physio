import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createPatient, getPatient, updatePatient } from "@/services/firebase";
import type { Patient } from "@/types";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function PatientFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    medicalHistory: "",
    complaint: "",
    investigation: "",
    diagnosis: "",
    precautions: "",
  });

  // Treatment plan toggles + custom text
  const [useElectro, setUseElectro] = useState(false);
  const [useExercise, setUseExercise] = useState(false);
  const [electroText, setElectroText] = useState("");
  const [exerciseText, setExerciseText] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      loadPatient();
    }
  }, [id, isEdit]);

  const loadPatient = async () => {
    try {
      const patient = await getPatient(id!);
      if (patient) {
        setFormData({
          fullName: patient.fullName,
          age: patient.age?.toString() || "",
          gender: patient.gender || "",
          medicalHistory: patient.medicalHistory || "",
          complaint: patient.complaint || "",
          investigation: patient.investigation || "",
          diagnosis: patient.diagnosis || "",
          precautions: patient.precautions || "",
        });
        const et = patient.treatmentPlan?.electroTherapy || [];
        const xt = patient.treatmentPlan?.exerciseTherapy || [];
        setUseElectro(!!et.length);
        setUseExercise(!!xt.length);
        setElectroText(et.length ? et.join(", ") : "");
        setExerciseText(xt.length ? xt.join(", ") : "");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // no-op helper removed (previous multi-select)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      const treatmentPlan: {
        electroTherapy?: string[];
        exerciseTherapy?: string[];
      } = {};
      if (useElectro) {
        treatmentPlan.electroTherapy = electroText.trim()
          ? [electroText.trim()]
          : [""];
      }
      if (useExercise) {
        treatmentPlan.exerciseTherapy = exerciseText.trim()
          ? [exerciseText.trim()]
          : [""];
      }

      const payload: Record<string, any> = {
        fullName: formData.fullName,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        medicalHistory: formData.medicalHistory || null,
        complaint: formData.complaint || null,
        investigation: formData.investigation || null,
        diagnosis: formData.diagnosis || null,
        precautions: formData.precautions || null,
        treatmentPlan:
          Object.keys(treatmentPlan).length > 0 ? treatmentPlan : null,
      };

      if (isEdit && id) {
        await updatePatient(id, {
          ...payload,
          updatedBy: user.uid,
          updatedByName: user.name,
        });
        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
      } else {
        await createPatient({
          ...(payload as any),
          createdBy: user.uid,
          createdByName: user.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Omit<Patient, "id">);
        toast({
          title: "Success",
          description: "Patient added successfully",
        });
      }
      navigate("/patients");
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "add"} patient`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Update patient information" : "Register a new patient"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sex / Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) =>
                  setFormData({ ...formData, medicalHistory: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="complaint">Complain</Label>
                <Textarea
                  id="complaint"
                  value={formData.complaint}
                  onChange={(e) =>
                    setFormData({ ...formData, complaint: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investigation">Investigation</Label>
                <Textarea
                  id="investigation"
                  value={formData.investigation}
                  onChange={(e) =>
                    setFormData({ ...formData, investigation: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">My diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precautions">Precautions</Label>
                <Textarea
                  id="precautions"
                  value={formData.precautions}
                  onChange={(e) =>
                    setFormData({ ...formData, precautions: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div>
                <Label>Treatment plan - Electro therapy</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useElectro}
                      onChange={(e) => setUseElectro(e.target.checked)}
                    />
                    Use Electro therapy
                  </label>
                  {useElectro && (
                    <Textarea
                      value={electroText}
                      onChange={(e) => setElectroText(e.target.value)}
                      placeholder="Write electro therapy details (your own)"
                      rows={3}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label>Treatment plan - Exercise therapy</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useExercise}
                      onChange={(e) => setUseExercise(e.target.checked)}
                    />
                    Use Exercise therapy
                  </label>
                  {useExercise && (
                    <Textarea
                      value={exerciseText}
                      onChange={(e) => setExerciseText(e.target.value)}
                      placeholder="Write exercise therapy details (your own)"
                      rows={3}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/patients")}
              >
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
                    {isEdit ? "Update" : "Save"} Patient
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
