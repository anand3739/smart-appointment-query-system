import React, { useEffect, useState } from 'react';
import { appointmentService } from '../../services/appointment.service';
import { Appointment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  Calendar,
  Clock,
  MapPin,
  XCircle,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';

export const AppointmentHistoryPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule modal
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newSlots, setNewSlots] = useState<string[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const loadAppointments = async () => {
    try {
      const list = await appointmentService.getAppointments();
      setAppointments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async () => {
    if (!cancelModalAppt) return;
    setIsCancelling(true);
    try {
      await appointmentService.cancelAppointment(cancelModalAppt.id, cancelReason);
      setCancelModalAppt(null);
      setCancelReason('');
      await loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDateChangeForReschedule = async (dateStr: string) => {
    setNewDate(dateStr);
    setSelectedNewSlot(null);
    if (!rescheduleModalAppt) return;

    setIsLoadingSlots(true);
    try {
      const res = await appointmentService.getAvailability(
        rescheduleModalAppt.branchId,
        rescheduleModalAppt.serviceId,
        dateStr
      );
      setNewSlots(res.availableSlots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModalAppt || !selectedNewSlot || !newDate) return;
    setIsRescheduling(true);
    try {
      const newStartTime = `${newDate}T${selectedNewSlot}:00.000Z`;
      await appointmentService.rescheduleAppointment(rescheduleModalAppt.id, newStartTime);
      setRescheduleModalAppt(null);
      await loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="indigo">CONFIRMED</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="purple">CHECKED IN</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="amber">IN PROGRESS</Badge>;
      case 'COMPLETED':
        return <Badge variant="green">COMPLETED</Badge>;
      case 'CANCELLED':
        return <Badge variant="red">CANCELLED</Badge>;
      case 'NO_SHOW':
        return <Badge variant="slate">NO SHOW</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appointment History</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View past and present appointments, reschedule visits, or submit cancellations.
        </p>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-slate-400 text-sm">
              You haven't booked any appointments yet.
            </div>
          </Card>
        ) : (
          appointments.map((appt) => {
            const isActionable = appt.status === 'CONFIRMED' || appt.status === 'PENDING';
            return (
              <Card key={appt.id} className="hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        #{appt.appointmentNumber}
                      </span>
                      {getStatusBadge(appt.status)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {appt.service?.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(appt.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {appt.branch?.name}
                      </span>
                    </div>
                  </div>

                  {isActionable && (
                    <div className="flex items-center space-x-2.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRescheduleModalAppt(appt);
                          const nextDay = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                          handleDateChangeForReschedule(nextDay);
                        }}
                      >
                        <CalendarClock className="w-4 h-4 mr-1.5" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setCancelModalAppt(appt)}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModalAppt && (
        <Modal
          isOpen={true}
          onClose={() => setCancelModalAppt(null)}
          title={`Cancel Appointment #${cancelModalAppt.appointmentNumber}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel your appointment for{' '}
              <strong>{cancelModalAppt.service?.name}</strong>?
            </p>
            <Input
              label="Reason for cancellation (optional)"
              placeholder="e.g. Change in personal schedule"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setCancelModalAppt(null)}>
                Keep Appointment
              </Button>
              <Button variant="danger" isLoading={isCancelling} onClick={handleCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <Modal
          isOpen={true}
          onClose={() => setRescheduleModalAppt(null)}
          title={`Reschedule #${rescheduleModalAppt.appointmentNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <Input
              label="Select New Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => handleDateChangeForReschedule(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Available Slots for {newDate}
              </label>
              {isLoadingSlots ? (
                <Spinner size="sm" className="py-4" />
              ) : newSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {newSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedNewSlot(slot)}
                      className={`p-2 rounded-lg text-xs font-medium border ${
                        selectedNewSlot === slot
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No available slots for this date.</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setRescheduleModalAppt(null)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedNewSlot}
                isLoading={isRescheduling}
                onClick={handleReschedule}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
