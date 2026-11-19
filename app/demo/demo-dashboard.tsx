'use client'
import Link from 'next/link'
import { useMemo,useState } from 'react'
type Item={id:number;date:string;name:string;category:string;amount:number;type:'expense'|'income'}
const seed:Item[]=[
 {id:1,date:'2026-11-18',name:'Monthly salary',category:'Salary',amount:90000,type:'income'},
 {id:2,date:'2026-11-18',name:'Groceries and vegetables',category:'Groceries',amount:2350,type:'expense'},
 {id:3,date:'2026-11-17',name:'Metro and cab',category:'Transport',amount:630,type:'expense'},
 {id:4,date:'2026-11-15',name:'Mobile and internet',category:'Bills',amount:1199,type:'expense'},
 {id:5,date:'2026-11-13',name:'Dining out',category:'Food',amount:850,type:'expense'},
 {id:6,date:'2026-11-10',name:'Electricity',category:'Bills',amount:1680,type:'expense'},
 {id:7,date:'2026-11-07',name:'Household shopping',category:'Shopping',amount:1250,type:'expense'},
]
const curr=(n:number)=>'₹'+n.toLocaleString('en-IN',{maximumFractionDigits:0})
const categories=['Food','Groceries','Transport','Bills','Shopping','Health','Education','Entertainment','Other']
export default function Demo(){
 const [items,setItems]=useState<Item[]>(seed)
 const [tab,setTab]=useState('Overview')
 const [amount,setAmount]=useState(''),[category,setCategory]=useState('Food'),[note,setNote]=useState('')
 const [investments,setInvestments]=useState(85000),[emergency,setEmergency]=useState(30000)
 const [assetValue,setAssetValue]=useState(''),[assetType,setAssetType]=useState('Investment')
 const salary=90000,emi=19900,budget=15000,savings=10000,loan=2192890
 const expense=items.filter(x=>x.type==='expense').reduce((a,x)=>a+x.amount,0)
 const income=items.filter(x=>x.type==='income').reduce((a,x)=>a+x.amount,0)
 const groups=useMemo(()=>categories.map(name=>({name,value:items.filter(i=>i.type==='expense'&&i.category===name).reduce((a,i)=>a+i.amount,0)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value),[items])
 function add(e:React.FormEvent){e.preventDefault();const value=Number(amount);if(!Number.isFinite(value)||value<=0)return;setItems([{id:Date.now(),date:new Date().toLocaleDateString('en-CA'),name:note.trim()||'Demo expense',category,amount:value,type:'expense'},...items]);setAmount('');setNote('');setTab('Transactions')}
 function addAsset(e:React.FormEvent){e.preventDefault();const n=Number(assetValue);if(!Number.isFinite(n)||n<=0)return;if(assetType==='Investment')setInvestments(investments+n);else setEmergency(emergency+n);setAssetValue('')}
 function exportDemo(){const rows=[['Date','Type','Category','Amount','Note'],...items.map(i=>[i.date,i.type,i.category,String(i.amount),i.name])];const csv=rows.map(row=>row.map(v=>'"'+v.replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='wealthtrack-demo.csv';a.click();URL.revokeObjectURL(url)}
 const stats=[['Monthly income',curr(income),'Example salary credited'],['Monthly spending',curr(expense),curr(budget)+' target'],['Available after EMI',curr(income-expense-emi),'Example cash flow'],['Total investments',curr(investments),'Emergency '+curr(emergency)]]
 return <div className="shell demo-shell">
  <aside className="sidebar"><div className="brand"><span className="brandmark">✦</span> Wealth<span>Track</span></div><div className="sidecaption">EXPLORE THE EXPERIENCE</div><nav>{['Overview','Transactions','Investments','Home Loan','Reports'].map(name=><button key={name} className={tab===name?'nav active':'nav'} onClick={()=>setTab(name)}>{name==='Overview'?'◫':name==='Transactions'?'⇄':name==='Investments'?'◈':name==='Home Loan'?'⌂':'▥'} &nbsp; {name}</button>)}</nav><div className="sidebottom"><p>Sample data only. Nothing is saved to your account.</p><Link href="/login">← Return to real login</Link></div></aside>
  <main className="content">
   <div className="demo-banner"><span>✳ &nbsp; LIVE DEMO MODE</span><span>Fictional data · No account required</span></div>
   <header><div><div className="eyebrow">WEALTHTRACK • INTERACTIVE PREVIEW</div><h1>{tab==='Overview'?'Your financial overview':tab}</h1><p className="subtitle">Explore the app using sample transactions. Changes reset when you refresh.</p></div><div className="avatar">D</div></header>
   {tab==='Overview'&&<>
    <div className="metrics">{stats.map(s=><div className="metric" key={s[0]}><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></div>)}</div>
    <div className="two"><section className="panel"><div className="panelhead"><h2>Where the money goes</h2><span>NOVEMBER 2026</span></div>{groups.map((g,i)=><div className="breakdown" key={g.name}><div className="breakrow"><span>{g.name}</span><b>{curr(g.value)}</b></div><div className="track"><div style={{width:(g.value/Math.max(1,expense)*100)+'%',background:['#a195ff','#5bdac2','#e5ab77','#7daffa'][i%4]}}/></div></div>)}</section>
    <section className="panel"><div className="panelhead"><h2>Your goals</h2><span>EXAMPLE VALUES</span></div><div className="goal"><span>Monthly savings target</span><strong>{curr(savings)}</strong></div><div className="goal"><span>Emergency fund</span><strong>{curr(emergency)}</strong></div><div className="goal"><span>Home loan balance</span><strong>{curr(loan)}</strong></div><div className="goal"><span>EMI per month</span><strong>{curr(emi)}</strong></div></section></div>
    <section className="panel"><div className="panelhead"><h2>Recent activity</h2><button className="linkbutton" onClick={()=>setTab('Transactions')}>View transactions →</button></div><DemoTable data={items.slice(0,5)}/></section>
   </>}
   {tab==='Transactions'&&<><section className="panel"><div className="panelhead"><h2>Add sample expense</h2><span>TRY IT OUT</span></div><form className="formgrid" onSubmit={add}><label>Amount (₹)<input value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" required/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="wide">Description<input value={note} maxLength={120} onChange={e=>setNote(e.target.value)} placeholder="For example, coffee"/></label><button className="primary" type="submit">Add demo transaction</button></form></section><section className="panel"><div className="panelhead"><h2>Sample transactions</h2><button className="secondary" onClick={exportDemo}>Export demo CSV ↓</button></div><DemoTable data={items}/></section></>}
   {tab==='Investments'&&<><div className="metrics twoMetrics"><div className="metric"><span>Investments</span><strong>{curr(investments)}</strong></div><div className="metric"><span>Emergency fund</span><strong>{curr(emergency)}</strong></div></div><section className="panel"><h2>Try adding a sample balance</h2><form onSubmit={addAsset} className="formgrid"><label>Amount (₹)<input type="number" min="1" required value={assetValue} onChange={e=>setAssetValue(e.target.value)}/></label><label>Asset type<select value={assetType} onChange={e=>setAssetType(e.target.value)}><option>Investment</option><option>Emergency Fund</option></select></label><button className="primary">Add sample balance</button></form></section></>}
   {tab==='Home Loan'&&<><div className="metrics twoMetrics"><div className="metric"><span>Outstanding principal</span><strong>{curr(loan)}</strong></div><div className="metric"><span>Monthly EMI</span><strong>{curr(emi)}</strong></div></div><section className="panel"><h2>Home loan snapshot</h2><p className="subtitle">This preview uses an example outstanding amount and EMI. Real loan updates are available after account sign-in.</p></section></>}
   {tab==='Reports'&&<section className="panel"><div className="panelhead"><h2>Monthly spending report</h2><button className="secondary" onClick={exportDemo}>Download CSV</button></div><div className="goal"><span>Income</span><strong>{curr(income)}</strong></div><div className="goal"><span>Expenses</span><strong>{curr(expense)}</strong></div><div className="goal"><span>Money after expenses and EMI</span><strong>{curr(income-expense-emi)}</strong></div><h2 style={{marginTop:26}}>Category totals</h2>{groups.map(g=><div className="goal" key={g.name}><span>{g.name}</span><strong>{curr(g.value)}</strong></div>)}</section>}
   <div className="demo-actions"><button className="secondary" onClick={()=>{setItems(seed);setInvestments(85000);setEmergency(30000)}}>↻ Reset sample data</button><Link href="/login">Sign in to save real data →</Link></div>
  </main>
 </div>
}
function DemoTable({data}:{data:Item[]}){return <div className="tablewrap"><table><thead><tr><th>Date</th><th>Activity</th><th>Category</th><th>Amount</th></tr></thead><tbody>{data.map(t=><tr key={t.id}><td>{t.date}</td><td><b>{t.name}</b></td><td>{t.category}</td><td className={t.type==='income'?'green':''}>{t.type==='income'?'+':'−'}{curr(t.amount)}</td></tr>)}</tbody></table></div>}
