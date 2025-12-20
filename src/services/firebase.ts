import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  query, 
  orderByChild,
  equalTo,
  onValue,
  off
} from 'firebase/database';
import { database } from '@/lib/firebase';
import type { 
  User, 
  Patient, 
  Visit, 
  DoctorObservation, 
  Prescription, 
  ExercisePlan,
  DashboardStats 
} from '@/types';

// User operations
export const createUser = async (uid: string, userData: Omit<User, 'uid'>) => {
  const userRef = ref(database, `users/${uid}`);
  await set(userRef, { uid, ...userData });
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
};

// Patient operations
export const createPatient = async (patientData: Omit<Patient, 'id'>) => {
  const patientsRef = ref(database, 'patients');
  const newPatientRef = push(patientsRef);
  const patientId = newPatientRef.key!;
  await set(newPatientRef, { id: patientId, ...patientData });
  return patientId;
};

export const getPatient = async (patientId: string): Promise<Patient | null> => {
  const patientRef = ref(database, `patients/${patientId}`);
  const snapshot = await get(patientRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllPatients = async (): Promise<Patient[]> => {
  const patientsRef = ref(database, 'patients');
  const snapshot = await get(patientsRef);
  if (!snapshot.exists()) return [];
  
  const patients: Patient[] = [];
  snapshot.forEach((childSnapshot) => {
    patients.push(childSnapshot.val());
  });
  return patients.sort((a, b) => b.createdAt - a.createdAt);
};

export const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
  const patientRef = ref(database, `patients/${patientId}`);
  await update(patientRef, { ...updates, updatedAt: Date.now() });
};

export const deletePatient = async (patientId: string) => {
  const patientRef = ref(database, `patients/${patientId}`);
  await remove(patientRef);
};

export const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
  const patients = await getAllPatients();
  const lowerSearch = searchTerm.toLowerCase();
  return patients.filter(patient => 
    patient.fullName.toLowerCase().includes(lowerSearch) ||
    patient.phoneNumber.includes(searchTerm)
  );
};

// Visit operations
export const createVisit = async (visitData: Omit<Visit, 'id'>) => {
  const visitsRef = ref(database, 'visits');
  const newVisitRef = push(visitsRef);
  const visitId = newVisitRef.key!;
  await set(newVisitRef, { id: visitId, ...visitData });
  return visitId;
};

