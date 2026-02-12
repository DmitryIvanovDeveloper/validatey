import { useState } from 'react';
import { Plus, Mail, MessageSquare, Link as LinkIcon, Copy, Send, CheckCircle } from 'lucide-react';
import { mockInvitations, type Invitation } from '../lib/mockData';

export function ProjectInvitations() {
  const [invitations, setInvitations] = useState(mockInvitations);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publicLink] = useState('https://validatey.app/s/ai-crm-survey-2024');
  const [copied, setCopied] = useState(false);

  const stats = {
    total: invitations.length,
    sent: invitations.filter(i => ['sent', 'opened', 'completed'].includes(i.status)).length,
    completed: invitations.filter(i => i.status === 'completed').length,
    pending: invitations.filter(i => i.status === 'pending').length,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Управление приглашениями</h1>
          <p className="text-gray-600">Создавайте и отслеживайте приглашения респондентов</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать приглашения
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Всего" value={stats.total} icon={Mail} color="blue" />
        <StatCard label="Отправлено" value={stats.sent} icon={Send} color="purple" />
        <StatCard label="Завершено" value={stats.completed} icon={CheckCircle} color="green" />
        <StatCard label="Ожидают" value={stats.pending} icon={Mail} color="gray" />
      </div>

      {/* Public Link */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Публичная ссылка на опрос</h3>
            <p className="text-gray-600 text-sm mb-4">
              Поделитесь этой ссылкой в социальных сетях или разместите на сайте
            </p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-300">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 text-sm flex-1 truncate">{publicLink}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Персональные приглашения</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Контакт
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Отправлено
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Завершено
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map(invitation => (
                <InvitationRow key={invitation.id} invitation={invitation} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvitationsModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const statusConfig = {
    pending: { label: 'Ожидает', class: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Отправлено', class: 'bg-blue-100 text-blue-800' },
    opened: { label: 'Открыто', class: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Завершено', class: 'bg-green-100 text-green-800' },
    bounced: { label: 'Ошибка', class: 'bg-red-100 text-red-800' },
  };

  const status = statusConfig[invitation.status];

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {invitation.email && <Mail className="w-4 h-4 text-gray-400" />}
          {invitation.phone && <MessageSquare className="w-4 h-4 text-gray-400" />}
          <span className="text-gray-900">{invitation.email || invitation.phone}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${status.class}`}>
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-600 text-sm">
        {invitation.sentAt ? new Date(invitation.sentAt).toLocaleDateString('ru-RU') : '-'}
      </td>
      <td className="px-6 py-4 text-gray-600 text-sm">
        {invitation.completedAt ? new Date(invitation.completedAt).toLocaleDateString('ru-RU') : '-'}
      </td>
      <td className="px-6 py-4 text-right">
        {invitation.status === 'opened' && (
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Напомнить
          </button>
        )}
      </td>
    </tr>
  );
}

function CreateInvitationsModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [contacts, setContacts] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Создать приглашения</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Способ отправки
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod('email')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  method === 'email' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <Mail className={`w-5 h-5 mb-2 ${method === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">Персональные приглашения</div>
              </button>
              <button
                onClick={() => setMethod('sms')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  method === 'sms' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <MessageSquare className={`w-5 h-5 mb-2 ${method === 'sms' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="font-medium text-gray-900">SMS</div>
                <div className="text-sm text-gray-600">Быстрая рассылка</div>
              </button>
            </div>
          </div>

          {/* Contacts Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {method === 'email' ? 'Email адреса' : 'Номера телефонов'}
            </label>
            <textarea
              value={contacts}
              onChange={e => setContacts(e.target.value)}
              placeholder={
                method === 'email'
                  ? 'user1@example.com\nuser2@example.com\nuser3@example.com'
                  : '+79001234567\n+79009876543'
              }
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500">
              Введите по одному контакту на строку
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Send className="w-4 h-4" />
            Отправить приглашения
          </button>
        </div>
      </div>
    </div>
  );
}
