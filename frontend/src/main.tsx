import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import mermaid from 'mermaid';
import { io } from 'socket.io-client';
import api from './api/client';
import './index.css';

function Layout({ children }: { children: React.ReactNode }) {
  return <div className='max-w-6xl mx-auto p-4'><h1 className='text-3xl font-bold'>JEET</h1><nav className='flex gap-4 my-3 text-blue-600'><Link to='/'>Home</Link><Link to='/auth'>Login</Link><Link to='/selector'>Selector</Link><Link to='/doubts'>Doubts</Link></nav>{children}</div>;
}

function Home() { return <Layout><p>Educational platform for Class 1-12 with Mission Board for Class 10 & 12.</p></Layout>; }

function Auth() {
  const [email, setEmail] = useState('student@jeet.app'); const [password, setPassword] = useState('password123');
  const nav = useNavigate();
  const login = async () => { const { data } = await api.post('/auth/login', { email, password }); localStorage.setItem('token', data.token); nav('/selector'); };
  return <Layout><div className='space-y-2'><input className='border p-2' value={email} onChange={e=>setEmail(e.target.value)} /><input className='border p-2' type='password' value={password} onChange={e=>setPassword(e.target.value)} /><button className='bg-blue-600 text-white px-3 py-2' onClick={login}>Login</button><button className='bg-red-500 text-white px-3 py-2 ml-2' onClick={()=>alert('Google OAuth endpoint available at /api/auth/google')}>Google OAuth</button></div></Layout>;
}

function Selector() {
  const [classLevel, setClassLevel] = useState(10); const [board, setBoard] = useState('CBSE'); const nav = useNavigate();
  const go = () => ([10,12].includes(classLevel) ? nav(`/mission?classLevel=${classLevel}&board=${board}`) : nav(`/browse?classLevel=${classLevel}&board=${board}`));
  return <Layout><div className='space-y-2'><select className='border p-2' value={classLevel} onChange={e=>setClassLevel(Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i+1}>{i+1}</option>)}</select><select className='border p-2 ml-2' value={board} onChange={e=>setBoard(e.target.value)}><option>CBSE</option><option>ICSE</option><option>Maharashtra State</option></select><button className='ml-2 bg-green-600 text-white px-3 py-2' onClick={go}>Continue</button></div></Layout>;
}

function Browser() {
  const params = new URLSearchParams(location.search);
  const [data, setData] = useState<any>({ subjects: [], chapters: [] });
  const [q,setQ]=useState('');
  const fetchData = async () => setData((await api.get('/catalog',{params:{classLevel:params.get('classLevel'),board:params.get('board'),q}})).data);
  useEffect(()=>{ fetchData(); },[]);
  return <Layout><h2 className='font-semibold'>Subject Browser</h2><input className='border p-1' placeholder='Search topic' value={q} onChange={e=>setQ(e.target.value)} /><button className='ml-2 bg-slate-700 text-white px-2' onClick={fetchData}>Search</button><div className='grid grid-cols-2 gap-3 mt-3'>{data.chapters.map((c:any)=><div key={c.id} className='border p-2 rounded'><p className='font-medium'>{c.title}</p><p>{c.notes}</p><p className='text-sm'>Practice: {(c.practice_questions||[]).join(', ')}</p></div>)}</div></Layout>;
}

