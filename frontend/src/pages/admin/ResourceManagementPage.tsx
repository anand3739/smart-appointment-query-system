import React, { useEffect, useState } from 'react';
import { resourceService } from '../../services/resource.service';
import { branchService } from '../../services/branch.service';
import { Resource, Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Cpu, Plus, Building2 } from 'lucide-react';

export const ResourceManagementPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('DESK');
  const [branchId, setBranchId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [rList, bList] = await Promise.all([
        resourceService.getResources(selectedBranchFilter || undefined),
        branchService.getBranches(),
      ]);
      setResources(rList);
      setBranches(bList);
      if (bList.length > 0 && !branchId) {
        setBranchId(bList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranchFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resourceService.createResource({
        name,
        type,
        branchId,
      });
      setIsModalOpen(false);
      setName('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (r: Resource) => {
    try {
      await resourceService.updateResource(r.id, { isActive: !r.isActive });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Station Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage physical consultation desks, service counters, diagnostic rooms, and express bays.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Resource Station
        </Button>
      </div>

      {/* Filter by Branch */}
      <div className="flex items-center space-x-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Filter:</label>
        <select
          value={selectedBranchFilter}
          onChange={(e) => setSelectedBranchFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((r) => {
          const branch = branches.find((b) => b.id === r.branchId);
          return (
            <Card key={r.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                    <Badge variant={r.isActive ? 'green' : 'slate'}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                    Type: {r.type}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(r)}
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${
                    r.isActive ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {r.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{branch?.name || 'Assigned Branch'}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Resource Station"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Station Name"
            required
            placeholder="e.g. Counter 4 / Room 102"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Station Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="COUNTER">COUNTER (Service Counter)</option>
              <option value="DESK">DESK (Consultation Desk)</option>
              <option value="ROOM">ROOM (Diagnostic Suite / Room)</option>
              <option value="BAY">BAY (Express Bay)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
