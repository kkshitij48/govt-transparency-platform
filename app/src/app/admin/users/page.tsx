'use client';

import { useEffect, useState, useTransition } from 'react';
import { Users, Search, Shield, UserCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { updateUserRole } from '@/lib/actions/admin';
import { format } from 'date-fns';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  Admin:    'bg-red-50 text-red-700 border border-red-200',
  Official: 'bg-blue-50 text-[#1B3A6B] border border-blue-200',
  Citizen:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const roleIcons: Record<string, React.ReactNode> = {
  Admin:    <Shield className="h-3 w-3" />,
  Official: <UserCheck className="h-3 w-3" />,
  Citizen:  <User className="h-3 w-3" />,
};

interface EditState {
  role: string;
  department_id: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editState, setEditState]   = useState<EditState>({ role: '', department_id: '' });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('profiles')
        .select('*, department:departments(department_name)')
        .order('created_at', { ascending: false }),
      supabase.from('departments')
        .select('department_id, department_name')
        .order('department_name'),
    ]).then(([{ data: u }, { data: d }]) => {
      setUsers(u || []);
      setDepartments(d || []);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(user: any) {
    setEditingUser(user.user_id);
    setEditState({
      role: user.role,
      department_id: user.department_id || null,
    });
  }

  async function handleSave(userId: string) {
    startTransition(async () => {
      const result = await updateUserRole(
        userId,
        editState.role,
        editState.department_id ?? undefined
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('User updated');
        // Update local state so table reflects change immediately
        setUsers(prev => prev.map(u => {
          if (u.user_id !== userId) return u;
          const dept = departments.find(d => d.department_id === editState.department_id);
          return {
            ...u,
            role: editState.role,
            department_id: editState.department_id || null,
            department: dept ? { department_name: dept.department_name } : null,
          };
        }));
        setEditingUser(null);
      }
    });
  }

  const roleCounts = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Administration</p>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">{users.length} registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['Citizen', 'Official', 'Admin'] as const).map(role => (
          <div key={role} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              {roleIcons[role]}
              <span className="text-xs font-semibold uppercase tracking-wide">{role}s</span>
            </div>
            <p className="text-2xl font-bold text-[#1A1A2E]">{roleCounts[role] || 0}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 pb-4 pt-5 px-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-300"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">User</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Role</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Department</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Joined</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const isEditing = editingUser === user.user_id;
                  return (
                    <tr
                      key={user.user_id}
                      className={`border-b border-gray-50 transition-colors ${isEditing ? 'bg-blue-50/40' : idx % 2 === 0 ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/40 hover:bg-gray-50/60'}`}
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-[#1B3A6B] text-xs font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A2E] truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <Select
                            value={editState.role}
                            onValueChange={v => { if (v) setEditState(s => ({ ...s, role: v })); }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Citizen">Citizen</SelectItem>
                              <SelectItem value="Official">Official</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColors[user.role]}`}>
                            {roleIcons[user.role]}
                            {user.role}
                          </span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <Select
                            value={editState.department_id ?? 'none'}
                            onValueChange={v => setEditState(s => ({ ...s, department_id: v === 'none' ? null : v }))}
                          >
                            <SelectTrigger className="w-48 h-8 text-xs border-gray-300">
                              <SelectValue placeholder="No department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— No department —</SelectItem>
                              {departments.map(d => (
                                <SelectItem key={d.department_id} value={d.department_id}>
                                  {d.department_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {user.department?.department_name ?? (
                              <span className="italic text-gray-300">Not assigned</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(user.user_id)}
                              disabled={isPending}
                              className="rounded bg-[#1B3A6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#152e58] disabled:opacity-50 transition-colors"
                            >
                              {isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(user)}
                            className="rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                <p className="mt-2 text-sm text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
