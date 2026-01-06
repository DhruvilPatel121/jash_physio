import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subscribeToPatients, getAllCaseNotes, subscribeToCaseNotes } from '@/services/firebase';
import type { Patient, CaseNote } from '@/types';
import { Search, Plus, User, Loader2, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadJsPDF = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // If already loaded
      // @ts-ignore
      if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error('jsPDF failed to load'));
      };
      script.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.body.appendChild(script);
    });
  };

  const exportPatientsPdf = async () => {
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 36; // 0.5 inch
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Patients Export', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 16;
    const dateStr = `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`;
    doc.setTextColor(100);
    doc.text(`Generated on ${dateStr} • Total: ${patients.length}`, margin, y);
    doc.setTextColor(0);
    y += 18;

    // Table header
    const colWidths = [pageWidth - margin*2];
    // We will render as a table with fixed columns: Name, Mobile, Email, Address
    const headers = ['Name', 'Mobile', 'Email', 'Address'];
    const widths = [0.26, 0.18, 0.28, 0.28].map(f => (pageWidth - margin*2) * f);
    const xPositions = [margin, margin + widths[0], margin + widths[0] + widths[1], margin + widths[0] + widths[1] + widths[2]];

    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, pageWidth - margin*2, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(headers[0], xPositions[0] + 4, y + 6);
    doc.text(headers[1], xPositions[1] + 4, y + 6);
    doc.text(headers[2], xPositions[2] + 4, y + 6);
    doc.text(headers[3], xPositions[3] + 4, y + 6);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const drawRow = (name: string, mobile: string, email: string, address: string) => {
      const rowHeights = [
        doc.getTextDimensions(doc.splitTextToSize(name, widths[0]-8)).h,
        doc.getTextDimensions(doc.splitTextToSize(mobile, widths[1]-8)).h,
        doc.getTextDimensions(doc.splitTextToSize(email, widths[2]-8)).h,
        doc.getTextDimensions(doc.splitTextToSize(address, widths[3]-8)).h,
      ];
      const rowH = Math.max(...rowHeights) + 10;
      // Page break
      if (y + rowH + margin > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = margin;
        // repeat header
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, y - 12, pageWidth - margin*2, 24, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(headers[0], xPositions[0] + 4, y + 6);
        doc.text(headers[1], xPositions[1] + 4, y + 6);
        doc.text(headers[2], xPositions[2] + 4, y + 6);
        doc.text(headers[3], xPositions[3] + 4, y + 6);
        y += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      // Cell borders
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, y-10, widths[0], rowH);
      doc.rect(xPositions[1], y-10, widths[1], rowH);
      doc.rect(xPositions[2], y-10, widths[2], rowH);
      doc.rect(xPositions[3], y-10, widths[3], rowH);
      // Text
      doc.text(doc.splitTextToSize(name, widths[0]-8) as any, xPositions[0]+4, y);
      doc.text(doc.splitTextToSize(mobile, widths[1]-8) as any, xPositions[1]+4, y);
      doc.text(doc.splitTextToSize(email, widths[2]-8) as any, xPositions[2]+4, y);
      doc.text(doc.splitTextToSize(address, widths[3]-8) as any, xPositions[3]+4, y);
      y += rowH;
    };

    patients.forEach(p => drawRow(
      p.fullName || '',
      p.phoneNumber || '',
      p.email || '',
      p.address || ''
    ));

    doc.save(`patients_${new Date().getTime()}.pdf`);
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
      const term = debouncedSearch.toLowerCase();
      const filtered = patients.filter((patient) => {
        const note = latestCaseNoteByPatient[patient.id];
        const combined = [
          note?.complaint,
          note?.diagnosis,
          note?.mriFinding,
          note?.xrayFinding,
          note?.precautions,
          note?.rxPlan,
          note?.exerciseProtocol
        ].filter(Boolean).join(' ').toLowerCase();
        return (
          patient.fullName.toLowerCase().includes(term) ||
          patient.phoneNumber.includes(debouncedSearch) ||
          (patient.email && patient.email.toLowerCase().includes(term)) ||
          combined.includes(term)
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
          <Button onClick={() => navigate('/patients/new')}>
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
                {searchTerm ? 'Try a different search term' : 'Get started by adding your first patient'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/patients/new')}>
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
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                        {patient.age && (
                          <Badge variant="secondary" className="mt-2">
                            {patient.age} years
                          </Badge>
                        )}
                      </div>
                      {patient.gender && (
                        <Badge variant="outline">
                          {patient.gender}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const note = latestCaseNoteByPatient[patient.id];
                      return (
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">Complaint:</span>{' '}
                            <span className="text-muted-foreground line-clamp-2">{note?.complaint || '—'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">Diagnosis:</span>{' '}
                            <span className="text-muted-foreground line-clamp-2">{note?.diagnosis || '—'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-sky-700">Rx plan:</span>{' '}
                            <span className="text-muted-foreground line-clamp-2">{note?.rxPlan || '—'}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="text-xs text-muted-foreground mt-2">
                      Updated on {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString('en-GB')}
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
