import { useState } from 'react';
import { Search, Shield, User, Mail } from 'lucide-react';
import { mockAdminUsers, type User } from '../lib/mockData';

export function AdminUsers() {
  const [users] = useState(mockAdminUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Управление пользователями</h1>
          <p className="text-gray-600">Просмотр и управление пользователями системы</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Всего пользователей</span>
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{users.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Администраторов</span>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">PM/Users</span>
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {users.filter(u => u.role !== 'admin').length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                Роль
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Пользователи не найдены
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const roleConfig = {
    admin: { label: 'Администратор', class: 'bg-purple-100 text-purple-800' },
    pm: { label: 'Product Manager', class: 'bg-blue-100 text-blue-800' },
    user: { label: 'Пользователь', class: 'bg-gray-100 text-gray-800' },
  };

  const role = roleConfig[user.role];

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{user.email}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${role.class}`}>
          {role.label}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Управление
        </button>
      </td>
    </tr>
  );
}
