import React, {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'

const API='http://localhost:8080/api'

function App(){
  const [form,setForm]=useState({eventId:'E101',orderId:'O1001',status:'SUCCESS'})
  const [events,setEvents]=useState([])
  const [dlq,setDlq]=useState([])
  const [message,setMessage]=useState('Ready')
  const [loading,setLoading]=useState(false)

  const load=async()=>{
    try{
      const [e,d]=await Promise.all([
        fetch(API+'/events').then(r=>r.json()),
        fetch(API+'/dlq').then(r=>r.json())
      ])
      setEvents(e); setDlq(d)
    }catch{setMessage('Backend not reachable. Start Spring Boot first.')}
  }

  useEffect(()=>{load(); const x=setInterval(load,1500); return()=>clearInterval(x)},[])

  const send=async()=>{
    setLoading(true); setMessage('Sending event to Kafka...')
    try{
      const r=await fetch(API+'/events',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(form)
      })
      const data=await r.json()
      setMessage(data.message || 'Event sent')
      setTimeout(load,500)
    }catch{setMessage('Could not connect to backend')}
    setLoading(false)
  }

  const set=(k,v)=>setForm({...form,[k]:v})

  return <div className="page">
    <header>
      <div>
        <h1>Kafka Reliability Monitor</h1>
        <p>Retry • Dead Letter Queue • Idempotency</p>
      </div>
      <span className="live">● LIVE</span>
    </header>

    <main>
      <section className="card form">
        <h2>Send Event</h2>
        <label>Event ID</label>
        <input value={form.eventId} onChange={e=>set('eventId',e.target.value)}/>
        <label>Order ID</label>
        <input value={form.orderId} onChange={e=>set('orderId',e.target.value)}/>
        <label>Status</label>
        <select value={form.status} onChange={e=>set('status',e.target.value)}>
          <option>SUCCESS</option><option>FAIL</option>
        </select>
        <button onClick={send} disabled={loading}>{loading?'Sending...':'Send Event'}</button>
        <div className="hint">{message}</div>
      </section>

      <section className="card">
        <div className="titleRow"><h2>Event Processing</h2><button className="small" onClick={load}>Refresh</button></div>
        <div className="tableWrap">
          <table><thead><tr><th>Event ID</th><th>Order</th><th>Status</th><th>Attempts</th><th>Time</th></tr></thead>
          <tbody>{events.length?events.map((e,i)=><tr key={i}>
            <td>{e.eventId}</td><td>{e.orderId}</td><td><span className={'badge '+e.status}>{e.status}</span></td><td>{e.attempts}</td><td>{e.time?.slice(11,19)}</td>
          </tr>):<tr><td colSpan="5">No events yet</td></tr>}</tbody></table>
        </div>
      </section>

      <section className="card dlq">
        <h2>Dead Letter Queue</h2>
        {dlq.length?<div>{dlq.map((e,i)=><div className="dlqItem" key={i}>
          <b>{e.eventId}</b><span>{e.orderId}</span><span>Failed after retries</span>
        </div>)}</div>:<p className="empty">No failed events in DLQ</p>}
      </section>

      <section className="card info">
        <h2>How it works</h2>
        <div className="steps">
          <div><b>1</b><span>Event → Kafka <small>orders topic</small></span></div>
          <div><b>2</b><span>Failure → Retry <small>1s → 2s → 4s</small></span></div>
          <div><b>3</b><span>Repeated failure → DLQ <small>after max attempts</small></span></div>
          <div><b>4</b><span>Duplicate ID → Ignore <small>idempotency</small></span></div>
        </div>
      </section>
    </main>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>)
