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
  CaseNote,
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
  try {
    console.log(`[deletePatient] Starting deletion for patient: ${patientId}`);

    // Get all related records first
    const [visits, prescriptions, exercisePlans] = await Promise.all([
      getPatientVisits(patientId),
      getPatientPrescriptions(patientId),
      getPatientExercisePlans(patientId)
    ]);

    console.log(`[deletePatient] Found ${visits.length} visits, ${prescriptions.length} prescriptions, ${exercisePlans.length} exercise plans`);

    // Get all visit IDs to delete related observations
    const visitIds = visits.map(v => v.id);

    // Get all doctor observations for these visits
    const observationsRef = ref(database, 'doctorObservations');
    const observationsSnapshot = await get(observationsRef);
    const observationsToDelete: string[] = [];

    if (observationsSnapshot.exists()) {
      observationsSnapshot.forEach((childSnapshot) => {
        const observation = childSnapshot.val();
        if (visitIds.includes(observation.visitId)) {
          observationsToDelete.push(observation.id);
        }
      });
    }

    console.log(`[deletePatient] Found ${observationsToDelete.length} doctor observations to delete`);

    // Delete all related records
    const deletePromises: Promise<void>[] = [];

    // Delete patient
    const patientRef = ref(database, `patients/${patientId}`);
    deletePromises.push(remove(patientRef));

    // Delete all visits
    visits.forEach(visit => {
      const visitRef = ref(database, `visits/${visit.id}`);
      deletePromises.push(remove(visitRef));
    });

    // Delete all doctor observations
    observationsToDelete.forEach(obsId => {
      const obsRef = ref(database, `doctorObservations/${obsId}`);
      deletePromises.push(remove(obsRef));
    });

    // Delete all prescriptions
    prescriptions.forEach(prescription => {
      const prescriptionRef = ref(database, `prescriptions/${prescription.id}`);
      deletePromises.push(remove(prescriptionRef));
    });

    // Delete all exercise plans
    exercisePlans.forEach(plan => {
      const planRef = ref(database, `exercisePlans/${plan.id}`);
      deletePromises.push(remove(planRef));
    });

    // Execute all deletions
    await Promise.all(deletePromises);

    console.log(`[deletePatient] Successfully deleted patient ${patientId} and all related records`);
  } catch (error) {
    console.error(`[deletePatient] Error deleting patient ${patientId}:`, error);
    throw error;
  }
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

// Aggregate getters for list pages and summaries
export const getAllDoctorObservations = async (): Promise<DoctorObservation[]> => {
  const observationsRef = ref(database, 'doctorObservations');
  const snapshot = await get(observationsRef);
  if (!snapshot.exists()) return [];

  const observations: DoctorObservation[] = [];
  snapshot.forEach((childSnapshot) => {
    observations.push(childSnapshot.val());
  });
  return observations.sort((a, b) => b.createdAt - a.createdAt);
};

export const getAllExercisePlans = async (): Promise<ExercisePlan[]> => {
  const exercisePlansRef = ref(database, 'exercisePlans');
  const snapshot = await get(exercisePlansRef);
  if (!snapshot.exists()) return [];

  const plans: ExercisePlan[] = [];
  snapshot.forEach((childSnapshot) => {
    plans.push(childSnapshot.val());
  });
  return plans.sort((a, b) => b.createdAt - a.createdAt);
};

