
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDashboard,
  getParkingStatus,
  getParkingHistory,
  vehicleEntry,
  vehicleExit,
} from "@/lib/api";

export default function Home() {
  const [dashboard, setDashboard] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    totalCompletedSessions: 0,
    totalEarnings: 0,
  });

  const [slots, setSlots] = useState([]);
  const [history, setHistory] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refreshData = useCallback(async () => {
    const [dashboardData, statusData, historyData] =
      await Promise.all([
        getDashboard(),
        getParkingStatus(),
        getParkingHistory(),
      ]);

    setDashboard(dashboardData);
    setSlots(statusData.slots);
    setHistory(historyData.history);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        await refreshData();
        setError("");
      } catch (err) {
        setError(
          err.message +
            ". Check that the backend is running on port 5000."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshData]);

  async function handleEntry(event) {
    event.preventDefault();

    if (!vehicleNumber.trim()) {
      setError("Please enter a vehicle number.");
      setMessage("");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await vehicleEntry(
        vehicleNumber.trim().toUpperCase(),
        vehicleType
      );

      await refreshData();

      setVehicleNumber("");
      setMessage(
        `${result.vehicle.vehicleNumber} assigned to Slot ${result.slotNumber}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExit(number) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await vehicleExit(number);
      const receipt = result.receipt;

      await refreshData();

      setMessage(
        `Checkout complete: ${receipt.vehicleNumber} | ` +
          `${receipt.hours} hour(s) | Bill ₹${receipt.bill}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">PARKING MANAGEMENT</p>
          <h1>Parking Dashboard</h1>
          <p className="subtitle">
            Manage vehicles, parking slots and billing.
          </p>
        </div>

        <span className="live-status">
          ● {loading ? "Loading..." : error ? "Connection issue" : "System Ready"}
        </span>
      </header>

      {error && <p className="message">{error}</p>}

      <section className="stats">
        <article className="stat-card">
          <span>Total Slots</span>
          <strong>{dashboard.totalSlots}</strong>
          <small>Parking capacity</small>
        </article>

        <article className="stat-card available-card">
          <span>Available</span>
          <strong>{dashboard.availableSlots}</strong>
          <small>Slots free now</small>
        </article>

        <article className="stat-card occupied-card">
          <span>Occupied</span>
          <strong>{dashboard.occupiedSlots}</strong>
          <small>Vehicles parked</small>
        </article>

        <article className="stat-card">
          <span>Total Earnings</span>
          <strong>₹{dashboard.totalEarnings}</strong>
          <small>Completed parking sessions</small>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Vehicle Entry</h2>
              <p>Register a vehicle at the entrance.</p>
            </div>
            <span className="panel-icon">+</span>
          </div>

          <form onSubmit={handleEntry}>
            <label htmlFor="vehicleNumber">Vehicle Number</label>
            <input
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(event) =>
                setVehicleNumber(event.target.value)
              }
              placeholder="e.g. HR29AB1234"
              disabled={submitting}
            />

            <label htmlFor="vehicleType">Vehicle Type</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(event) =>
                setVehicleType(event.target.value)
              }
              disabled={submitting}
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting || loading}
            >
              {submitting ? "Please wait..." : "Register Vehicle"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <div className="pricing">
            <h3>Parking Rates</h3>
            <div>
              <span>First hour</span>
              <strong>₹30</strong>
            </div>
            <div>
              <span>Each additional hour</span>
              <strong>₹10</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Parking Slots</h2>
              <p>Live status from the backend.</p>
            </div>
            <button
              className="exit-button"
              onClick={async () => {
                try {
                  setError("");
                  await refreshData();
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              Refresh
            </button>
          </div>

          <div className="legend">
            <span><i className="dot green" /> Available</span>
            <span><i className="dot red" /> Occupied</span>
          </div>

          {loading ? (
            <p>Loading parking slots...</p>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => (
                <div
                  key={slot.slotNumber}
                  className={`slot ${
                    slot.vehicle ? "slot-occupied" : "slot-available"
                  }`}
                >
                  <span className="slot-label">SLOT</span>
                  <strong>
                    {String(slot.slotNumber).padStart(2, "0")}
                  </strong>

                  {slot.vehicle ? (
                    <>
                      <span className="vehicle-number">
                        {slot.vehicle.vehicleNumber}
                      </span>
                      <span className="slot-free">
                        {slot.vehicle.vehicleType}
                      </span>
                      <button
                        className="exit-button"
                        disabled={submitting}
                        onClick={() =>
                          handleExit(slot.vehicle.vehicleNumber)
                        }
                      >
                        Check Out
                      </button>
                    </>
                  ) : (
                    <span className="slot-free">Available</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel history-panel">
        <div className="panel-heading">
          <div>
            <h2>Parking History</h2>
            <p>Completed sessions and their bills.</p>
          </div>
          <strong>{history.length} records</strong>
        </div>

        {history.length === 0 ? (
          <p className="subtitle">No completed parking sessions yet.</p>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div
                className="history-item"
                key={`${item.vehicleNumber}-${item.exitTime}-${index}`}
              >
                <div>
                  <strong>{item.vehicleNumber}</strong>
                  <p>
                    Slot {item.slotNumber} · {item.vehicleType}
                  </p>
                </div>
                <div className="history-bill">
                  <strong>₹{item.bill}</strong>
                  <p>{item.hours} hour(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        Parking Management System · In-memory storage
      </footer>
    </main>
  );
}
