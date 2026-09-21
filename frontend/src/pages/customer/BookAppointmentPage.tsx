import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { branchService } from '../../services/branch.service';
import { serviceService } from '../../services/service.service';
import { appointmentService, TemporaryHoldResponse } from '../../services/appointment.service';
import { waitlistService } from '../../services/waitlist.service';
import { Branch, Service } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import {
  Building2,
  Layers,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Timer,
  AlertTriangle,
  ListOrdered,
} from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Default date: tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  const [hold, setHold] = useState<TemporaryHoldResponse | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(0);

  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successAppointment, setSuccessAppointment] = useState<any | null>(null);

  // Waitlist modal state
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    Promise.all([branchService.getBranches(), serviceService.getServices()]).then(
      ([bList, sList]) => {
        setBranches(bList);
        if (bList.length > 0) setSelectedBranchId(bList[0].id);

        setServices(sList);
        if (sList.length > 0) setSelectedServiceId(sList[0].id);
      }
    );
  }, []);

  // Fetch slots whenever branch, service, or date changes
  useEffect(() => {
    if (!selectedBranchId || !selectedServiceId || !selectedDate) return;

    setSelectedSlot(null);
    setHold(null);
    setError(null);
    setIsLoadingSlots(true);

    appointmentService
      .getAvailability(selectedBranchId, selectedServiceId, selectedDate)
      .then((res) => {
        setAvailableSlots(res.availableSlots || []);
      })
      .catch((err) => {
        console.error('Failed to load slots', err);
        setAvailableSlots([]);
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [selectedBranchId, selectedServiceId, selectedDate]);

  // Handle countdown for temporary hold
  useEffect(() => {
    if (!hold) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setHold(null);
        setSelectedSlot(null);
        setHoldSecondsLeft(0);
        setError('Temporary slot reservation expired. Please select a slot again.');
        clearInterval(interval);
      } else {
        setHoldSecondsLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hold]);

  const handleSelectSlot = async (slot: string) => {
    setError(null);
    const slotStartTime = `${selectedDate}T${slot}:00.000Z`;

    try {
      // Create temporary reservation hold
      const holdRes = await appointmentService.reserveSlot(
        selectedBranchId,
        selectedServiceId,
        slotStartTime,
        slotStartTime // handled by backend
      );
      setSelectedSlot(slot);
      setHold(holdRes);
      setHoldSecondsLeft(600); // 10 minutes
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Selected slot is no longer available');
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const slotStartTime = `${selectedDate}T${selectedSlot}:00.000Z`;
      const idempotencyKey = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const appt = await appointmentService.bookAppointment(
        {
          branchId: selectedBranchId,
          serviceId: selectedServiceId,
          startTime: slotStartTime,
          notes: notes || undefined,
          reservationId: hold?.reservationId,
        },
        idempotencyKey
      );

      setSuccessAppointment(appt);
      setHold(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      await waitlistService.joinWaitlist({
        branchId: selectedBranchId,
        serviceId: selectedServiceId,
        preferredDate: selectedDate,
      });
      setWaitlistSuccess(true);
      setTimeout(() => {
        setIsWaitlistModalOpen(false);
        setWaitlistSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to join waitlist');
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book an Appointment</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select branch, consultation service, and an open time slot.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Modal */}
      {successAppointment && (
        <Modal
          isOpen={true}
          onClose={() => navigate('/customer')}
          title="Appointment Confirmed!"
        >
          <div className="text-center py-4 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-scale-up" />
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Appointment Number</span>
              <p className="text-2xl font-mono font-black text-indigo-600 mt-0.5">
                {successAppointment.appointmentNumber}
              </p>
            </div>

            <p className="text-sm text-slate-600">
              Your appointment has been successfully booked and confirmed. A notification has been dispatched to your portal.
            </p>

            <div className="pt-4 flex justify-center space-x-3">
              <Button onClick={() => navigate('/customer')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Step 1 & 2: Branch & Service Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="1. Select Branch" subtitle="Choose your preferred facility">
          <div className="space-y-3">
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedBranchId === b.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Building2 className={`w-5 h-5 ${selectedBranchId === b.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-slate-900">{b.name}</span>
                  </div>
                  {selectedBranchId === b.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-7.5">{b.address}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="2. Select Service" subtitle="Consultation type & duration">
          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedServiceId === s.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Layers className={`w-5 h-5 ${selectedServiceId === s.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">${s.price}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500 pl-7.5">
                  <span>{s.description}</span>
                  <span className="font-medium text-indigo-600">{s.durationMinutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Step 3: Date & Time Slots */}
      <Card title="3. Select Date & Time Slot" subtitle="Backend availability engine verification">
        <div className="space-y-4">
          <div className="w-full sm:w-64">
            <Input
              label="Appointment Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Slots for {selectedDate}
            </label>

            {isLoadingSlots ? (
              <Spinner size="md" className="py-6" />
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      selectedSlot === slot
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                <p className="text-sm text-slate-500">
                  No appointment slots available for this date (fully booked or closed).
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWaitlistModalOpen(true)}
                  className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                >
                  <ListOrdered className="w-4 h-4 mr-1.5" />
                  Join Waiting List for this Date
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Step 4: Live Temporary Reservation Timer & Confirmation */}
      {selectedSlot && (
        <Card title="4. Confirm Reservation" subtitle="Temporary slot hold active">
          <div className="space-y-4">
            {hold && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Timer className="w-6 h-6 text-indigo-600 animate-pulse" />
                  <div>
                    <span className="text-xs font-semibold text-indigo-900">
                      Temporary Slot Reserved
                    </span>
                    <p className="text-xs text-indigo-700">
                      Complete your booking before this countdown expires.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-indigo-600">
                    {formatCountdown(holdSecondsLeft)}
                  </span>
                </div>
              </div>
            )}

            <Input
              label="Booking Notes (Optional)"
              type="text"
              placeholder="e.g. Specific requirements or reason for consultation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <Button
                isLoading={isSubmitting}
                onClick={handleConfirmBooking}
                size="lg"
                className="w-full sm:w-auto shadow-lg shadow-indigo-100"
              >
                Confirm Appointment ({selectedSlot})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Waitlist Modal */}
      <Modal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        title="Join Waiting List"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            If a customer cancels or reschedules on <strong>{selectedDate}</strong>, our automated engine will allocate the slot to waitlisted customers by arrival order.
          </p>
          {waitlistSuccess ? (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg text-center">
              Successfully added to the waiting list!
            </div>
          ) : (
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setIsWaitlistModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleJoinWaitlist}>Join Waiting List</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