// Patient-scoped observations list
export const getPatientDoctorObservations = async (patientId: string): Promise<DoctorObservation[]> => {
  const observationsRef = ref(database, 'doctorObservations');
  const observationsQuery = query(observationsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(observationsQuery);

  if (!snapshot.exists()) return [];

  const observations: DoctorObservation[] = [];
  snapshot.forEach((childSnapshot) => {
    observations.push(childSnapshot.val());
  });
  return observations.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteDoctorObservation = async (observationId: string) => {
  const obsRef = ref(database, `doctorObservations/${observationId}`);
  await remove(obsRef);
};

// Case Notes (Unified entries)
export const createCaseNote = async (note: Omit<CaseNote, 'id'>) => {
  const notesRef = ref(database, 'caseNotes');
  const newRef = push(notesRef);
  const id = newRef.key!;
  await set(newRef, { id, ...note });
  return id;
};

export const updateCaseNote = async (noteId: string, updates: Partial<CaseNote>) => {
  const noteRef = ref(database, `caseNotes/${noteId}`);
  await update(noteRef, { ...updates, updatedAt: Date.now() });
};

export const deleteCaseNote = async (noteId: string) => {
  const noteRef = ref(database, `caseNotes/${noteId}`);
  await remove(noteRef);
};

export const getAllCaseNotes = async (): Promise<CaseNote[]> => {
  const notesRef = ref(database, 'caseNotes');
  const snapshot = await get(notesRef);
  if (!snapshot.exists()) return [];
  const notes: CaseNote[] = [];
  snapshot.forEach((c) => {
    notes.push(c.val());
  });
  return notes.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);
};

export const getPatientCaseNotes = async (patientId: string): Promise<CaseNote[]> => {
  const notesRef = ref(database, 'caseNotes');
  const qy = query(notesRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(qy);
  if (!snapshot.exists()) return [];
  const notes: CaseNote[] = [];
  snapshot.forEach((c) => {
    notes.push(c.val());
  });
  return notes.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);
};

// Realtime subscription to all case notes (used by Patients page cards)
export const subscribeToCaseNotes = (callback: (notes: CaseNote[]) => void) => {
  const notesRef = ref(database, 'caseNotes');
  const unsubscribe = onValue(notesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const notes: CaseNote[] = [];
    snapshot.forEach((child) => {
      notes.push(child.val());
    });
    notes.sort((a, b) => (b.date - a.date) || (b.createdAt - a.createdAt));
    callback(notes);
  });
  return unsubscribe;
};

// Dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const patients = await getAllPatients();
  const visits = await getAllVisits();
  const prescriptions = await getAllPrescriptions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTimestamp = today.getTime();
  const todayEndTimestamp = todayEnd.getTime();

  const todayVisits = visits.filter(visit =>
    visit.visitDate >= todayTimestamp && visit.visitDate <= todayEndTimestamp
  );

  // Follow-ups due: visits from 7-14 days ago that might need follow-up
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);
  const followUpsDue = visits.filter(visit =>
    visit.visitDate >= sevenDaysAgo.getTime() &&
    visit.visitDate <= fourteenDaysAgo.getTime()
  ).length;

  // Pending prescriptions: prescriptions created today without completion
  const pendingPrescriptions = prescriptions.filter(p => {
    const prescriptionDate = new Date(p.createdAt);
    return prescriptionDate >= today && prescriptionDate <= todayEnd;
  }).length;

  return {
    totalPatients: patients.length,
    todayVisits: todayVisits.length,
    followUpsDue,
    pendingPrescriptions
  };
};

// Get today's visits
export const getTodayVisits = async (): Promise<Visit[]> => {
  const visits = await getAllVisits();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTimestamp = today.getTime();
  const todayEndTimestamp = todayEnd.getTime();

  return visits.filter(visit =>
    visit.visitDate >= todayTimestamp && visit.visitDate <= todayEndTimestamp
  );
};

// Get follow-ups due
export const getFollowUpsDue = async (): Promise<Visit[]> => {
  const visits = await getAllVisits();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

  return visits.filter(visit =>
    visit.visitDate >= sevenDaysAgo.getTime() &&
    visit.visitDate <= fourteenDaysAgo.getTime()
  );
};

// Get all prescriptions
export const getAllPrescriptions = async (): Promise<Prescription[]> => {
  const prescriptionsRef = ref(database, 'prescriptions');
  const snapshot = await get(prescriptionsRef);
  if (!snapshot.exists()) return [];

  const prescriptions: Prescription[] = [];
  snapshot.forEach((childSnapshot) => {
    prescriptions.push(childSnapshot.val());
  });
  return prescriptions.sort((a, b) => b.createdAt - a.createdAt);
};

// Get pending prescriptions
export const getPendingPrescriptions = async (): Promise<Prescription[]> => {
  const prescriptions = await getAllPrescriptions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  return prescriptions.filter(p => {
    const prescriptionDate = new Date(p.createdAt);
    return prescriptionDate >= today && prescriptionDate <= todayEnd;
  });
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
