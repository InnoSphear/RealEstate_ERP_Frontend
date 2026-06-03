import { useState, useEffect } from 'react';
import API from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineUser, HiOutlineBuildingOffice, HiOutlineBell,
  HiOutlineShieldCheck, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlineArrowRightOnRectangle, HiOutlineDevicePhoneMobile,
  HiOutlineClock, HiOutlineGlobeAlt,
} from 'react-icons/hi2';

const tabs = [
  { key: 'profile', label: 'Profile', icon: HiOutlineUser },
  { key: 'company', label: 'Company', icon: HiOutlineBuildingOffice },
  { key: 'notifications', label: 'Notifications', icon: HiOutlineBell },
  { key: 'security', label: 'Security', icon: HiOutlineShieldCheck },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState(null);

  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', photo: null });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const [company, setCompany] = useState({
    name: '', email: '', phone: '', address: '', gst: '', pan: '', logo: null,
  });
  const [subscription, setSubscription] = useState(null);

  const [notifications, setNotifications] = useState({
    email: false, whatsapp: false, sms: false, in_app: false,
    follow_up_reminders: false, lead_assignment_alerts: false,
  });

  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [twoFactor, setTwoFactor] = useState(false);

  const isSuperAdmin = user?.role_slug === 'admin' || user?.role === 'admin';

  useEffect(() => {
    Promise.all([
      API.get('/auth/me'),
      API.get('/settings/notifications').catch(() => {}),
      API.get('/auth/sessions').catch(() => {}),
      API.get('/auth/login-history').catch(() => {}),
    ])
      .then(([meRes, notifRes, sessRes, histRes]) => {
        const u = meRes.data;
        setProfile({
          full_name: u.full_name || '',
          email: u.email || '',
          phone: u.phone || '',
          photo: null,
        });
        if (notifRes?.data) setNotifications(notifRes.data);
        if (sessRes?.data) setSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
        if (histRes?.data) setLoginHistory(Array.isArray(histRes.data) ? histRes.data : []);
      })
      .catch(() => {});

    if (isSuperAdmin) {
      API.get('/settings/company')
        .then((res) => {
          const c = res.data;
          setCompany({
            name: c.name || c.company_name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            gst: c.gst || c.gst_number || '',
            pan: c.pan || c.pan_number || '',
            logo: null,
          });
          setSubscription(c.subscription || null);
        })
        .catch(() => {});
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name', profile.full_name);
      fd.append('email', profile.email);
      fd.append('phone', profile.phone);
      if (profile.photo) fd.append('photo', profile.photo);
      await API.put('/auth/me', fd);
      toast('Profile updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (password.new.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword: password.current,
        newPassword: password.new,
      });
      toast('Password changed');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', company.name);
      fd.append('email', company.email);
      fd.append('phone', company.phone);
      fd.append('address', company.address);
      fd.append('gst', company.gst);
      fd.append('pan', company.pan);
      if (company.logo) fd.append('logo', company.logo);
      await API.put('/settings/company', fd);
      toast('Company settings updated');
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/settings/notifications', notifications);
      toast('Notification preferences saved');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;
    try {
      await API.delete(`/auth/sessions/${sessionToRevoke._id}`);
      toast('Session revoked');
      setSessions((prev) => prev.filter((s) => s._id !== sessionToRevoke._id));
    } catch {
      toast('Failed to revoke session', 'error');
    }
  };

  const handleToggle2FA = async () => {
    try {
      await API.put('/auth/two-factor', { enabled: !twoFactor });
      setTwoFactor(!twoFactor);
      toast(twoFactor ? '2FA disabled' : '2FA enabled');
    } catch {
      toast('Failed to update 2FA', 'error');
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";
  const labelClass = "block text-sm font-semibold text-stone-700 mb-1.5";
  const saveBtnClass = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10";
  const cancelBtnClass = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Settings</h1>
        <p className="text-stone-500 mt-1">Manage your account and system preferences</p>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white rounded-2xl border border-stone-200 p-1">
        {tabs.map((tab) =>
          tab.key === 'company' && !isSuperAdmin ? null : (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-8">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <h3 className="text-lg font-semibold text-stone-900">Profile Information</h3>

              <div className="flex items-center gap-5 mb-2">
                <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden">
                  {profile.photo ? (
                    <img src={URL.createObjectURL(profile.photo)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <HiOutlineUser size={28} className="text-stone-400" />
                  )}
                </div>
                <div>
                  <label className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 inline-flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfile({ ...profile, photo: e.target.files[0] })}
                      className="hidden"
                    />
                    Change Photo
                  </label>
                  <p className="text-xs text-stone-400 mt-1.5">JPG, PNG, GIF. Max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={inputClass}
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    className={inputClass}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className={saveBtnClass}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <hr className="border-stone-100" />

            <form onSubmit={handleChangePassword} className="space-y-5">
              <h3 className="text-lg font-semibold text-stone-900">Change Password</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['current', 'new', 'confirm'].map((field) => (
                  <div key={field}>
                    <label className={labelClass}>
                      {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw[field] ? 'text' : 'password'}
                        className={`${inputClass} pr-11`}
                        value={password[field]}
                        onChange={(e) => setPassword({ ...password, [field]: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        {showPw[field] ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="submit" disabled={saving} className={saveBtnClass}>
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'company' && isSuperAdmin && (
          <form onSubmit={handleSaveCompany} className="max-w-2xl space-y-5">
            <h3 className="text-lg font-semibold text-stone-900">Company Information</h3>

            <div className="flex items-center gap-5 mb-2">
              <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img src={URL.createObjectURL(company.logo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HiOutlineBuildingOffice size={28} className="text-stone-400" />
                )}
              </div>
              <div>
                <label className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 inline-flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCompany({ ...company, logo: e.target.files[0] })}
                    className="hidden"
                  />
                  Upload Logo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company Name</label>
                <input className={inputClass} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>GST Number</label>
                <input className={inputClass} value={company.gst} onChange={(e) => setCompany({ ...company, gst: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>PAN Number</label>
                <input className={inputClass} value={company.pan} onChange={(e) => setCompany({ ...company, pan: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea className={`${inputClass} resize-none`} rows={3} value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </div>

            <button type="submit" disabled={saving} className={saveBtnClass}>
              {saving ? 'Saving...' : 'Save Company Info'}
            </button>

            {subscription && (
              <div className="mt-6 p-5 rounded-2xl bg-stone-50 border border-stone-200">
                <h4 className="text-sm font-semibold text-stone-900 mb-3">Subscription</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-stone-500 text-xs">Plan</p>
                    <p className="font-medium text-stone-800 capitalize">{subscription.plan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      subscription.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {subscription.status || '-'}
                    </span>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs">Renewal</p>
                    <p className="font-medium text-stone-800">
                      {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs">Users</p>
                    <p className="font-medium text-stone-800">{subscription.userCount || 0} / {subscription.maxUsers || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={handleSaveNotifications} className="max-w-xl space-y-5">
            <h3 className="text-lg font-semibold text-stone-900">Notification Channels</h3>

            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Receive updates on WhatsApp' },
              { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via text message' },
              { key: 'in_app', label: 'In-app Notifications', desc: 'Show notifications within the app' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 accent-stone-900"
                />
              </label>
            ))}

            <hr className="border-stone-100" />

            <h3 className="text-lg font-semibold text-stone-900">Alert Preferences</h3>

            {[
              { key: 'follow_up_reminders', label: 'Follow-up Reminders', desc: 'Get reminded about pending follow-ups' },
              { key: 'lead_assignment_alerts', label: 'Lead Assignment Alerts', desc: 'Get notified when leads are assigned' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 accent-stone-900"
                />
              </label>
            ))}

            <button type="submit" disabled={saving} className={saveBtnClass}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Active Sessions</h3>
              {sessions.length === 0 ? (
                <div className="flex items-center gap-3 py-4 px-4 rounded-xl bg-stone-50 text-sm text-stone-500">
                  <HiOutlineDevicePhoneMobile size={18} />
                  No active sessions
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess._id}
                      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-stone-50 text-stone-500">
                          <HiOutlineDevicePhoneMobile size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">
                            {sess.device || sess.userAgent || 'Unknown device'}
                          </p>
                          <p className="text-xs text-stone-400">
                            {sess.ip || 'IP not available'} · {sess.lastActive ? new Date(sess.lastActive).toLocaleString() : ''}
                          </p>
                        </div>
                        {sess.isCurrent && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Current</span>
                        )}
                      </div>
                      {!sess.isCurrent && (
                        <button
                          onClick={() => { setSessionToRevoke(sess); setConfirmOpen(true); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-red-200 transition-colors inline-flex items-center gap-1"
                        >
                          <HiOutlineArrowRightOnRectangle size={14} />
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-stone-100" />

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Login History</h3>
              {loginHistory.length === 0 ? (
                <div className="flex items-center gap-3 py-4 px-4 rounded-xl bg-stone-50 text-sm text-stone-500">
                  <HiOutlineClock size={18} />
                  No login history available
                </div>
              ) : (
                <div className="space-y-2">
                  {loginHistory.slice(0, 10).map((entry, i) => (
                    <div
                      key={entry._id || i}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-stone-50 text-stone-500">
                        <HiOutlineGlobeAlt size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-800">
                          {entry.device || entry.userAgent || 'Unknown device'}
                        </p>
                        <p className="text-xs text-stone-400">
                          {entry.ip || ''} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                      {entry.success === false && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Failed</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-stone-100" />

            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Two-Factor Authentication</p>
                  <p className="text-xs text-stone-400 mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 ${
                    twoFactor
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {twoFactor ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRevokeSession}
        title="Revoke Session"
        message="Are you sure you want to revoke this session? The device will be logged out."
      />
    </div>
  );
}
