
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight,
  CheckCircle2, Clock3, Gauge, Layers3, Play, RotateCcw,
  Send, ShieldCheck, Trash2, Zap
} from "lucide-react";
import "./App.css";

const initialEvents = [
  { id: "EVT-1001", type: "PaymentReceived", status: "Success", attempts: 1, detail: "Payment processed", time: "Just now" },
  { id: "EVT-1002", type: "UserRegistered", status: "Success", attempts: 1, detail: "User saved", time: "Just now" },
  { id: "EVT-1003", type: "OrderCreated", status: "DLQ", attempts: 4, detail: "Service unavailable", time: "Just now" },
];

const initialMetrics = { total: 3, success: 2, retries: 3, dlq: 1, duplicates: 0 };

function Metric({ icon: Icon, label, value, note, color }) {
  return (
    <div className="metric card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${color}`}><Icon size={19} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState(initialEvents);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [maxRetries, setMaxRetries] = useState(3);
  const [baseDelay, setBaseDelay] = useState(1);
  const [idempotency, setIdempotency] = useState(true);
  const [failureMode, setFailureMode] = useState("transient");
  const [eventType, setEventType] = useState("OrderCreated");
  const [logs, setLogs] = useState([
    "System initialized",
    "Consumer group connected",
    "Retry policy: exponential backoff",
    "Dead-letter topic: events.DLT"
  ]);
  const [processed, setProcessed] = useState(["EVT-1001", "EVT-1002"]);
  const [counter, setCounter] = useState(1004);
  const [activeTab, setActiveTab] = useState("all");

  const addLog = (message) => {
    setLogs(old => [`${new Date().toLocaleTimeString()}  ${message}`, ...old].slice(0, 30));
  };

  const publishEvent = (mode = failureMode, type = eventType, replayId = null) => {
    const id = replayId ||
  (mode === "duplicate" && processed.length
    ? processed[0]
    : `EVT-${counter}`);
    if (!replayId) setCounter(n => n + 1);

    if (idempotency && processed.includes(id) && !replayId) {
      setMetrics(m => ({ ...m, total: m.total + 1, duplicates: m.duplicates + 1 }));
      addLog(`Duplicate ${id} ignored by idempotency guard`);
      return;
    }

    let attempts = 1;
    let status = "Success";
    let detail = "Event processed successfully";
    const eventLogs = [`Published ${id} to events.main`];

    if (mode === "transient") {
      attempts = maxRetries + 1;
      status = "Success";
      detail = `Recovered after ${maxRetries} retries`;
      for (let i = 1; i <= maxRetries; i++) {
        eventLogs.push(`Attempt ${i} failed; retry in ${baseDelay * 2 ** (i - 1)}s`);
      }
      eventLogs.push(`Attempt ${attempts} succeeded`);
    } else if (mode === "permanent") {
      attempts = maxRetries + 1;
      status = "DLQ";
      detail = "Max retries exceeded";
      for (let i = 1; i <= maxRetries; i++) {
        eventLogs.push(`Attempt ${i} failed; retry in ${baseDelay * 2 ** (i - 1)}s`);
      }
      eventLogs.push(`${id} routed to events.DLT`);
    } else if (mode === "duplicate") {
      if (idempotency && processed.includes(id)) {
        setMetrics(m => ({ ...m, total: m.total + 1, duplicates: m.duplicates + 1 }));
        addLog(`Duplicate ${id} blocked`);
        return;
      }
      detail = "First delivery processed";
    }

    const item = {
      id, type, status, attempts, detail,
      time: new Date().toLocaleTimeString()
    };

    setEvents(old => [item, ...old].slice(0, 100));
    setMetrics(m => ({
      total: m.total + 1,
      success: m.success + (status === "Success" ? 1 : 0),
      retries: m.retries + (attempts - 1),
      dlq: m.dlq + (status === "DLQ" ? 1 : 0),
      duplicates: m.duplicates
    }));

    if (status === "Success") setProcessed(old => [...new Set([...old, id])]);
    eventLogs.forEach(addLog);
  };

  const replay = (event) => {
    addLog(`Replaying ${event.id} from DLQ`);
    publishEvent("success", event.type, `${event.id}-R`);
  };

  const filteredEvents = useMemo(
    () => events.filter(e => activeTab === "all" ||
      (activeTab === "dlq" ? e.status === "DLQ" :
        activeTab === "retry" ? e.attempts > 1 : e.status === "Success")),
    [events, activeTab]
  );

  const successRate = metrics.total
    ? Math.round(metrics.success / metrics.total * 100)
    : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Zap size={24} /></div>
          <div><strong>StreamGuard</strong><small>RELIABILITY CONSOLE</small></div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item selected"><Gauge size={18} /> Overview</button>
        <button className="nav-item" onClick={() => setActiveTab("all")}><Layers3 size={18} /> Event stream</button>
        <button className="nav-item" onClick={() => setActiveTab("retry")}><RotateCcw size={18} /> Retry monitor</button>
        <button className="nav-item" onClick={() => setActiveTab("dlq")}><AlertTriangle size={18} /> Dead letter queue <span className="nav-count">{metrics.dlq}</span></button>

        <div className="sidebar-bottom">
          <div className="connection"><span className="pulse" /> Simulation running</div>
          <small>FRONTEND DEMO · NO BROKER CONNECTED</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="breadcrumb">Workspace <ArrowRight size={13} /> Reliability</div><h1>System Overview</h1></div>
          <div className="top-actions"><span className="demo-tag"><span className="pulse" /> LIVE SIMULATION</span><div className="avatar">SG</div></div>
        </header>

        <section className="welcome">
          <div>
            <div className="eyebrow"><Activity size={14} /> EVENT-DRIVEN INFRASTRUCTURE</div>
            <h2>Keep every event <span>moving.</span></h2>
            <p>Monitor delivery, recover from failures, and prevent duplicate processing.</p>
          </div>
          <div className="welcome-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><Zap size={42} /></div>
        </section>

        <section className="metrics-grid">
          <Metric icon={Layers3} label="Total events" value={metrics.total} note="All delivery attempts" color="purple" />
          <Metric icon={CheckCircle2} label="Successfully processed" value={metrics.success} note={`${successRate}% of all events`} color="green" />
          <Metric icon={RotateCcw} label="Retry attempts" value={metrics.retries} note="Recoverable failures" color="blue" />
          <Metric icon={AlertTriangle} label="Dead letter queue" value={metrics.dlq} note="Awaiting investigation" color="orange" />
        </section>

        <div className="content-grid">
          <section className="card simulator">
            <div className="section-heading"><div><span className="section-icon"><Send size={17} /></span><div><h3>Event simulator</h3><p>Publish a test event and simulate failures</p></div></div><span className="tag">TEST MODE</span></div>
            <label>Event type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}>
              <option>OrderCreated</option><option>PaymentReceived</option><option>UserRegistered</option><option>InventoryUpdated</option>
            </select>
            <label>Failure scenario</label>
            <div className="scenario-grid">
              <button className={`scenario ${failureMode === "success" ? "active" : ""}`} onClick={() => setFailureMode("success")}><CheckCircle2 size={17} /><strong>Success</strong><small>Normal delivery</small></button>
              <button className={`scenario ${failureMode === "transient" ? "active" : ""}`} onClick={() => setFailureMode("transient")}><RotateCcw size={17} /><strong>Transient</strong><small>Recover after retries</small></button>
              <button className={`scenario ${failureMode === "permanent" ? "active" : ""}`} onClick={() => setFailureMode("permanent")}><AlertTriangle size={17} /><strong>Permanent</strong><small>Route to DLQ</small></button>
              <button className={`scenario ${failureMode === "duplicate" ? "active" : ""}`} onClick={() => setFailureMode("duplicate")}><Layers3 size={17} /><strong>Duplicate</strong><small>Test idempotency</small></button>
            </div>
            <button className="primary-button" onClick={() => publishEvent()}><Play size={16} fill="currentColor" /> Publish test event <ArrowRight size={16} /></button>
            <p className="simulation-note">Simulation only: retries are calculated instantly, not executed with real delays.</p>
          </section>

          <section className="card settings">
            <div className="section-heading"><div><span className="section-icon blue"><Gauge size={17} /></span><div><h3>Reliability settings</h3><p>Adjust processing behavior</p></div></div></div>
            <div className="setting-row"><div><strong>Maximum retries</strong><small>Attempts before DLQ routing</small></div><select className="compact-select" value={maxRetries} onChange={e => setMaxRetries(Number(e.target.value))}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div className="setting-row"><div><strong>Base retry delay</strong><small>First backoff interval</small></div><select className="compact-select" value={baseDelay} onChange={e => setBaseDelay(Number(e.target.value))}><option value={1}>1 second</option><option value={2}>2 seconds</option><option value={5}>5 seconds</option></select></div>
            <div className="backoff-preview"><div className="backoff-title"><Clock3 size={15} /> Exponential backoff preview</div><div className="backoff-steps">{Array.from({length: maxRetries}, (_, i) => <div className="backoff-step" key={i}><span>Retry {i + 1}</span><strong>{baseDelay * 2 ** i}s</strong></div>)}</div><small>Formula: delay = base × 2<sup>attempt − 1</sup></small></div>
            <div className="setting-row idempotency-row"><div><strong>Idempotency guard</strong><small>Ignore already processed event IDs</small></div><button role="switch" aria-checked={idempotency} className={`toggle ${idempotency ? "on" : ""}`} onClick={() => setIdempotency(v => !v)}><span /></button></div>
            <div className="protection"><ShieldCheck size={17} /><span>{idempotency ? "Duplicate protection enabled" : "Duplicate protection disabled"}</span></div>
          </section>
        </div>

        <section className="card events-panel">
          <div className="section-heading events-heading"><div><span className="section-icon"><Activity size={17} /></span><div><h3>Event activity</h3><p>Recent processing outcomes and delivery history</p></div></div><button className="outline-button" onClick={() => { setEvents([]); addLog("Event table cleared"); }}><Trash2 size={14} /> Clear table</button></div>
          <div className="tabs">{[["all","All events"],["success","Successful"],["retry","Retried"],["dlq","Dead letter queue"]].map(([id,label]) => <button key={id} className={activeTab === id ? "tab active" : "tab"} onClick={() => setActiveTab(id)}>{label}</button>)}</div>
          <div className="table-wrap"><table><thead><tr><th>EVENT ID</th><th>EVENT TYPE</th><th>STATUS</th><th>ATTEMPTS</th><th>DETAILS</th><th>TIME / ACTION</th></tr></thead><tbody>
            {filteredEvents.length ? filteredEvents.map((e,i) => <tr key={`${e.id}-${i}`}><td className="event-id">{e.id}</td><td>{e.type}</td><td><span className={`status ${e.status.toLowerCase()}`}><span />{e.status}</span></td><td>{e.attempts}</td><td className="detail-cell">{e.detail}</td><td>{e.status === "DLQ" ? <button className="replay-button" onClick={() => replay(e)}><RotateCcw size={13} /> Replay</button> : e.time}</td></tr>) : <tr><td colSpan="6" className="empty">No events in this view. Publish a test event to get started.</td></tr>}
          </tbody></table></div>
        </section>

        <div className="bottom-grid">
          <section className="card logs-panel"><div className="section-heading"><div><span className="section-icon blue"><Activity size={17} /></span><div><h3>System logs</h3><p>Latest simulator activity</p></div></div><button className="icon-button" onClick={() => setLogs([])} title="Clear logs"><Trash2 size={15} /></button></div><div className="logs">{logs.length ? logs.map((log,i) => <div className="log-line" key={`${log}-${i}`}><span className="log-dot" />{log}</div>) : <p className="empty">No logs yet.</p>}</div></section>
          <section className="card architecture"><div className="section-heading"><div><span className="section-icon"><Layers3 size={17} /></span><div><h3>Processing pipeline</h3><p>Event lifecycle at a glance</p></div></div></div><div className="pipeline"><div className="pipe-node"><Send size={17}/><span>Producer</span></div><ArrowRight size={15}/><div className="pipe-node"><Layers3 size={17}/><span>Main queue</span></div><ArrowRight size={15}/><div className="pipe-node"><RotateCcw size={17}/><span>Retry</span></div></div><div className="pipe-branch"><span /><ArrowDownToLine size={15}/><div><AlertTriangle size={16}/><span>Dead letter queue (DLQ)</span></div></div><div className="pipeline-foot"><ShieldCheck size={15}/> Idempotency check protects the consumer.</div></section>
        </div>
        <footer>StreamGuard · Kafka Reliability Demonstration <span>Frontend simulation · React + Vite</span></footer>
      </main>
    </div>
  );
}
