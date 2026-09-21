import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { queueService } from '../../services/queue.service';
import { appointmentService } from '../../services/appointment.service';
import { resourceService } from '../../services/resource.service';
import { serviceService } from '../../services/service.service';
import { useSocket } from '../../context/SocketContext';
import { QueueEntry, Appointment, Resource, Service } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  PhoneCall,
  UserPlus,
  Play,
  SkipForward,
  Check,
  AlertOctagon,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket, joinBranchRoom } = useSocket();

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Walk-in modal
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState('');
  const [walkinPriority, setWalkinPriority] = useState<'NORMAL' | 'PRIORITY' | 'EMERGENCY'>('NORMAL');
  const [isAddingWalkin, setIsAddingWalkin] = useState(false);

  const branchId = user?.staffBranchId || 'branch-downtown-001';

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [qList, appts, resList, srvList] = await Promise.all([
        queueService.getLiveQueue(branchId),
        appointmentService.getAppointments({ branchId, date: todayStr }),
        resourceService.getResources(branchId),
        serviceService.getServices(),
      ]);
      setQueue(qList);
      setAppointments(appts);
      setResources(resList);
      setServices(srvList);
      if (resList.length > 0 && !selectedResourceId) {
        setSelectedResourceId(resList[0].id);
      }
      if (srvList.length > 0 && !walkinServiceId) {
        setWalkinServiceId(srvList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    joinBranchRoom(branchId);
  }, [branchId]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queueService.getLiveQueue(branchId).then(setQueue);
    };

    socket.on('queue:updated', handleUpdate);
    return () => {
      socket.off('queue:updated', handleUpdate);
    };
  }, [socket, branchId]);

  const handleCallNext = async () => {
    try {
      await queueService.callNext(branchId, selectedResourceId || undefined);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartService = async (id: string) => {
    try {
      await queueService.startService(id, selectedResourceId || undefined);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteService = async (id: string) => {
    try {
      await queueService.completeService(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkip = async (id: string) => {
    try {
      await queueService.skip(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingWalkin(true);
    try {
      await queueService.addWalkin({
        branchId,
        serviceId: walkinServiceId,
        customerName: walkinName,
        customerPhone: walkinPhone || undefined,
        priority: walkinPriority,
      });
      setIsWalkinModalOpen(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinPriority('NORMAL');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingWalkin(false);
    }
  };

  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
  const servingCount = queue.filter((q) => q.status === 'SERVING').length;
  const calledCount = queue.filter((q) => q.status === 'CALLED').length;

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Queue Console</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.staffBranch?.name || 'Flagship Branch'} — Desk Operations & Queue Dispatch
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                Station: {r.name} ({r.type})
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={() => setIsWalkinModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Walk-In
          </Button>

          <Button size="sm" onClick={handleCallNext}>
            <PhoneCall className="w-4 h-4 mr-1.5" />
            Call Next
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Waiting</span>
              <span className="text-xl font-bold text-slate-900">{waitingCount}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Called</span>
              <span className="text-xl font-bold text-slate-900">{calledCount}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Serving</span>
              <span className="text-xl font-bold text-slate-900">{servingCount}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Appointments Today</span>
              <span className="text-xl font-bold text-slate-900">{appointments.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Queue Operations Table */}
      <Card title="Live Queue Operations" subtitle="Deterministic priority ordering (Emergency > Priority > Normal)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No customers currently in queue.
                  </td>
                </tr>
              ) : (
                queue.map((entry) => {
                  const waitMinutes = Math.floor(
                    (Date.now() - new Date(entry.checkInTime).getTime()) / 60000
                  );
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-base text-indigo-600">
                        {entry.queueNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{entry.customerName}</span>
                        {entry.customerPhone && (
                          <span className="text-xs text-slate-400">{entry.customerPhone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{entry.service?.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            entry.priority === 'EMERGENCY'
                              ? 'red'
                              : entry.priority === 'PRIORITY'
                              ? 'purple'
                              : 'slate'
                          }
                        >
                          {entry.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            entry.status === 'SERVING'
                              ? 'green'
                              : entry.status === 'CALLED'
                              ? 'amber'
                              : 'slate'
                          }
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {waitMinutes} mins
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {entry.status === 'CALLED' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleStartService(entry.id)}
                            >
                              <Play className="w-3.5 h-3.5 mr-1" />
                              Start
                            </Button>
                          )}
                          {entry.status === 'SERVING' && (
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => handleCompleteService(entry.id)}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Complete
                            </Button>
                          )}
                          {entry.status === 'WAITING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => queueService.callNext(branchId, selectedResourceId || undefined).then(loadData)}
                            >
                              Call
                            </Button>
                          )}
                          {entry.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500 hover:text-slate-700"
                              onClick={() => handleSkip(entry.id)}
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Walk-in Modal */}
      <Modal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        title="Add Walk-In Customer"
      >
        <form onSubmit={handleAddWalkin} className="space-y-4">
          <Input
            label="Customer Name"
            required
            value={walkinName}
            onChange={(e) => setWalkinName(e.target.value)}
            placeholder="e.g. John Smith"
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            value={walkinPhone}
            onChange={(e) => setWalkinPhone(e.target.value)}
            placeholder="+1 555-000-0000"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
            <select
              value={walkinServiceId}
              onChange={(e) => setWalkinServiceId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} mins)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
            <select
              value={walkinPriority}
              onChange={(e) => setWalkinPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
            >
              <option value="NORMAL">NORMAL (Standard queue order)</option>
              <option value="PRIORITY">PRIORITY (Elderly / VIP priority)</option>
              <option value="EMERGENCY">EMERGENCY (Immediate top priority)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsWalkinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isAddingWalkin}>
              Issue Ticket & Add to Queue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
