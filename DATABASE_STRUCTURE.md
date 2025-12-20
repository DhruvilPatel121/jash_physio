# Firebase Database Structure

This document describes the complete database structure for the Jash Physiotherapy Patient Management Application.

## Database Schema

```
jash-physiotherapy-db/
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── name: string
│       ├── role: "doctor" | "staff" | "admin"
│       └── createdAt: number (timestamp)
│
├── patients/
│   └── {patientId}/
│       ├── id: string
│       ├── fullName: string (required)
│       ├── phoneNumber: string (required)
│       ├── email: string (optional)
│       ├── address: string (optional)
│       ├── age: number (optional)
│       ├── dateOfBirth: string (optional)
│       ├── gender: "male" | "female" | "other" (optional)
│       ├── emergencyContact: string (optional)
│       ├── medicalHistory: string (optional)
│       ├── currentMedications: string (optional)
│       ├── createdBy: string (userId)
│       ├── createdByName: string
│       ├── createdAt: number (timestamp)
│       └── updatedAt: number (timestamp)
│
├── visits/
│   └── {visitId}/
│       ├── id: string
│       ├── patientId: string
│       ├── patientName: string
│       ├── visitDate: number (timestamp)
│       ├── chiefComplaint: string (required)
│       ├── durationOfProblem: string (optional)
│       ├── previousTreatment: string (optional)
│       ├── painSeverity: number (1-10, optional)
│       ├── attendingStaff: string (userId)
│       ├── attendingStaffName: string
│       ├── visitNotes: string (optional)
│       ├── createdAt: number (timestamp)
│       └── updatedAt: number (timestamp)
│
├── doctorObservations/
│   └── {observationId}/
│       ├── id: string
│       ├── visitId: string
│       ├── patientId: string
│       ├── examinationFindings: string (optional)
│       ├── diagnosis: string (optional)
│       ├── treatmentPlan: string (optional)
│       ├── estimatedRecoveryTime: string (optional)
│       ├── warningsAndPrecautions: string (optional)
│       ├── doctorNotes: string (optional)
│       ├── doctorId: string (userId)
│       ├── doctorName: string
│       ├── createdAt: number (timestamp)
│       └── updatedAt: number (timestamp)
│
├── prescriptions/
│   └── {prescriptionId}/
│       ├── id: string
│       ├── patientId: string
│       ├── patientName: string
│       ├── visitId: string
│       ├── medicines: array[
│       │   ├── name: string
│       │   ├── dosage: string
│       │   ├── frequency: string
│       │   ├── duration: string
│       │   └── instructions: string (optional)
│       │   ]
│       ├── prescribedBy: string (userId)
│       ├── prescribedByName: string
│       ├── createdAt: number (timestamp)
│       └── updatedAt: number (timestamp)
│
└── exercisePlans/
    └── {exercisePlanId}/
        ├── id: string
        ├── patientId: string
        ├── patientName: string
        ├── visitId: string
        ├── exercises: array[
        │   ├── name: string
        │   ├── repetitions: string
        │   ├── sets: string
        │   ├── frequency: string
        │   └── duration: string
        │   ]
        ├── prescribedBy: string (userId)
        ├── prescribedByName: string
        ├── createdAt: number (timestamp)
        └── updatedAt: number (timestamp)
```

## Data Relationships

### One-to-Many Relationships

1. **User → Patients**: One user can create many patients
   - Link: `patients.createdBy` → `users.uid`

2. **Patient → Visits**: One patient can have many visits
   - Link: `visits.patientId` → `patients.id`

3. **Patient → Prescriptions**: One patient can have many prescriptions
   - Link: `prescriptions.patientId` → `patients.id`

4. **Patient → Exercise Plans**: One patient can have many exercise plans
   - Link: `exercisePlans.patientId` → `patients.id`

### One-to-One Relationships

1. **Visit → Doctor Observation**: One visit can have one doctor observation
   - Link: `doctorObservations.visitId` → `visits.id`

2. **Visit → Prescription**: One visit can have one prescription (but a patient can have multiple prescriptions from different visits)
   - Link: `prescriptions.visitId` → `visits.id`

3. **Visit → Exercise Plan**: One visit can have one exercise plan (but a patient can have multiple plans from different visits)
   - Link: `exercisePlans.visitId` → `visits.id`

## Sample Data

### Sample User
```json
{
  "users": {
    "abc123xyz": {
      "uid": "abc123xyz",
      "email": "doctor@jash.com",
      "name": "Dr. Jash Patel",
      "role": "doctor",
      "createdAt": 1703001600000
    }
  }
}
```

### Sample Patient
```json
{
  "patients": {
    "patient001": {
      "id": "patient001",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "email": "john.doe@example.com",
      "address": "123 Main St, City, State 12345",
      "age": 45,
      "dateOfBirth": "1979-05-15",
      "gender": "male",
      "emergencyContact": "+1234567891",
      "medicalHistory": "Previous back surgery in 2020",
      "currentMedications": "Ibuprofen 400mg as needed",
      "createdBy": "abc123xyz",
      "createdByName": "Dr. Jash Patel",
      "createdAt": 1703088000000,
      "updatedAt": 1703088000000
    }
  }
}
```

### Sample Visit
```json
{
  "visits": {
    "visit001": {
      "id": "visit001",
      "patientId": "patient001",
      "patientName": "John Doe",
      "visitDate": 1703174400000,
      "chiefComplaint": "Lower back pain radiating to left leg",
      "durationOfProblem": "2 weeks",
      "previousTreatment": "Rest and over-the-counter pain medication",
      "painSeverity": 7,
      "attendingStaff": "abc123xyz",
      "attendingStaffName": "Dr. Jash Patel",
      "visitNotes": "Patient reports pain worsens with prolonged sitting",
      "createdAt": 1703174400000,
      "updatedAt": 1703174400000
    }
  }
}
```

