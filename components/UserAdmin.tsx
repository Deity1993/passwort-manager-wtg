import React, { useEffect, useState } from "react";
import { AdminUser, Role } from "../types";
import { createUser, getUsers, updateUser } from "../services/api";

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [formData, setFormData] = useState({ username: "", password: "", role: "USER" as Role });
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await createUser(formData);
      setUsers((prev) => [user, ...prev]);
      setFormData({ username: "", password: "", role: "USER" });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const updated = await updateUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleRoleChange = async (user: AdminUser, role: Role) => {
    try {
      const updated = await updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-800">User Administration</h2>
        <p className="text-slate-500 text-sm">Create and manage user access.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          required
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          required
          type="password"
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <select
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
        >
          Create User
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Users</h3>
          <button
            onClick={loadUsers}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-4">
              <div>
                <div className="font-semibold text-slate-800">{user.username}</div>
                <div className="text-xs text-slate-400">{user.role} • {user.active ? "Active" : "Disabled"}</div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value as Role)}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={() => handleToggleActive(user)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                >
                  {user.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-sm text-slate-500">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;
