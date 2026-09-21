import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { queueService, MyQueuePosition } from '../../services/queue.service';
import { Appointment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CalendarPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queuePosition, setQueuePosition] = useState<MyQueuePosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [appts, qPos] = await Promise.all([
        appointmentService.getAppointments(),
        queueService.getMyPosition(),
      ]);
      setAppointments(appts);
      setQueuePosition(qPos);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const upcomingAppointment = appointments.find(
    (a) => a.status === 'CONFIRMED' || a.status === 'PENDING'
  );

  if (isLoading) {
    return <Spinner size="lg" className="py-24" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Customer Portal</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Manage your scheduled visits, view live queue positions, and book new consultations effortlessly.
          </p>
        </div>
        <Link to="/customer/book">
          <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Live Queue Banner if in queue */}
      {queuePosition && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {queuePosition.entry.queueNumber}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant={queuePosition.entry.status === 'CALLED' ? 'green' : 'amber'}>
                  {queuePosition.entry.status}
                </Badge>
                <span className="text-xs text-slate-500">Ticket Number</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {queuePosition.entry.status === 'CALLED'
                  ? 'Your ticket is now being called! Proceed to counter.'
                  : `You are #${queuePosition.position} in line (${queuePosition.peopleAhead} people ahead)`}
              </h3>
            </div>
          </div>
          <Link to="/customer/queue">
            <Button size="sm" variant="outline" className="border-amber-400 text-amber-900 hover:bg-amber-100">
              Open Queue Tracker
            </Button>
          </Link>
        </div>
      )}

      {/* Grid: Upcoming Appointment & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <div className="lg:col-span-2">
          <Card title="Upcoming Appointment" subtitle="Your next scheduled visit">
            {upcomingAppointment ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      #{upcomingAppointment.appointmentNumber}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1">
                      {upcomingAppointment.service?.name}
                    </h4>
                  </div>
                  <Badge variant="indigo">{upcomingAppointment.status}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>{new Date(upcomingAppointment.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>{new Date(upcomingAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({upcomingAppointment.service?.durationMinutes} mins)</span>
                  </div>
                  <div className="flex items-center space-x-2.5 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>{upcomingAppointment.branch?.name} — {upcomingAppointment.branch?.address}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <Link to="/customer/history">
                    <Button variant="outline" size="sm">
                      Manage / Reschedule
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-slate-700">No upcoming appointments</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Book a consultation with our advisors in just a few clicks.</p>
                <Link to="/customer/book">
                  <Button size="sm">Book Now</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Links & Info */}
        <div className="space-y-4">
          <Card title="Quick Navigation">
            <div className="space-y-2">
              <Link
                to="/customer/book"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CalendarPlus className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-slate-800">Book Appointment</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/customer/queue"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-slate-800">Live Queue Board</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/customer/history"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-slate-800">Appointment History</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
