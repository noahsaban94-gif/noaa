import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Truck,
  Building2,
  FolderOpen,
  Plus,
  ExternalLink
} from 'lucide-react';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../data/mockAndInitialData';

interface ClientsViewProps {
  onSelectClientForOrder: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onSelectClientForOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = INITIAL_CLIENTS.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">מדריך לקוחות וקבלנים</h2>
            <p className="text-xs text-slate-500 font-medium">
              28 לקוחות קבועים של ח. סבן עם הגדרות שיבוץ, נהגי ברירת מחדל ותיקיות דרייב
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש קבלן או טלפון..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const isCrane = client.defaultDriver?.includes('חכמת');
          return (
            <div
              key={client.id}
              className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between transition text-right"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{client.name}</h3>
                    {client.contactPerson && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        איש קשר: {client.contactPerson}
                      </p>
                    )}
                  </div>

                  <a
                    href={`tel:${client.phone}`}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title={`חייג ל${client.name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">טלפון:</span>
                    <span className="font-mono font-bold text-slate-800">{client.phone}</span>
                  </div>

                  {client.defaultDriver && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">נהג קבוע:</span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        isCrane ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-blue-900'
                      }`}>
                        {client.defaultDriver}
                      </span>
                    </div>
                  )}

                  {client.defaultWarehouse && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">מחסן מקור:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {client.defaultWarehouse}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {client.driveFolderUrl ? (
                  <a
                    href={client.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold transition"
                    title="פתח תיקיית Drive של הלקוח"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>תיקיית Drive</span>
                  </a>
                ) : (
                  <span className="text-slate-400 text-[11px]">ללא תיקייה</span>
                )}

                <button
                  onClick={() => onSelectClientForOrder(client)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הזמנה לקבלן</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