function MissionBoard() {
  const params = new URLSearchParams(location.search); const classLevel = Number(params.get('classLevel')||10); const board = params.get('board')||'CBSE';
  const [plans,setPlans]=useState<any[]>([]); const [lectures,setLectures]=useState<any[]>([]); const [prediction,setPrediction]=useState<any>(null); const [flow, setFlow]=useState('graph TD;A[Start]-->B[Revise]-->C[Mock Test]');
  const [summary,setSummary]=useState<any>(null);
  useEffect(()=>{ api.get('/mission/prebuilt',{params:{classLevel,board}}).then(r=>setPlans(r.data.plans)); api.get('/lectures/recommend',{params:{classLevel,board,subject:'Mathematics',chapter:'Quadratic'}}).then(r=>setLectures(r.data)); },[classLevel,board]);
  const exportSummary = () => { if(!summary) return; const pdf = new jsPDF(); pdf.text(JSON.stringify(summary,null,2),10,10); pdf.save('summary.pdf'); };
  const renderMermaid = async () => { const el = document.getElementById('merm'); if (el) { const { svg } = await mermaid.render('m1', flow); el.innerHTML = svg; }};
  useEffect(()=>{ renderMermaid(); },[flow]);
  const askPredictor = async () => setPrediction((await api.post('/predict/top_questions',{query:'Most probable chapters for CBSE Physics',board:'CBSE',subject:'Physics',class_level:12})).data);
  const createSummary = async () => setSummary((await api.post('/summary',{chapter:'Quadratic Equations',formulas:['D=b²-4ac'],definitions:['Polynomial'],diagrams:['Parabola'],pyqs:['Find roots'],concepts:['Discriminant']})).data);
  const saveLecture = async (lec:any) => api.post('/mission/custom',{title:'Lecture follow-up',classLevel,board,tasks:[{task:`Watch ${lec.educator}`,completed:false}]});
  return <Layout>
    <h2 className='text-xl font-semibold'>Mission Board (Class {classLevel})</h2>
    <div className='grid grid-cols-2 gap-3'>
      <section className='border p-2'><h3 className='font-medium'>AI Strategy Planner</h3>{plans.map((p,i)=><div key={i}><p>{p.name}</p><p className='text-xs'>{p.schedule}</p></div>)}<button className='bg-blue-600 text-white px-2 py-1 mt-2' onClick={()=>api.post('/mission/custom',{title:'My custom plan',classLevel,board,tasks:[{task:'Revise optics',completed:false,deadline:'2026-03-20'}]})}>Create Custom Strategy</button></section>
      <section className='border p-2'><h3 className='font-medium'>Lecture Recommendations</h3>{lectures.map((l:any)=><div key={l.id} className='mb-2'><a href={l.link} className='text-blue-600'>{l.educator}</a><p className='text-xs'>{l.reason}</p><button className='text-sm underline' onClick={()=>saveLecture(l)}>Save to Strategy</button></div>)}</section>
      <section className='border p-2'><h3 className='font-medium'>One-page Summary</h3><button className='bg-slate-700 text-white px-2 py-1 mr-2' onClick={createSummary}>Generate</button><button className='bg-green-700 text-white px-2 py-1' onClick={exportSummary}>Export PDF</button><pre className='text-xs'>{summary && JSON.stringify(summary.printable,null,2)}</pre></section>
      <section className='border p-2'><h3 className='font-medium'>Flowchart Builder (Mermaid)</h3><textarea className='border w-full h-24' value={flow} onChange={e=>setFlow(e.target.value)}></textarea><div id='merm' className='bg-white'></div></section>
      <section className='border p-2 col-span-2'><h3 className='font-medium'>Question Predictor Bot</h3><button className='bg-purple-700 text-white px-2 py-1' onClick={askPredictor}>Ask Predictor</button><pre className='text-xs'>{prediction && JSON.stringify(prediction,null,2)}</pre></section>
    </div>
  </Layout>;
}

function Doubts() {
  const [list,setList]=useState<any[]>([]); const [title,setTitle]=useState('Need help with derivation'); const socket = useMemo(()=>io('http://localhost:4000'),[]);
  const refresh = async ()=> setList((await api.get('/doubts')).data);
  useEffect(()=>{ refresh(); socket.on('doubt:created', refresh); return ()=>{socket.disconnect();}; },[]);
  const post = async ()=> { const item=(await api.post('/doubts',{subject:'Physics',chapter:'Ray Optics',title,body:'How to derive lens maker?',urgent:true,boardCritical:true})).data; socket.emit('doubt:new', item); };
  return <Layout><h2>Doubt Forum</h2><input className='border p-2' value={title} onChange={e=>setTitle(e.target.value)} /><button className='ml-2 bg-blue-600 text-white px-2 py-1' onClick={post}>Post Doubt</button><div>{list.map((d:any)=><div key={d.id} className='border p-2 mt-2'><p>{d.title}</p><p className='text-xs'>Upvotes: {d.upvotes} | Solved: {String(d.solved)}</p></div>)}</div></Layout>;
}

function AdminUpload() { return <Layout><h2>Admin upload panel</h2><p>Upload board papers through backend ingestion pipeline endpoint (extensible).</p></Layout>; }

function RequireAuth({ children }: { children: JSX.Element }) { return localStorage.getItem('token') ? children : <Navigate to='/auth'/>; }

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><Routes><Route path='/' element={<Home/>}/><Route path='/auth' element={<Auth/>}/><Route path='/selector' element={<RequireAuth><Selector/></RequireAuth>}/><Route path='/browse' element={<RequireAuth><Browser/></RequireAuth>}/><Route path='/mission' element={<RequireAuth><MissionBoard/></RequireAuth>}/><Route path='/doubts' element={<RequireAuth><Doubts/></RequireAuth>}/><Route path='/admin' element={<RequireAuth><AdminUpload/></RequireAuth>}/></Routes></BrowserRouter></React.StrictMode>);
