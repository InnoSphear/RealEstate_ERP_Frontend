import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi2';

export default function MyAttendance() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance/my');
      const records = Array.isArray(res.data) ? res.data : [];
      setHistory(records);
      const today = new Date().toISOString().split('T')[0];
      const todayRec = records.find((r) => r.date && r.date.split('T')[0] === today);
      setTodayRecord(todayRec || null);
    } catch (err) {
      toast('Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await API.post('/attendance/check-in');
      toast('Check-in successful');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await API.post('/attendance/check-out');
      toast('Check-out successful');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Check-out failed', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const approvalBadge = (status) => {
    const map = {
      pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Attendance</h1>
        <p className="text-stone-500 mt-1">Check in and out, view your attendance history</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Today</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-stone-500">Status</p>
            <p className="text-sm font-semibold text-stone-800 capitalize">
              {todayRecord ? todayRecord.status?.replace('_', ' ') : 'Not Checked In'}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Check In</p>
            <p className="text-sm font-semibold text-stone-800">{todayRecord ? formatTime(todayRecord.check_in) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Check Out</p>
            <p className="text-sm font-semibold text-stone-800">{todayRecord?.check_out ? formatTime(todayRecord.check_out) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Approval</p>
            <p className="text-sm font-semibold text-stone-800">
              {todayRecord ? approvalBadge(todayRecord.approval_status) : '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!todayRecord ? (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <HiOutlineCheckCircle size={18} />
              {checkingIn ? 'Checking In...' : 'Check In'}
            </button>
          ) : !todayRecord.check_out ? (
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all border-0 bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-900/10 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <HiOutlineXCircle size={18} />
              {checkingOut ? 'Checking Out...' : 'Check Out'}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 text-stone-500 text-sm">
              <HiOutlineClock size={16} />
              Completed for today
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Recent History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Check In</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Check Out</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Status</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Approval</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Hours</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-stone-400">No attendance records</td>
                </tr>
              ) : history.slice(0, 20).map((r) => (
                <tr key={r._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="px-5 py-3.5 text-stone-700">{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3.5 text-stone-700">{formatTime(r.check_in)}</td>
                  <td className="px-5 py-3.5 text-stone-700">{formatTime(r.check_out)}</td>
                  <td className="px-5 py-3.5"><span className="capitalize text-stone-700">{r.status?.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3.5">{approvalBadge(r.approval_status)}</td>
                  <td className="px-5 py-3.5 text-stone-700">{r.working_hours ? `${r.working_hours.toFixed(1)}h` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}