export const getVisit = async (visitId: string): Promise<Visit | null> => {
  const visitRef = ref(database, `visits/${visitId}`);
  const snapshot = await get(visitRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getPatientVisits = async (patientId: string): Promise<Visit[]> => {
  const visitsRef = ref(database, 'visits');
  const visitsQuery = query(visitsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(visitsQuery);
  
  if (!snapshot.exists()) return [];
  
  const visits: Visit[] = [];
  snapshot.forEach((childSnapshot) => {
    visits.push(childSnapshot.val());
  });
  return visits.sort((a, b) => b.visitDate - a.visitDate);
};

export const getAllVisits = async (): Promise<Visit[]> => {
  const visitsRef = ref(database, 'visits');
  const snapshot = await get(visitsRef);
  if (!snapshot.exists()) return [];
  
  const visits: Visit[] = [];
  snapshot.forEach((childSnapshot) => {
    visits.push(childSnapshot.val());
  });
  return visits.sort((a, b) => b.visitDate - a.visitDate);
};

export const updateVisit = async (visitId: string, updates: Partial<Visit>) => {
  const visitRef = ref(database, `visits/${visitId}`);
  await update(visitRef, { ...updates, updatedAt: Date.now() });
};

export const deleteVisit = async (visitId: string) => {
  const visitRef = ref(database, `visits/${visitId}`);
  await remove(visitRef);
};

// Doctor observation operations
export const createDoctorObservation = async (observationData: Omit<DoctorObservation, 'id'>) => {
  const observationsRef = ref(database, 'doctorObservations');
  const newObservationRef = push(observationsRef);
  const observationId = newObservationRef.key!;
  await set(newObservationRef, { id: observationId, ...observationData });
  return observationId;
};

export const getDoctorObservation = async (visitId: string): Promise<DoctorObservation | null> => {
  const observationsRef = ref(database, 'doctorObservations');
  const observationsQuery = query(observationsRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(observationsQuery);
  
  if (!snapshot.exists()) return null;
  
  let observation: DoctorObservation | null = null;
  snapshot.forEach((childSnapshot) => {
    observation = childSnapshot.val();
  });
  return observation;
};

export const updateDoctorObservation = async (observationId: string, updates: Partial<DoctorObservation>) => {
  const observationRef = ref(database, `doctorObservations/${observationId}`);
  await update(observationRef, { ...updates, updatedAt: Date.now() });
};

// Prescription operations
export const createPrescription = async (prescriptionData: Omit<Prescription, 'id'>) => {
  const prescriptionsRef = ref(database, 'prescriptions');
  const newPrescriptionRef = push(prescriptionsRef);
  const prescriptionId = newPrescriptionRef.key!;
  await set(newPrescriptionRef, { id: prescriptionId, ...prescriptionData });
  return prescriptionId;
};

export const getPrescription = async (visitId: string): Promise<Prescription | null> => {
  const prescriptionsRef = ref(database, 'prescriptions');
  const prescriptionsQuery = query(prescriptionsRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(prescriptionsQuery);
  
  if (!snapshot.exists()) return null;
  
  let prescription: Prescription | null = null;
  snapshot.forEach((childSnapshot) => {
    prescription = childSnapshot.val();
  });
  return prescription;
};

export const getPatientPrescriptions = async (patientId: string): Promise<Prescription[]> => {
  const prescriptionsRef = ref(database, 'prescriptions');
  const prescriptionsQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(prescriptionsQuery);
  
  if (!snapshot.exists()) return [];
  
  const prescriptions: Prescription[] = [];
  snapshot.forEach((childSnapshot) => {
    prescriptions.push(childSnapshot.val());
  });
  return prescriptions.sort((a, b) => b.createdAt - a.createdAt);
};

export const updatePrescription = async (prescriptionId: string, updates: Partial<Prescription>) => {
  const prescriptionRef = ref(database, `prescriptions/${prescriptionId}`);
  await update(prescriptionRef, { ...updates, updatedAt: Date.now() });
};

export const deletePrescription = async (prescriptionId: string) => {
  const prescriptionRef = ref(database, `prescriptions/${prescriptionId}`);
  await remove(prescriptionRef);
};

// Exercise plan operations
export const createExercisePlan = async (exercisePlanData: Omit<ExercisePlan, 'id'>) => {
  const exercisePlansRef = ref(database, 'exercisePlans');
  const newExercisePlanRef = push(exercisePlansRef);
  const exercisePlanId = newExercisePlanRef.key!;
  await set(newExercisePlanRef, { id: exercisePlanId, ...exercisePlanData });
  return exercisePlanId;
};

export const getExercisePlan = async (visitId: string): Promise<ExercisePlan | null> => {
  const exercisePlansRef = ref(database, 'exercisePlans');
  const exercisePlansQuery = query(exercisePlansRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(exercisePlansQuery);
  
  if (!snapshot.exists()) return null;
  
  let exercisePlan: ExercisePlan | null = null;
  snapshot.forEach((childSnapshot) => {
    exercisePlan = childSnapshot.val();
  });
  return exercisePlan;
};

export const getPatientExercisePlans = async (patientId: string): Promise<ExercisePlan[]> => {
  const exercisePlansRef = ref(database, 'exercisePlans');
  const exercisePlansQuery = query(exercisePlansRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(exercisePlansQuery);
  
  if (!snapshot.exists()) return [];
  
  const exercisePlans: ExercisePlan[] = [];
  snapshot.forEach((childSnapshot) => {
    exercisePlans.push(childSnapshot.val());
  });
  return exercisePlans.sort((a, b) => b.createdAt - a.createdAt);
};

export const updateExercisePlan = async (exercisePlanId: string, updates: Partial<ExercisePlan>) => {
  const exercisePlanRef = ref(database, `exercisePlans/${exercisePlanId}`);
  await update(exercisePlanRef, { ...updates, updatedAt: Date.now() });
};

export const deleteExercisePlan = async (exercisePlanId: string) => {
  const exercisePlanRef = ref(database, `exercisePlans/${exercisePlanId}`);
  await remove(exercisePlanRef);
};

// Dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const patients = await getAllPatients();
  const visits = await getAllVisits();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const todayVisits = visits.filter(visit => visit.visitDate >= todayTimestamp);
  
  return {
    totalPatients: patients.length,
    todayVisits: todayVisits.length,
    followUpsDue: 0, // Can be calculated based on visit dates and treatment plans
    pendingPrescriptions: 0 // Can be calculated based on prescription status
  };
};

// Real-time listeners
export const subscribeToPatients = (callback: (patients: Patient[]) => void) => {
  const patientsRef = ref(database, 'patients');
  onValue(patientsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const patients: Patient[] = [];
    snapshot.forEach((childSnapshot) => {
      patients.push(childSnapshot.val());
    });
    callback(patients.sort((a, b) => b.createdAt - a.createdAt));
  });
  
  return () => off(patientsRef);
};

export const subscribeToVisits = (callback: (visits: Visit[]) => void) => {
  const visitsRef = ref(database, 'visits');
  onValue(visitsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const visits: Visit[] = [];
    snapshot.forEach((childSnapshot) => {
      visits.push(childSnapshot.val());
    });
    callback(visits.sort((a, b) => b.visitDate - a.visitDate));
  });
  
  return () => off(visitsRef);
};
