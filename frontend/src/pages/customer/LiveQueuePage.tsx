import React, { useEffect, useState } from 'react';
import { queueService, MyQueuePosition } from '../../services/queue.service';
import { branchService } from '../../services/branch.service';
import { useSocket } from '../../context/SocketContext';
import { Branch, QueueEntry } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Users, Bell, AlertCircle, CheckCircle2, Volume2 } from 'lucide-react';

export const LiveQueuePage: React.FC = () => {
  const [myPosition, setMyPosition] = useState<MyQueuePosition | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { socket, joinBranchRoom } = useSocket();

  const loadData = async () => {
    try {
      const [pos, bList] = await Promise.all([
        queueService.getMyPosition(),
        branchService.getBranches(),
      ]);
      setMyPosition(pos);
      setBranches(bList);
      if (bList.length > 0) {
        const activeBId = pos?.entry.branchId || bList[0].id;
        setSelectedBranchId(activeBId);
        const qList = await queueService.getLiveQueue(activeBId);
        setLiveQueue(qList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    joinBranchRoom(selectedBranchId);

    queueService.getLiveQueue(selectedBranchId).then(setLiveQueue);
  }, [selectedBranchId]);

  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      if (selectedBranchId) {
        queueService.getLiveQueue(selectedBranchId).then(setLiveQueue);
      }
      queueService.getMyPosition().then(setMyPosition);
    };

    const handleCustomerCalled = (calledEntry: any) => {
      handleQueueUpdated();
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('customer:called', handleCustomerCalled);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('customer:called', handleCustomerCalled);
    };
  }, [socket, selectedBranchId]);

  const currentlyServing = liveQueue.filter((q) => q.status === 'SERVING' || q.status === 'CALLED');
  const currentlyWaiting = liveQueue.filter((q) => q.status === 'WAITING');

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Queue Board</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time queue tracking and ticket announcements synchronized with our service desks.
        </p>
      </div>

      {/* Customer Ticket Status if Active */}
      {myPosition ? (
        <div
          className={`p-6 sm:p-8 rounded-2xl border-2 shadow-xl transition-all ${
            myPosition.entry.status === 'CALLED'
              ? 'bg-emerald-50 border-emerald-400 animate-pulse'
              : 'bg-white border-indigo-200'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg ${
                  myPosition.entry.status === 'CALLED'
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : 'bg-indigo-600 text-white shadow-indigo-200'
                }`}
              >
                {myPosition.entry.queueNumber}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold text-slate-400">Your Queue Ticket</span>
                  <Badge variant={myPosition.entry.status === 'CALLED' ? 'green' : 'indigo'}>
                    {myPosition.entry.status}
                  </Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {myPosition.entry.status === 'CALLED'
                    ? '🔔 YOUR NUMBER IS BEING CALLED!'
                    : `Position #${myPosition.position} in line`}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {myPosition.entry.status === 'CALLED'
                    ? 'Please proceed immediately to the assigned desk/counter.'
                    : `${myPosition.peopleAhead} people currently ahead of you.`}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-right w-full md:w-auto">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Currently Serving</span>
              <span className="text-2xl font-mono font-bold text-indigo-600">
                {myPosition.currentServingNumber || '—'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">You are not currently in a live queue</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Book an appointment or visit the counter for a walk-in ticket to enter the line.
          </p>
        </div>
      )}

      {/* Branch Selector */}
      <div className="flex items-center space-x-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch View:</label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Public Board: Currently Serving & Waiting Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Now Calling / Serving" subtitle="Tickets currently at service desks">
          <div className="space-y-3">
            {currentlyServing.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tickets currently in service
              </div>
            ) : (
              currentlyServing.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-black font-mono text-emerald-700">
                      {item.queueNumber}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-emerald-900 block">
                        {item.service?.name}
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        {item.assignedResource?.name || 'Service Desk'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="green">{item.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Waiting Queue" subtitle={`Currently waiting (${currentlyWaiting.length} in line)`}>
          <div className="space-y-2.5 max-h-96 overflow-y-auto">
            {currentlyWaiting.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tickets waiting in line
              </div>
            ) : (
              currentlyWaiting.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {item.queueNumber}
                    </span>
                    <span className="text-xs text-slate-600">{item.service?.name}</span>
                  </div>
                  <Badge variant={item.priority === 'EMERGENCY' ? 'red' : item.priority === 'PRIORITY' ? 'purple' : 'slate'}>
                    {item.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
