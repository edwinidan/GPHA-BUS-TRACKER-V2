'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bus, Stop } from '@/types';

const ADMIN_PASSWORD = 'gpha-admin-2024';
const AUTH_KEY = 'gpha_admin_auth';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface EditingStop {
  id: string;
  name: string;
  geofence_radius_meters: number;
}

interface AddStopForm {
  bus_id: string;
  name: string;
  latitude: string;
  longitude: string;
  order_index: string;
  geofence_radius_meters: string;
}

// ─── Root page (auth gate) ──────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
      setAuthed(true);
    }
  }, []);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  }

  function handleSignOut() {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword('');
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6 text-center">GPHA Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter password"
            className="w-full border rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {authError && (
            <p className="text-red-600 text-sm mb-3">{authError}</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold text-sm hover:bg-blue-700"
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  return <AdminDashboard onSignOut={handleSignOut} />;
}

// ─── Dashboard shell ────────────────────────────────────────────────────────

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">GPHA Bus Tracker — Admin</h1>
        <button
          onClick={onSignOut}
          className="text-sm text-gray-600 hover:text-red-600 border border-gray-300 px-3 py-1.5 rounded"
        >
          Sign out
        </button>
      </header>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        <BusesSection />
        <StopsSection />
      </div>
    </main>
  );
}

// ─── Buses section ──────────────────────────────────────────────────────────

