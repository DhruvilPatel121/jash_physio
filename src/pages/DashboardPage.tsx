import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/services/firebase';
import type { DashboardStats } from '@/types';
import { Users, Calendar, Clock, FileText, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/patients')
    },
    {
      title: "Today's Visits",
      value: stats?.todayVisits || 0,
      icon: Calendar,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      onClick: () => navigate('/visits/today')
    },
    {
      title: 'Follow-ups Due',
      value: stats?.followUpsDue || 0,
      icon: Clock,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      onClick: () => navigate('/visits/follow-ups')
    },
    {
      title: 'Pending Prescriptions',
      value: stats?.pendingPrescriptions || 0,
      icon: FileText,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      onClick: () => navigate('/prescriptions/pending')
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Jash Physiotherapy Management System</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate('/patients/new')}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Users className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold">Add New Patient</h3>
            <p className="text-sm text-muted-foreground">Register a new patient</p>
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Calendar className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold">View Patients</h3>
            <p className="text-sm text-muted-foreground">Browse all patients</p>
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <FileText className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold">Search Records</h3>
            <p className="text-sm text-muted-foreground">Find patient records</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
