import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  Trash2, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Crown
} from 'lucide-react';
import { fetchUsers, createEmployee, deleteEmployee } from '../api';

export default function EmployeeManagementModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New user form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee'); // 'employee' or 'admin'
  const [title, setTitle] = useState('Sales & Operations Executive');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsersList = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setTitle('Executive Administrator');
    } else {
      setTitle('Sales & Operations Executive');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError('Please provide Name, Username, and Password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await createEmployee({
        name,
        username,
        password,
        role,
        title,
        phone,
        email
      });

      setSuccessMsg(`User account for '${name}' (${role.toUpperCase()}) created successfully!`);
      setName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setEmail('');
      setRole('employee');
      setTitle('Sales & Operations Executive');
      loadUsersList();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (u) => {
    const isProtected = u.username?.toLowerCase() === 'qtracker' || u.role === 'superadmin';
    if (isProtected) {
      alert('Cannot delete the root Super Admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove account '${u.name}'?`)) {
      return;
    }

    try {
      await deleteEmployee(u.id || u._id);
      setSuccessMsg(`Account '${u.name}' deleted.`);
      loadUsersList();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">User & Staff Management Desk</h3>
              <p className="text-xs text-slate-300">
                Create and manage accounts with either Admin or Employee access
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Add New Account Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Create New User (Admin or Employee)
              </h4>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Access Level / Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('employee')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'employee'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500 font-bold'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${role === 'employee' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Employee / Staff Access</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Can create/upload quotations; financial dashboard & authorization hidden
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500 font-bold'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Administrator Access</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Can authorize/reject quotations, view financial KPI dashboard, manage users
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* User details inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Fernando"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kasun"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Assign password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Title</label>
                  <input
                    type="text"
                    placeholder={role === 'admin' ? 'Executive Administrator' : 'Sales Executive'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +94 77 987 6543"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. kasun@subodhi.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Creating...' : `Register ${role === 'admin' ? 'Administrator' : 'Employee'}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Current Accounts Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Current Registered Accounts ({users.length})
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Name & Title</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Access Level</th>
                    <th className="py-2.5 px-3">Contact Details</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSuper = u.role === 'superadmin' || u.username === 'qtracker';
                    const isAdmin = u.role === 'admin' || isSuper;
                    const isProtected = isSuper || u.username?.toLowerCase() === 'qtracker';

                    return (
                      <tr key={u.id || u._id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isSuper && (
                              <Crown className="w-3.5 h-3.5 text-amber-500" title="Super Admin" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {u.title || (isSuper ? 'Super Administrator' : isAdmin ? 'Directorate' : 'Staff Member')}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                          @{u.username}
                        </td>

                        <td className="py-2.5 px-3">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Crown className="w-3 h-3 text-amber-600" />
                              Super Admin
                            </span>
                          ) : isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                              <ShieldCheck className="w-3 h-3 text-indigo-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              <User className="w-3 h-3 text-slate-500" />
                              Employee
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600">
                          {u.phone && <div>📞 {u.phone}</div>}
                          {u.email && <div>✉️ {u.email}</div>}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {!isProtected ? (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