function BusesSection() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    supabase
      .from('buses')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) showToast('Failed to load buses', 'error');
        else setBuses(data ?? []);
        setLoading(false);
      });
  }, []);

  async function handleToggle(bus: Bus) {
    setToggling(bus.id);
    const { error } = await supabase
      .from('buses')
      .update({ active: !bus.active })
      .eq('id', bus.id);
    if (error) {
      showToast(`Failed to update ${bus.name}`, 'error');
    } else {
      setBuses((prev) =>
        prev.map((b) => (b.id === bus.id ? { ...b, active: !b.active } : b))
      );
      showToast(
        `${bus.name} ${!bus.active ? 'activated' : 'deactivated'}`,
        'success'
      );
    }
    setToggling(null);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Buses</h2>
      {toast && <ToastBar toast={toast} />}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading buses…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border rounded text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Route</th>
                <th className="text-left px-4 py-3">Color</th>
                <th className="text-left px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr key={bus.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{bus.name}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.route}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: bus.color }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(bus)}
                      disabled={toggling === bus.id}
                      aria-label={`Toggle ${bus.name} active`}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        bus.active ? 'bg-green-500' : 'bg-gray-300'
                      } ${toggling === bus.id ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          bus.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Stops section ──────────────────────────────────────────────────────────

const DEFAULT_FORM: AddStopForm = {
  bus_id: '',
  name: '',
  latitude: '',
  longitude: '',
  order_index: '',
  geofence_radius_meters: '300',
};

function StopsSection() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [editingStop, setEditingStop] = useState<EditingStop | null>(null);
  const [addForm, setAddForm] = useState<AddStopForm>(DEFAULT_FORM);
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const busIdInitialized = useRef(false);

  function showToast(message: string, type: Toast['type']) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [busResult, stopResult] = await Promise.all([
      supabase.from('buses').select('*').order('name'),
      supabase
        .from('stops')
        .select('*')
        .order('bus_id')
        .order('order_index'),
    ]);
    if (busResult.error) {
      showToast('Failed to load buses', 'error');
    } else {
      const busData = busResult.data ?? [];
      setBuses(busData);
      if (!busIdInitialized.current && busData.length > 0) {
        setAddForm((f) => ({ ...f, bus_id: busData[0].id }));
        busIdInitialized.current = true;
      }
    }
    if (stopResult.error) {
      showToast('Failed to load stops', 'error');
    } else {
      setStops(stopResult.data ?? []);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddStop() {
    const { bus_id, name, latitude, longitude, order_index, geofence_radius_meters } =
      addForm;
    if (
      !bus_id ||
      !name.trim() ||
      !latitude ||
      !longitude ||
      !order_index ||
      !geofence_radius_meters
    ) {
      setAddError('All fields are required');
      return;
    }
    setAddError('');
    setSubmitting(true);
    const { error } = await supabase.from('stops').insert({
      bus_id,
      name: name.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      order_index: parseInt(order_index, 10),
      geofence_radius_meters: parseInt(geofence_radius_meters, 10),
    });
    if (error) {
      showToast('Failed to add stop', 'error');
    } else {
      showToast('Stop added', 'success');
      setAddForm((f) => ({
        ...DEFAULT_FORM,
        bus_id: f.bus_id,
      }));
      await fetchData();
    }
    setSubmitting(false);
  }

  async function handleSaveEdit() {
    if (!editingStop) return;
    setSaving(true);
    const { error } = await supabase
      .from('stops')
      .update({
        name: editingStop.name,
        geofence_radius_meters: editingStop.geofence_radius_meters,
      })
      .eq('id', editingStop.id);
    if (error) {
      showToast('Failed to save stop', 'error');
    } else {
      showToast('Stop saved', 'success');
      setStops((prev) =>
        prev.map((s) =>
          s.id === editingStop.id
            ? {
                ...s,
                name: editingStop.name,
                geofence_radius_meters: editingStop.geofence_radius_meters,
              }
            : s
        )
      );
      setEditingStop(null);
    }
    setSaving(false);
  }

  async function handleDelete(stop: Stop) {
    if (!confirm(`Delete stop "${stop.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('stops').delete().eq('id', stop.id);
    if (error) {
      showToast('Failed to delete stop', 'error');
    } else {
      showToast('Stop deleted', 'success');
      setStops((prev) => prev.filter((s) => s.id !== stop.id));
    }
  }

  const stopsByBus = buses.map((bus) => ({
    bus,
    busStops: stops.filter((s) => s.bus_id === bus.id),
  }));

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Stops</h2>
      {toast && <ToastBar toast={toast} />}

      {/* ── Add stop form ── */}
      <div className="bg-white border rounded p-4 mb-6">
        <h3 className="font-medium text-sm mb-3">Add Stop</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); void handleAddStop(); }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bus</label>
            <select
              value={addForm.bus_id}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, bus_id: e.target.value }))
              }
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.name} — {bus.route}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Stop name
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. Shama Junction"
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={addForm.latitude}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, latitude: e.target.value }))
              }
              placeholder="4.8977"
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={addForm.longitude}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, longitude: e.target.value }))
              }
              placeholder="-1.7553"
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Order index
            </label>
            <input
              type="number"
              value={addForm.order_index}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, order_index: e.target.value }))
              }
              placeholder="1"
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Geofence radius (m)
            </label>
            <input
              type="number"
              value={addForm.geofence_radius_meters}
              onChange={(e) =>
                setAddForm((f) => ({
                  ...f,
                  geofence_radius_meters: e.target.value,
                }))
              }
              placeholder="300"
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-3 flex items-center justify-between gap-3">
            {addError ? (
              <p className="text-red-600 text-sm">{addError}</p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add stop'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Stop list grouped by bus ── */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading stops…</p>
      ) : (
        <div className="space-y-6">
          {stopsByBus.map(({ bus, busStops }) => (
            <div key={bus.id}>
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bus.color }}
                />
                {bus.name} — {bus.route}
                <span className="text-gray-400 font-normal">
                  ({busStops.length} stop{busStops.length !== 1 ? 's' : ''})
                </span>
              </h3>

              {busStops.length === 0 ? (
                <p className="text-gray-400 text-sm pl-5">No stops yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border rounded text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2">#</th>
                        <th className="text-left px-4 py-2">Name</th>
                        <th className="text-left px-4 py-2">Lat</th>
                        <th className="text-left px-4 py-2">Lng</th>
                        <th className="text-left px-4 py-2">Geofence (m)</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {busStops.map((stop) => {
                        const isEditing = editingStop?.id === stop.id;
                        return (
                          <tr key={stop.id} className="border-t">
                            <td className="px-4 py-2 text-gray-500">
                              {stop.order_index}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingStop.name}
                                  onChange={(e) =>
                                    setEditingStop((prev) =>
                                      prev
                                        ? { ...prev, name: e.target.value }
                                        : prev
                                    )
                                  }
                                  className="border rounded px-2 py-0.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                stop.name
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {stop.latitude}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {stop.longitude}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingStop.geofence_radius_meters}
                                  onChange={(e) =>
                                    setEditingStop((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            geofence_radius_meters: parseInt(
                                              e.target.value,
                                              10
                                            ),
                                          }
                                        : prev
                                    )
                                  }
                                  className="border rounded px-2 py-0.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                stop.geofence_radius_meters
                              )}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {isEditing ? (
                                <span className="inline-flex gap-2 justify-end">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {saving ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingStop(null)}
                                    className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <span className="inline-flex gap-3 justify-end">
                                  <button
                                    onClick={() =>
                                      setEditingStop({
                                        id: stop.id,
                                        name: stop.name,
                                        geofence_radius_meters:
                                          stop.geofence_radius_meters,
                                      })
                                    }
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(stop)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Shared components ───────────────────────────────────────────────────────

function ToastBar({ toast }: { toast: Toast }) {
  return (
    <div
      className={`mb-4 px-4 py-2 rounded text-sm ${
        toast.type === 'success'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {toast.message}
    </div>
  );
}
