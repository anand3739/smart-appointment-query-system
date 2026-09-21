import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { queueService } from '../../services/queue.service';
import { Appointment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  CalendarCheck,
  UserCheck,
  Clock,
  MapPin,
  AlertCircle,
  UserX,
} from 'lucide-react';

export const TodayAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const branchId = user?.staffBranchId || 'branch-downtown-001';

  const loadAppointments = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const list = await appointmentService.getAppointments({
        branchId,
        date: todayStr,
      });
      setAppointments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [branchId]);

  const handleCheckin = async (appointmentId: string) => {
    try {
      const entry = await queueService.checkin(appointmentId);
      setActionMessage(`Customer checked in! Ticket #${entry.queueNumber} issued.`);
      await loadAppointments();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    try {
      await appointmentService.updateStatus(appointmentId, 'NO_SHOW', 'Customer failed to arrive');
      setActionMessage('Appointment marked as No-Show. Slot released.');
      await loadAppointments();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Today's Appointments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Verify scheduled customer arrivals, perform check-ins into the live queue, and manage attendance.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-sm font-semibold text-indigo-900">
          {actionMessage}
        </div>
      )}

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-slate-400 text-sm">
              No appointments scheduled for today.
            </div>
          </Card>
        ) : (
          appointments.map((appt) => {
            const isConfirmed = appt.status === 'CONFIRMED';
            return (
              <Card key={appt.id} className="hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        #{appt.appointmentNumber}
                      </span>
                      <Badge variant={appt.status === 'CONFIRMED' ? 'indigo' : appt.status === 'CHECKED_IN' ? 'purple' : 'slate'}>
                        {appt.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {appt.customer?.fullName || 'Valued Customer'} — {appt.service?.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.service?.durationMinutes} mins)
                      </span>
                      {appt.customer?.phone && (
                        <span>Phone: {appt.customer.phone}</span>
                      )}
                    </div>
                  </div>

                  {isConfirmed && (
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => handleCheckin(appt.id)}>
                        <UserCheck className="w-4 h-4 mr-1.5" />
                        Check-In to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleNoShow(appt.id)}
                      >
                        <UserX className="w-4 h-4 mr-1.5" />
                        No-Show
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
