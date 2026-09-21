import React, { useEffect, useState } from 'react';
import { branchService } from '../../services/branch.service';
import { Branch, WorkingHour, Holiday } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  Building2,
  Plus,
  Clock,
  Calendar,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BranchManagementPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Branch modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Working Hours modal
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [hoursList, setHoursList] = useState<WorkingHour[]>([]);

  // Holiday modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');

  const loadBranches = async () => {
    try {
      const list = await branchService.getBranches(true);
      setBranches(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await branchService.createBranch({
        name: newName,
        address: newAddress,
        phone: newPhone,
        email: newEmail,
      });
      setIsCreateModalOpen(false);
      setNewName('');
      setNewAddress('');
      setNewPhone('');
      setNewEmail('');
      await loadBranches();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenHours = (branch: Branch) => {
    setSelectedBranch(branch);
    // Initialize or clone working hours
    const current = branch.workingHours || [];
    const fullWeek: WorkingHour[] = [];
    for (let day = 0; day <= 6; day++) {
      const existing = current.find((w) => w.dayOfWeek === day);
      if (existing) {
        fullWeek.push({ ...existing });
      } else {
        fullWeek.push({
          id: `wh-${day}`,
          branchId: branch.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '17:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          isClosed: day === 0,
        });
      }
    }
    setHoursList(fullWeek);
    setIsHoursModalOpen(true);
  };

  const handleSaveHours = async () => {
    if (!selectedBranch) return;
    setIsSubmitting(true);
    try {
      await branchService.setWorkingHours(selectedBranch.id, hoursList);
      setIsHoursModalOpen(false);
      await loadBranches();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    setIsSubmitting(true);
    try {
      await branchService.addHoliday(selectedBranch.id, {
        date: holidayDate,
        reason: holidayReason,
      });
      setIsHolidayModalOpen(false);
      setHolidayDate('');
      setHolidayReason('');
      await loadBranches();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      await branchService.updateBranch(branch.id, { isActive: !branch.isActive });
      await loadBranches();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branch Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure physical service branches, operating schedules, break periods, and holiday closures.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => (
          <Card key={b.id} className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900">{b.name}</h3>
                  <Badge variant={b.isActive ? 'green' : 'slate'}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{b.address}</p>
              </div>
              <button
                onClick={() => handleToggleActive(b)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                  b.isActive ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {b.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{b.email}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {b.workingHours?.length || 0} schedules configured
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenHours(b)}>
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Schedules
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBranch(b);
                    setIsHolidayModalOpen(true);
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Holidays
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Branch"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input
            label="Branch Name"
            required
            placeholder="e.g. Northside Branch"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Address"
            required
            placeholder="e.g. 500 North Highway"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <Input
            label="Contact Phone"
            required
            placeholder="+1 555-010-0000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <Input
            label="Contact Email"
            type="email"
            required
            placeholder="branch@queueflow.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Working Hours & Breaks Modal */}
      {selectedBranch && (
        <Modal
          isOpen={isHoursModalOpen}
          onClose={() => setIsHoursModalOpen(false)}
          title={`Working Hours — ${selectedBranch.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            <p className="text-xs text-slate-500">
              Configure open, close, and lunch break periods for each day of the week.
            </p>
            {hoursList.map((wh, idx) => (
              <div
                key={wh.dayOfWeek}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="w-24 font-bold text-slate-800">{DAYS[wh.dayOfWeek]}</div>
                <div className="flex items-center space-x-2">
                  <label className="text-[11px] text-slate-500">Open:</label>
                  <input
                    type="time"
                    disabled={wh.isClosed}
                    value={wh.openTime}
                    onChange={(e) => {
                      const updated = [...hoursList];
                      updated[idx].openTime = e.target.value;
                      setHoursList(updated);
                    }}
                    className="p-1 border rounded"
                  />
                  <label className="text-[11px] text-slate-500">Close:</label>
                  <input
                    type="time"
                    disabled={wh.isClosed}
                    value={wh.closeTime}
                    onChange={(e) => {
                      const updated = [...hoursList];
                      updated[idx].closeTime = e.target.value;
                      setHoursList(updated);
                    }}
                    className="p-1 border rounded"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-[11px] text-slate-500">Break:</label>
                  <input
                    type="time"
                    disabled={wh.isClosed}
                    value={wh.breakStart || ''}
                    onChange={(e) => {
                      const updated = [...hoursList];
                      updated[idx].breakStart = e.target.value;
                      setHoursList(updated);
                    }}
                    className="p-1 border rounded w-18"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    disabled={wh.isClosed}
                    value={wh.breakEnd || ''}
                    onChange={(e) => {
                      const updated = [...hoursList];
                      updated[idx].breakEnd = e.target.value;
                      setHoursList(updated);
                    }}
                    className="p-1 border rounded w-18"
                  />
                </div>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wh.isClosed}
                    onChange={(e) => {
                      const updated = [...hoursList];
                      updated[idx].isClosed = e.target.checked;
                      setHoursList(updated);
                    }}
                  />
                  <span className="font-semibold text-slate-600">Closed</span>
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsHoursModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isSubmitting} onClick={handleSaveHours}>
              Save Operating Hours
            </Button>
          </div>
        </Modal>
      )}

      {/* Holiday Modal */}
      {selectedBranch && (
        <Modal
          isOpen={isHolidayModalOpen}
          onClose={() => setIsHolidayModalOpen(false)}
          title={`Add Holiday Closure — ${selectedBranch.name}`}
        >
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <Input
              label="Holiday Date"
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
            <Input
              label="Holiday Description"
              required
              placeholder="e.g. National Day / Maintenance"
              value={holidayReason}
              onChange={(e) => setHolidayReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setIsHolidayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Holiday
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