### Sample Doctor Observation
```json
{
  "doctorObservations": {
    "obs001": {
      "id": "obs001",
      "visitId": "visit001",
      "patientId": "patient001",
      "examinationFindings": "Reduced range of motion in lumbar spine. Positive straight leg raise test on left side.",
      "diagnosis": "Lumbar radiculopathy, likely L5-S1 disc involvement",
      "treatmentPlan": "Physical therapy 3x per week for 4 weeks. Manual therapy and therapeutic exercises.",
      "estimatedRecoveryTime": "4-6 weeks with consistent therapy",
      "warningsAndPrecautions": "Avoid heavy lifting. Stop exercises if pain increases significantly.",
      "doctorNotes": "Patient motivated and compliant. Good prognosis.",
      "doctorId": "abc123xyz",
      "doctorName": "Dr. Jash Patel",
      "createdAt": 1703174400000,
      "updatedAt": 1703174400000
    }
  }
}
```

### Sample Prescription
```json
{
  "prescriptions": {
    "rx001": {
      "id": "rx001",
      "patientId": "patient001",
      "patientName": "John Doe",
      "visitId": "visit001",
      "medicines": [
        {
          "name": "Ibuprofen",
          "dosage": "400mg",
          "frequency": "3 times daily",
          "duration": "7 days",
          "instructions": "Take with food"
        },
        {
          "name": "Muscle Relaxant",
          "dosage": "10mg",
          "frequency": "Once at bedtime",
          "duration": "5 days",
          "instructions": "May cause drowsiness"
        }
      ],
      "prescribedBy": "abc123xyz",
      "prescribedByName": "Dr. Jash Patel",
      "createdAt": 1703174400000,
      "updatedAt": 1703174400000
    }
  }
}
```

### Sample Exercise Plan
```json
{
  "exercisePlans": {
    "ex001": {
      "id": "ex001",
      "patientId": "patient001",
      "patientName": "John Doe",
      "visitId": "visit001",
      "exercises": [
        {
          "name": "Pelvic Tilts",
          "repetitions": "10-15",
          "sets": "3",
          "frequency": "2 times daily",
          "duration": "4 weeks"
        },
        {
          "name": "Knee to Chest Stretch",
          "repetitions": "Hold 30 seconds",
          "sets": "3 each side",
          "frequency": "2 times daily",
          "duration": "4 weeks"
        },
        {
          "name": "Cat-Cow Stretch",
          "repetitions": "10",
          "sets": "2",
          "frequency": "Daily",
          "duration": "4 weeks"
        }
      ],
      "prescribedBy": "abc123xyz",
      "prescribedByName": "Dr. Jash Patel",
      "createdAt": 1703174400000,
      "updatedAt": 1703174400000
    }
  }
}
```

## Indexes

For optimal query performance, the following indexes are configured in the security rules:

- **patients**: `fullName`, `phoneNumber`, `createdAt`
- **visits**: `patientId`, `visitDate`
- **doctorObservations**: `visitId`, `patientId`
- **prescriptions**: `patientId`, `visitId`
- **exercisePlans**: `patientId`, `visitId`

## Data Validation Rules

### Required Fields

**Users:**
- uid, email, name, role, createdAt

**Patients:**
- id, fullName, phoneNumber, createdBy, createdByName, createdAt, updatedAt

**Visits:**
- id, patientId, patientName, visitDate, chiefComplaint, attendingStaff, attendingStaffName, createdAt, updatedAt

**Doctor Observations:**
- id, visitId, patientId, doctorId, doctorName, createdAt, updatedAt

**Prescriptions:**
- id, patientId, patientName, visitId, medicines (array with at least one item), prescribedBy, prescribedByName, createdAt, updatedAt

**Exercise Plans:**
- id, patientId, patientName, visitId, exercises (array with at least one item), prescribedBy, prescribedByName, createdAt, updatedAt

### Field Constraints

- **role**: Must be one of: "doctor", "staff", "admin"
- **gender**: Must be one of: "male", "female", "other"
- **painSeverity**: Must be between 1 and 10
- **timestamps**: Must be valid Unix timestamps (milliseconds)
- **email**: Must be valid email format
- **phoneNumber**: Should include country code

## Backup and Export

### Manual Backup
1. Go to Firebase Console → Realtime Database
2. Click the three dots menu → Export JSON
3. Save the JSON file securely

### Automated Backup
Consider setting up automated backups using:
- Firebase Admin SDK
- Cloud Functions scheduled tasks
- Third-party backup services

## Data Migration

If you need to migrate data:

1. Export data from Firebase Console
2. Transform data structure if needed
3. Import using Firebase Admin SDK or Console

Example import script structure:
```javascript
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.database();
const data = require('./backup.json');

db.ref('/').set(data)
  .then(() => console.log('Import successful'))
  .catch(error => console.error('Import failed:', error));
```

## Performance Considerations

1. **Denormalization**: Patient names are stored in visits, prescriptions, and exercise plans to avoid additional lookups
2. **Indexes**: Configured for common query patterns
3. **Shallow Queries**: Use `.shallow=true` parameter when only keys are needed
4. **Pagination**: Implement pagination for large lists using `.limitToFirst()` and `.limitToLast()`
5. **Real-time Listeners**: Unsubscribe from listeners when components unmount

## Security Notes

- User profiles can only be read by the user themselves or authenticated users
- Doctor observations can only be written by users with "doctor" or "admin" role
- All other data requires authentication to read/write
- Implement additional validation in security rules as needed

---

For more information, see the main README.md and FIREBASE_SETUP.md files.
