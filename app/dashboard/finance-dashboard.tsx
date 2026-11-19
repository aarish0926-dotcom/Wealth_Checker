'use client'
import { useEffect,useMemo,useState } from 'react'
import { createClient } from '../../lib/supabase/client'
type Tx={id:string;amount:number;category:string;kind:string;occurred_on:string;note:string}
type Holding={id:string;name:string;value:number;kind:string}
const money=(n:number)=>'₹'+Math.round(n).toLocaleString('en-IN')
const cats=['Food','Groceries','Transport','Shopping','Bills','Rent','Health','Entertainment','Education','Other']
export default function FinanceDashboard({email,signOut}:{email:string;signOut:()=>Promise<void>}){
 const db=useMemo(()=>createClient(),[])
 const [tab,setTab]=useState('Overview'),[tx,setTx]=useState<Tx[]>([]),[hold,setHold]=useState<Holding[]>([])
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 const [salary,setSalary]=useState(90000),[budget,setBudget]=useState(15000),[target,setTarget]=useState(10000),[emi,setEmi]=useState(19900),[principal,setPrincipal]=useState(2192890)
 const [form,setForm]=useState({amount:'',category:'Food',kind:'expense',occurred_on:new Date().toLocaleDateString('en-CA'),note:''})
 const [investment,setInvestment]=useState({name:'',value:'',kind:'Investment'})
 const [review,setReview]=useState<Tx|null>(null)
 async function load(){
  setLoading(true)
  const [t,h,s]=await Promise.all([db.from('transactions').select('*').order('occurred_on',{ascending:false}).limit(2000),db.from('holdings').select('*').order('created_at',{ascending:false}),db.from('finance_settings').select('*').maybeSingle()])
  if(t.error||h.error||s.error)setError(t.error?.message||h.error?.message||s.error?.message||'Unable to load records')
  else {setTx(t.data||[]);setHold(h.data||[]);if(s.data){setSalary(Number(s.data.salary));setBudget(Number(s.data.expense_budget));setTarget(Number(s.data.savings_target));setEmi(Number(s.data.emi));setPrincipal(Number(s.data.loan_balance))}}
  setLoading(false)
 }
 useEffect(()=>{void load()},[])
 const month=new Date().toLocaleDateString('en-CA').slice(0,7)
 const monthly=tx.filter(t=>t.occurred_on.startsWith(month))
 const expenses=monthly.filter(t=>t.kind==='expense').reduce((a,t)=>a+Number(t.amount),0)
 const income=monthly.filter(t=>t.kind==='income').reduce((a,t)=>a+Number(t.amount),0)
 const unreviewed=tx.filter(t=>t.kind==='expense'&&(!t.category||t.category==='Uncategorized'))
 const spendByCat=cats.map(c=>({name:c,value:monthly.filter(t=>t.kind==='expense'&&t.category===c).reduce((a,t)=>a+Number(t.amount),0)})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value)
 const invest=hold.filter(h=>h.kind==='Investment').reduce((a,h)=>a+Number(h.value),0)
 const emergency=hold.filter(h=>h.kind==='Emergency Fund').reduce((a,h)=>a+Number(h.value),0)
 async function addTx(e:React.FormEvent){e.preventDefault();setError('');setSaving(true)
  const {data:{user}}=await db.auth.getUser()
  const amount=Number(form.amount)
  if(!user||!Number.isFinite(amount)||amount<=0){setError('Enter a valid positive amount');setSaving(false);return}
  const {error:err}=await db.from('transactions').insert({...form,amount,user_id:user.id})
  if(err)setError(err.message);else {setForm({...form,amount:'',note:''});await load()}
  setSaving(false)
 }
 async function deleteTx(id:string){if(!confirm('Delete this transaction?'))return;const {error:err}=await db.from('transactions').delete().eq('id',id);if(err)setError(err.message);else await load()}
 async function classify(t:Tx,category:string){
  setSaving(true);setError('')
  const {error:err}=await db.from('transactions').update({category}).eq('id',t.id)
  if(err)setError(err.message);else{setReview(null);await load()}
  setSaving(false)
 }
 async function addHolding(e:React.FormEvent){e.preventDefault();setSaving(true);const {data:{user}}=await db.auth.getUser()
  const value=Number(investment.value)
  if(!user||value<0||!Number.isFinite(value)){setError('Invalid holding');setSaving(false);return}
  const {error:err}=await db.from('holdings').insert({...investment,value,user_id:user.id})
  if(err)setError(err.message);else{setInvestment({...investment,name:'',value:''});await load()}setSaving(false)
 }
 async function saveSettings(e:React.FormEvent){e.preventDefault();setError('');setSaving(true)
  const {data:{user}}=await db.auth.getUser();if(!user)return
  const {error:err}=await db.from('finance_settings').upsert({user_id:user.id,salary,expense_budget:budget,savings_target:target,emi,loan_balance:principal})
  if(err)setError(err.message);else setError('Settings saved successfully');setSaving(false)
 }
 function parseCSV(text:string){
  const rows:string[][]=[];let field='',row:string[]=[],quote=false
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){field+='"';i++}else quote=!quote}else if(c===','&&!quote){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows
 }
 async function importCSV(file:File){setError('');setSaving(true);try{
  const rows=parseCSV(await file.text());if(rows.length<2)throw Error('CSV has no transaction rows')
  const headers=rows[0].map(x=>x.trim().toLowerCase().replace(/[^a-z]/g,''))
  const idx=(...names:string[])=>headers.findIndex(h=>names.includes(h))
  const di=idx('date','occurredon','transactiondate'),ai=idx('amount'),ki=idx('type','kind'),ci=idx('category'),ni=idx('note','description','narration')
  if(di<0||ai<0)throw Error('CSV must contain Date and Amount columns')
  const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Please log in again')
  const existing=new Set(tx.map(t=>[t.occurred_on,Number(t.amount).toFixed(2),t.kind,t.note.trim()].join('|')))
  const batch:any[]=[];for(const r of rows.slice(1)){
   const raw=r[di]?.trim()||'';let date=raw
   if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)){const [d,m,y]=raw.split('/');date=`${y}-${m}-${d}`}
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue
   const n=Number((r[ai]||'').replace(/[₹, ]/g,''));if(!Number.isFinite(n)||n===0)continue
   const kind=(ki>=0&&/income|credit/i.test(r[ki]))||n<0?'income':'expense'
   const amount=Math.abs(n),note=(ni>=0?r[ni]:'')||'',category=(ci>=0?r[ci]:'')||(kind==='expense'?'Uncategorized':'Salary')
   const key=[date,amount.toFixed(2),kind,note.trim()].join('|')
   if(existing.has(key))continue;existing.add(key);batch.push({user_id:user.id,occurred_on:date,amount,kind,category,note})
  }
  if(!batch.length)throw Error('No new valid transactions. Check date format YYYY-MM-DD or DD/MM/YYYY')
  const {error:err}=await db.from('transactions').insert(batch.slice(0,500));if(err)throw err
  await load();setError(`Imported ${Math.min(batch.length,500)} transactions (duplicates skipped).`)
 }catch(e){setError(e instanceof Error?e.message:'Import failed')}finally{setSaving(false)}}
 function exportCSV(){const rows=[['Date','Type','Category','Amount','Note'],...tx.map(t=>[t.occurred_on,t.kind,t.category,String(t.amount),t.note||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='wealthtrack-transactions.csv';a.click();URL.revokeObjectURL(url)}
 return <div className="shell"><aside className="sidebar"><div className="brand"><span className="brandmark">◈</span> Wealth<span>Track</span></div><div className="sidecaption">YOUR MONEY, CLEARLY.</div><nav>{['Overview','Transactions','Investments','Home Loan','Reports','Settings'].map(name=><button key={name} className={tab===name?'nav active':'nav'} onClick={()=>setTab(name)}>{({Overview:'◫',Transactions:'⇄',Investments:'◈','Home Loan':'⌂',Reports:'▥',Settings:'⚙'} as Record<string,string>)[name]} &nbsp; {name}</button>)}</nav><div className="sidebottom">Secure, private account<div className="tiny">{email}</div><form action={signOut}><button className="logout">Sign out ↗</button></form></div></aside>
 <main className="content"><header><div><div className="eyebrow">PERSONAL FINANCE CONTROL CENTER</div><h1>{tab==='Overview'?'Financial overview':tab}</h1><p className="subtitle">Manage your money with clarity and confidence.</p></div><div className="avatar">{email.slice(0,1).toUpperCase()}</div></header>
 {error&&<div className="notice" role="status">{error}<button onClick={()=>setError('')}>×</button></div>}
 {loading?<div className="panel">Loading your records…</div>:<>
 {tab==='Overview'&&<>{unreviewed.length>0&&<div className="review-banner"><span>✦</span><div><strong>{unreviewed.length} expenses need your review</strong><p>Imported payments can be categorized in one tap. Tell WealthTrack what you spent them on.</p></div><button onClick={()=>setReview(unreviewed[0])}>Categorize now →</button></div>}<div className="metrics"><div className="metric"><span>Monthly income</span><strong>{money(income||salary)}</strong><small>Salary target: {money(salary)}</small></div><div className="metric"><span>Spent this month</span><strong>{money(expenses)}</strong><small>{Math.round(expenses/Math.max(1,budget)*100)}% of {money(budget)} budget</small></div><div className="metric"><span>Net cash flow</span><strong>{money((income||salary)-expenses-emi)}</strong><small>After expenses & home loan EMI</small></div><div className="metric"><span>Investment value</span><strong>{money(invest)}</strong><small>Emergency fund: {money(emergency)}</small></div></div>
 <div className="two"><section className="panel"><div className="panelhead"><h2>Spending breakdown</h2><span>THIS MONTH</span></div>{spendByCat.length?spendByCat.slice(0,6).map((c,i)=><div className="breakdown" key={c.name}><div className="breakrow"><span>{c.name}</span><b>{money(c.value)}</b></div><div className="track"><div style={{width:`${c.value/Math.max(1,expenses)*100}%`,background:['#8f83ff','#3cd5ae','#f7ac67','#62aaff'][i%4]}}/></div></div>):<p className="empty">No expenses yet. Add your first transaction.</p>}</section><section className="panel"><div className="panelhead"><h2>Financial goals</h2><span>YOUR PROGRESS</span></div><div className="goal"><span>Monthly savings target</span><strong>{money(target)}</strong></div><div className="goal"><span>Emergency fund</span><strong>{money(emergency)}</strong></div><div className="goal"><span>Home loan balance</span><strong>{money(principal)}</strong></div><div className="goal"><span>Monthly EMI</span><strong>{money(emi)}</strong></div></section></div>
 <div className="panel"><div className="panelhead"><h2>Recent transactions</h2><button className="linkbutton" onClick={()=>setTab('Transactions')}>View all →</button></div><TransactionTable rows={tx.slice(0,6)} onDelete={deleteTx} onReview={setReview}/></div></>}
 {tab==='Transactions'&&<><section className="panel"><div className="panelhead"><h2>Add transaction</h2><span>DAILY MONEY TRACKER</span></div><form className="formgrid" onSubmit={addTx}><label>Amount (₹)<input type="number" min=".01" step=".01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Type<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}<option>Salary</option><option>Investment</option></select></label><label>Date<input type="date" required value={form.occurred_on} onChange={e=>setForm({...form,occurred_on:e.target.value})}/></label><label className="wide">Note<input maxLength={250} placeholder="What was this for?" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><button disabled={saving} className="primary">+ Add transaction</button></form></section>
 <section className="panel"><div className="panelhead"><h2>All transactions</h2><div className="toolbar"><label className="import">Import CSV<input type="file" accept=".csv,text/csv" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void importCSV(f);e.target.value=''}}/></label><button className="secondary" onClick={exportCSV}>Export CSV ↓</button></div></div><p className="hint">CSV columns: Date, Amount, Type, Category, Note. Max 500 rows per upload; duplicates are skipped against loaded records.</p><TransactionTable rows={tx} onDelete={deleteTx} onReview={setReview}/></section></>}
 {tab==='Investments'&&<><div className="metrics twoMetrics"><div className="metric"><span>Total investments</span><strong>{money(invest)}</strong></div><div className="metric"><span>Emergency fund</span><strong>{money(emergency)}</strong></div></div><section className="panel"><h2>Add asset or savings balance</h2><form className="formgrid" onSubmit={addHolding}><label>Name<input required value={investment.name} onChange={e=>setInvestment({...investment,name:e.target.value})} placeholder="Mutual fund / Savings account"/></label><label>Current value (₹)<input required min="0" type="number" value={investment.value} onChange={e=>setInvestment({...investment,value:e.target.value})}/></label><label>Account type<select value={investment.kind} onChange={e=>setInvestment({...investment,kind:e.target.value})}><option>Investment</option><option>Emergency Fund</option></select></label><button disabled={saving} className="primary">Add balance</button></form></section><section className="panel"><h2>Assets</h2>{hold.map(h=><div key={h.id} className="goal"><span>{h.name}<small> · {h.kind}</small></span><strong>{money(h.value)}</strong><button className="danger" onClick={async()=>{if(!confirm('Delete this asset?'))return;await db.from('holdings').delete().eq('id',h.id);await load()}}>Delete</button></div>)}</section></>}
 {tab==='Home Loan'&&<><div className="metrics twoMetrics"><div className="metric"><span>Outstanding principal</span><strong>{money(principal)}</strong></div><div className="metric"><span>Monthly EMI</span><strong>{money(emi)}</strong></div></div><section className="panel"><h2>Your home loan</h2><p className="subtitle">Update EMI and outstanding principal in Settings. These figures are manual balances; the app does not yet calculate an amortization schedule.</p><button className="primary" onClick={()=>setTab('Settings')}>Edit loan details →</button></section></>}
 {tab==='Reports'&&<section className="panel"><div className="panelhead"><h2>Monthly summary</h2><button className="secondary" onClick={exportCSV}>Download transactions CSV</button></div><div className="goal"><span>Recorded income</span><strong>{money(income)}</strong></div><div className="goal"><span>Recorded spending</span><strong>{money(expenses)}</strong></div><div className="goal"><span>Recorded net</span><strong>{money(income-expenses)}</strong></div><h2>Spending by category</h2>{spendByCat.map(c=><div className="goal" key={c.name}><span>{c.name}</span><strong>{money(c.value)}</strong></div>)}</section>}
 {tab==='Settings'&&<section className="panel"><h2>Finance settings</h2><form className="formgrid" onSubmit={saveSettings}>{([{name:'Monthly salary',value:salary,set:setSalary},{name:'Monthly expense budget',value:budget,set:setBudget},{name:'Savings target',value:target,set:setTarget},{name:'Home loan EMI',value:emi,set:setEmi},{name:'Loan outstanding',value:principal,set:setPrincipal}]).map(f=><label key={f.name}>{f.name} (₹)<input type="number" min="0" required value={f.value} onChange={e=>f.set(Number(e.target.value))}/></label>)}<button disabled={saving} className="primary">Save settings</button></form></section>}
 </>}{review&&<div className="review-overlay" onClick={()=>setReview(null)}><div className="review-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Categorize expense"><button className="review-close" onClick={()=>setReview(null)} aria-label="Close">×</button><div className="review-mark">✦</div><div className="eyebrow">SMART EXPENSE REVIEW</div><h2>{money(Number(review.amount))} spent</h2><p>What was this payment for?</p><small>{review.note||review.occurred_on}</small><div className="review-grid">{cats.map(c=><button disabled={saving} key={c} onClick={()=>void classify(review,c)}>{c}</button>)}</div><button className="review-later" onClick={()=>setReview(null)}>Categorize later</button></div></div>}</main></div>
}
function TransactionTable({rows,onDelete,onReview}:{rows:Tx[];onDelete:(id:string)=>void;onReview:(t:Tx)=>void}){return <div className="tablewrap"><table><thead><tr><th>Date</th><th>Category / note</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>{rows.length?rows.map(t=><tr key={t.id}><td>{t.occurred_on}</td><td><b>{t.category}</b><small>{t.note}</small></td><td><span className={'pill '+t.kind}>{t.kind}</span></td><td className={t.kind==='income'?'green':''}>{t.kind==='income'?'+':'−'}{money(t.amount)}</td><td><div className="review-actions">{t.kind==='expense'&&<button className="review-edit" onClick={()=>onReview(t)}>{!t.category||t.category==='Uncategorized'?'Review':'Edit'}</button>}<button className="danger" onClick={()=>onDelete(t.id)}>×</button></div></td></tr>):<tr><td colSpan={5} className="empty">No transactions yet</td></tr>}</tbody></table></div>}
