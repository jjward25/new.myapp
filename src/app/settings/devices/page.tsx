"use client";

// Part C's second revoke path (proposal-worker-pipeline.md): reply "REVOKE"
// to a Signal notification is the other one, once Signal is linked -- this
// page exists so revocation never depends solely on that channel being up.
// Reachable only because middleware.ts gates every non-/login route on the
// site session cookie already.
import React, { useCallback, useEffect, useState } from "react";

interface Device {
  deviceId: string;
  label: string;
  pairedAt: string;
  lastSeenAt: string | null;
}

const MAX_DEVICES = 3;

function formatDate(iso: string | null) {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DevicesSettingsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [thisDeviceId, setThisDeviceId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data.devices || []);
      setThisDeviceId(data.thisDeviceId || null);
    } catch {
      setError("Could not load paired devices.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (deviceId: string, label: string) => {
    if (!window.confirm(`Revoke "${label}"? It will need to be paired again to use Coder mode or content editing.`)) {
      return;
    }
    setRevokingId(deviceId);
    setError(null);
    try {
      const res = await fetch("/api/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Revoke failed.");
        return;
      }
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    } catch {
      setError("Network error while revoking.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <main className="mc flex min-h-screen flex-col items-center gap-6 p-3 md:px-10 md:pt-6 pb-16 w-full bg-[#0c0d10]">
      <div className="w-full max-w-[720px] flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#e7eaee]">Paired Devices</h1>
          <p className="text-[12px] text-[#8a919c] mt-1">
            Coder mode and content editing require one of these devices, in addition to being logged in
            (proposal-worker-pipeline.md Part C) — pairing is not a second login factor, it&apos;s a
            device-scoped lease on top of the same login. Capped at {MAX_DEVICES}.
          </p>
        </div>

        {error && (
          <div className="mc-panel p-2.5 text-[12px] text-[#e05b5b] border-[#e05b5b]/40">{error}</div>
        )}

        {!loaded && <div className="text-[12px] text-[#8a919c]">Loading…</div>}

        {loaded && devices.length === 0 && (
          <div className="mc-panel p-3 text-[12px] text-[#8a919c]">
            No devices paired yet. Pairing happens from the Coder toggle in Ask Hermes.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {devices.map((d) => (
            <div key={d.deviceId} className="mc-panel p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] text-[#e7eaee] flex items-center gap-2">
                  {d.label}
                  {d.deviceId === thisDeviceId && (
                    <span className="mc-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#35c48b]/15 border border-[#35c48b] text-[#35c48b]">
                      This device
                    </span>
                  )}
                </div>
                <div className="mc-mono text-[10px] text-[#5b626d] mt-0.5">
                  Paired {formatDate(d.pairedAt)} · Last used {formatDate(d.lastSeenAt)}
                </div>
              </div>
              <button
                onClick={() => revoke(d.deviceId, d.label)}
                disabled={revokingId === d.deviceId}
                className="mc-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#e05b5b]/15 border border-[#e05b5b] text-[#e05b5b] hover:bg-[#e05b5b]/25 disabled:opacity-40 shrink-0"
              >
                {revokingId === d.deviceId ? "Revoking…" : "Revoke"}
              </button>
            </div>
          ))}
        </div>

        {loaded && devices.length >= MAX_DEVICES && (
          <p className="text-[11px] text-[#8a919c]">
            Device cap reached — revoke one above before pairing another.
          </p>
        )}
      </div>
    </main>
  );
}
