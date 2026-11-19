'use client'
import { useEffect,useMemo,useState } from 'react'
import { createClient } from '../../lib/supabase/client'
type Tx={id:string;amount:number;category:string;kind:string;occurred_on:string;note:string}
type Holding={id:string;name:string;value:number;kind:string}
const money=(n:number)=>'₹'+Math.round(n).toLocaleString('en-IN')
const cats=['Food','Groceries','Transport','Shopping','Bills','Rent','Health','Entertainment','Education','Other']
const symbols:Record<string,string>={Food:'🍽️',Groceries:'🥬',Transport:'🚕',Shopping:'🛍️',Bills:'💡',Rent:'🏠',Health:'💊',Entertainment:'🎬',Education:'📚',Other:'◈',Salary:'💸',Uncategorized:'✳'}
export default function FinanceDashboard({email,signOut}:{email:string;signOut:()=>Promise<void>}){
 const db=useMemo(()=>createClient(),[])
 const [tab,setTab]=useState('Overview'),[tx,setTx]=useState<Tx[]>([]),[hold,setHold]=useState<Holding[]>([])
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 const [salary,setSalary]=useState(90000),[budget,setBudget]=useState(15000),[target,setTarget]=useState(10000),[emi,setEmi]=useState(19900),[principal,setPrincipal]=useState(2192890)
 const [form,setForm]=useState({amount:'',category:'Food',kind:'expense',occurred_on:new Date().toLocaleDateString('en-CA'),note:''})
 const [investment,setInvestment]=useState({name:'',value:'',kind:'Investment'})
 const [review,setReview]=useState<Tx|null>(null)
 const [quickAdd,setQuickAdd]=useState(false)
 const [search,setSearch]=useState('')
 const [kindFilter,setKindFilter]=useState('all')
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
 const available=(income||salary)-expenses-emi
 const monthLabel=new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date())
 const shownTx=tx.filter(t=>(kindFilter==='all'||kindFilter==='review'&&t.kind==='expense'&&(!t.category||t.category==='Uncategorized')||kindFilter===t.kind)&&[t.note,t.category,t.occurred_on].join(' ').toLowerCase().includes(search.toLowerCase()))
 async function addTx(e:React.FormEvent){e.preventDefault();setError('');setSaving(true)
  const {data:{user}}=await db.auth.getUser()
  const amount=Number(form.amount)
  if(!user||!Number.isFinite(amount)||amount<=0){setError('Enter a valid positive amount');setSaving(false);return}
  const {error:err}=await db.from('transactions').insert({...form,amount,user_id:user.id})
  if(err)setError(err.message);else {setForm({...form,amount:'',note:''});setQuickAdd(false);await load()}
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
  const {data:{user}}=await db.auth.getUser();if(!user){setError('Please sign in again');setSaving(false);return}
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
 return <div className="wt-app">
  <aside className="wt-sidebar"><div className="wt-brand"><span className="wt-symbol">✦</span><span>wealth<span>track.</span></span></div><p className="wt-sidemeta">PERSONAL FINANCE STUDIO</p>
   <div className="wt-navtitle">WORKSPACE</div>
   <nav aria-label="Main navigation">{[['Overview','◫'],['Transactions','⇄'],['Investments','◇'],['Home Loan','⌂'],['Reports','▤'],['Settings','⚙']].map(([name,icon])=><button type="button" key={name} className={tab===name?'wt-nav active':'wt-nav'} onClick={()=>setTab(name)}><span>{icon}</span>{name}{name==='Transactions'&&unreviewed.length>0&&<b>{unreviewed.length}</b>}</button>)}</nav>
   <div className="wt-sidebar-bottom"><div className="wt-secure"><span>●</span> PRIVATE & SECURE</div><div className="wt-account"><div className="wt-account-avatar">{email.slice(0,1).toUpperCase()}</div><div><b>My workspace</b><small>{email}</small></div></div><form action={signOut}><button className="wt-signout">Sign out ↗</button></form></div>
  </aside>
  <div className="wt-work"><div className="wt-top"><span className="wt-breadcrumb">MY WORKSPACE <span>/ {tab.toUpperCase()}</span></span><div className="wt-topright"><span className="wt-live"><i/> CLOUD SYNC</span><button className="wt-avatar" onClick={()=>setTab('Settings')} title="Open settings">{email.slice(0,1).toUpperCase()}</button></div></div>
  <main className="wt-main">
   <div className="wt-heading"><div><p className="wt-kicker">YOUR MONEY, IN FOCUS</p><h1>{tab==='Overview'?<>Financial <em>overview.</em></>:tab==='Transactions'?<>Track every <em>rupee.</em></>:tab==='Investments'?<>Build your <em>wealth.</em></>:tab==='Home Loan'?<>Own your <em>future.</em></>:tab==='Reports'?<>Spending <em>insights.</em></>:<>Make it <em>yours.</em></>}</h1><p>{tab==='Overview'?'A clearer view of your financial world.':tab==='Transactions'?'Review, categorize and understand your daily expenses.':tab==='Investments'?'See your investments and emergency savings together.':tab==='Home Loan'?'Keep your home loan milestones in sight.':tab==='Reports'?'Every payment tells a story.':'Personalize your goals and monthly plans.'}</p></div><div className="wt-head-actions"><span className="wt-month">◷ &nbsp; {monthLabel}</span><button className="wt-add" onClick={()=>setQuickAdd(true)}>＋ Add expense</button></div></div>
   {error&&<div className="wt-notice" role="status">{error}<button onClick={()=>setError('')} aria-label="Dismiss">×</button></div>}
   {loading?<div className="wt-panel wt-loading">Loading your private finances…</div>:<>
    {tab==='Overview'&&<>
     <section className="wt-hero"><div className="wt-hero-copy"><div className="wt-hero-label">✧ &nbsp; THIS MONTH'S ESTIMATED CASH FLOW</div><p>Available after recorded expenses & EMI</p><strong>{money(available)}</strong><span className="wt-hero-caption">{income===0?'Uses your saved salary estimate because no income was recorded':'Uses recorded income'} · not a bank balance</span><div className="wt-hero-mini"><div><small>INCOME {income===0?'ESTIMATE':'RECORDED'}</small><b>{money(income||salary)}</b></div><div><small>RECORDED SPENDING</small><b>{money(expenses)}</b></div><div><small>MONTHLY EMI</small><b>{money(emi)}</b></div></div></div><div className="wt-hero-sigil"><div>✦</div></div></section>
     <div className="wt-metrics"><div className="wt-stat"><div className="wt-stat-top"><span>MONTHLY BUDGET</span><i>◉</i></div><strong>{money(budget)}</strong><p>{money(Math.max(0,budget-expenses))} remaining to spend</p><div className="wt-progress"><i style={{width:Math.min(100,expenses/Math.max(1,budget)*100)+'%'}}/></div></div><div className="wt-stat"><div className="wt-stat-top"><span>SAVINGS TARGET</span><i>◇</i></div><strong>{money(target)}</strong><p>Monthly saving goal</p><span className="wt-stat-green">✳ Small steps build wealth</span></div><div className="wt-stat"><div className="wt-stat-top"><span>NEEDS YOUR REVIEW</span><i>◷</i></div><strong>{String(unreviewed.length).padStart(2,'0')}</strong><p>Imported transactions to categorize</p><button className="wt-stat-link" disabled={!unreviewed.length} onClick={()=>setReview(unreviewed[0])}>Review now →</button></div></div>
     <div className="wt-tip"><div className="wt-tip-icon">✧</div><div><b>Give every transaction a purpose.</b><p>Import your bank CSV, then categorize unreviewed expenses in one tap. Automatic GPay notification capture needs a separate Android app.</p></div><button onClick={()=>setTab('Transactions')}>Review payments ↗</button></div>
     <div className="wt-columns"><section className="wt-panel"><div className="wt-panel-header"><div><h2>Recent activity</h2><p>Your latest recorded transactions</p></div><button onClick={()=>setTab('Transactions')}>View all →</button></div><WTTransactions rows={tx.slice(0,6)} onReview={setReview} onDelete={deleteTx}/></section><section className="wt-panel"><div className="wt-panel-header"><div><h2>Spending breakdown</h2><p>Where your money goes</p></div><span>THIS MONTH</span></div>{spendByCat.length?spendByCat.slice(0,6).map((c,i)=><div className="wt-cat" key={c.name}><div><span>{symbols[c.name]||'◈'} &nbsp;{c.name}</span><b>{money(c.value)}</b></div><div className="wt-catbar"><i style={{width:Math.min(100,c.value/Math.max(1,expenses)*100)+'%',background:['#a99dff','#72d8ca','#efbd82','#88aff1','#e59ac7'][i%5]}}/></div></div>):<div className="wt-empty"><b>No expenses yet</b><p>Add your first transaction to unlock spending insights.</p><button onClick={()=>setQuickAdd(true)}>Add expense +</button></div>}</section></div>
     <section className="wt-panel"><div className="wt-panel-header"><div><h2>Financial milestones</h2><p>Personal targets at a glance</p></div><button onClick={()=>setTab('Settings')}>Edit targets →</button></div><div className="wt-milestones"><div><small>◈ INVESTMENTS</small><strong>{money(invest)}</strong></div><div><small>✳ EMERGENCY FUND</small><strong>{money(emergency)}</strong></div><div><small>⌂ HOME LOAN BALANCE</small><strong>{money(principal)}</strong></div></div></section>
    </>}
    {tab==='Transactions'&&<>
     <div className="wt-columns"><section className="wt-panel"><h2>Quick transaction entry</h2><p className="wt-muted">Record your expenses securely in your own account.</p><form className="wt-form" onSubmit={addTx}><label>Amount (₹)<input required type="number" min=".01" step=".01" placeholder="350" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><div className="wt-form-row"><label>Type<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}<option>Salary</option><option>Uncategorized</option></select></label></div><label>Date<input required type="date" value={form.occurred_on} onChange={e=>setForm({...form,occurred_on:e.target.value})}/></label><label>What was this for?<input maxLength={250} placeholder="Lunch / Uber / Groceries…" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><button className="wt-add" disabled={saving}>{saving?'Saving…':'＋ Save transaction'}</button></form></section>
     <section className="wt-panel wt-review-panel"><span className="wt-review-icon">✦</span><h2>Smart review inbox</h2><p>You have <b>{unreviewed.length}</b> transaction{unreviewed.length===1?'':'s'} waiting for a category.</p><button className="wt-add" disabled={!unreviewed.length} onClick={()=>setReview(unreviewed[0])}>{unreviewed.length?'Categorize next payment →':'All caught up ✓'}</button><p className="wt-muted">Expenses imported without categories appear here. This is not automatic GPay access.</p></section></div>
     <section className="wt-panel"><div className="wt-panel-header"><div><h2>All transactions</h2><p>Search and manage your payments</p></div><div className="wt-actions"><label className="wt-import">Import CSV<input hidden type="file" accept=".csv,text/csv" onChange={e=>{const f=e.target.files?.[0];if(f)void importCSV(f);e.target.value=''}}/></label><button className="wt-import" onClick={exportCSV}>Export CSV ↓</button></div></div><div className="wt-filters"><input aria-label="Search transactions" value={search} onChange={e=>setSearch(e.target.value)} placeholder="⌕ Search transactions…"/>{[['all','All'],['expense','Expenses'],['income','Income'],['review','Needs review']].map(([v,label])=><button key={v} className={kindFilter===v?'active':''} onClick={()=>setKindFilter(v)}>{label}</button>)}</div><WTTransactions rows={shownTx} onReview={setReview} onDelete={deleteTx}/><p className="wt-muted">CSV format: Date, Amount, Type, Category, Note. Up to 500 rows per upload; duplicate checks use date, amount, type and note.</p></section>
    </>}
    {tab==='Investments'&&<><div className="wt-metrics wt-two-stats"><div className="wt-stat"><span>TOTAL INVESTMENTS</span><strong>{money(invest)}</strong><p>Recorded investment holdings</p></div><div className="wt-stat"><span>EMERGENCY FUND</span><strong>{money(emergency)}</strong><p>Recorded savings balance</p></div></div><div className="wt-columns"><section className="wt-panel"><h2>Add asset or savings balance</h2><form className="wt-form" onSubmit={addHolding}><label>Name<input required placeholder="Mutual fund / Savings account" value={investment.name} onChange={e=>setInvestment({...investment,name:e.target.value})}/></label><label>Current value (₹)<input required type="number" min="0" step=".01" value={investment.value} onChange={e=>setInvestment({...investment,value:e.target.value})}/></label><label>Asset type<select value={investment.kind} onChange={e=>setInvestment({...investment,kind:e.target.value})}><option>Investment</option><option>Emergency Fund</option></select></label><button className="wt-add" disabled={saving}>Save asset</button></form></section><section className="wt-panel"><h2>Your assets</h2>{hold.length?hold.map(h=><div className="wt-asset" key={h.id}><div><b>{h.name}</b><small>{h.kind}</small></div><strong>{money(Number(h.value))}</strong><button onClick={async()=>{if(!confirm('Remove this holding?'))return;const {error:err}=await db.from('holdings').delete().eq('id',h.id);if(err)setError(err.message);else await load()}}>Remove</button></div>):<div className="wt-empty">No assets yet. Add an investment or fund balance.</div>}</section></div></>}
    {tab==='Home Loan'&&<><div className="wt-hero wt-loanhero"><div className="wt-hero-copy"><span className="wt-hero-label">⌂ &nbsp; HOME OWNERSHIP</span><p>Recorded outstanding balance</p><strong>{money(principal)}</strong><span className="wt-hero-caption">Manual balance · Not connected to your bank</span><div className="wt-hero-mini"><div><small>MONTHLY EMI</small><b>{money(emi)}</b></div><div><small>PAYMENT TRACKING</small><b>Manual</b></div></div></div><div className="wt-hero-sigil"><div>⌂</div></div></div><section className="wt-panel"><h2>Make your loan easier to manage</h2><p className="wt-muted">Manage EMI and current principal in Settings. Automated bank sync and full amortization calculations are not connected yet.</p><button className="wt-add" onClick={()=>setTab('Settings')}>Edit loan details →</button></section></>}
    {tab==='Reports'&&<><div className="wt-metrics"><div className="wt-stat"><span>RECORDED INCOME</span><strong>{money(income)}</strong><p>{monthLabel}</p></div><div className="wt-stat"><span>RECORDED SPENDING</span><strong>{money(expenses)}</strong><p>{monthLabel}</p></div><div className="wt-stat"><span>NET RECORDED CASH FLOW</span><strong>{money(income-expenses)}</strong><p>Income minus spending (excludes EMI unless recorded)</p></div></div><div className="wt-columns"><section className="wt-panel"><h2>Category report</h2>{spendByCat.length?spendByCat.map((c,i)=><div className="wt-cat" key={c.name}><div><span>{symbols[c.name]||'◈'} &nbsp;{c.name}</span><b>{money(c.value)}</b></div><div className="wt-catbar"><i style={{width:100*c.value/Math.max(1,expenses)+'%',background:['#a99dff','#72d8ca','#efbd82','#88aff1'][i%4]}}/></div></div>):<p className="wt-muted">No recorded spending this month.</p>}</section><section className="wt-panel"><h2>Export your records</h2><p className="wt-muted">Download a CSV of transactions saved in your account. You can open the file in Excel or Google Sheets.</p><button className="wt-add" onClick={exportCSV}>Download transaction CSV ↓</button></section></div></>}
    {tab==='Settings'&&<section className="wt-panel"><h2>Personal financial settings</h2><p className="wt-muted">These are your monthly planning assumptions. They are not live bank balances.</p><form className="wt-form wt-settings" onSubmit={saveSettings}>{([{name:'Monthly salary estimate',value:salary,set:setSalary},{name:'Monthly expense budget',value:budget,set:setBudget},{name:'Savings target',value:target,set:setTarget},{name:'Home loan EMI',value:emi,set:setEmi},{name:'Loan outstanding',value:principal,set:setPrincipal}]).map(f=><label key={f.name}>{f.name} (₹)<input type="number" min="0" step=".01" required value={f.value} onChange={e=>f.set(Number(e.target.value))}/></label>)}<button className="wt-add" disabled={saving}>Save settings</button></form></section>}
   </>}
   <footer className="wt-footer"><span>✦ WealthTrack · Your private financial workspace</span><span>Payments are recorded manually or via CSV · No live UPI sync</span></footer>
  </main>
  </div>
  {quickAdd&&<div className="wt-backdrop" onClick={()=>setQuickAdd(false)}><div className="wt-dialog" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Quick expense entry"><button className="wt-close" onClick={()=>setQuickAdd(false)} aria-label="Close">×</button><div className="wt-dialog-star">✦</div><span className="wt-kicker">QUICK EXPENSE</span><h2>Where did the money go?</h2><p>Save a real expense to your private account.</p><form className="wt-form" onSubmit={addTx}><label>Amount (₹)<input type="number" required min=".01" step=".01" placeholder="350" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value,kind:'expense'})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value,kind:'expense'})}>{cats.map(c=><option key={c}>{c}</option>)}</select></label><label>Description<input value={form.note} onChange={e=>setForm({...form,note:e.target.value,kind:'expense'})} placeholder="e.g. Lunch at café" maxLength={250}/></label><button disabled={saving} className="wt-add">{saving?'Saving…':'Save expense →'}</button></form></div></div>}
  {review&&<div className="wt-backdrop" onClick={()=>setReview(null)}><div className="wt-dialog" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Review expense"><button className="wt-close" onClick={()=>setReview(null)} aria-label="Close">×</button><div className="wt-dialog-star">✦</div><span className="wt-kicker">SMART EXPENSE REVIEW</span><h2>{money(Number(review.amount))} spent</h2><p>What was this payment for?</p><small>{review.note||review.occurred_on}</small><div className="wt-category-grid">{cats.map(c=><button disabled={saving} key={c} onClick={()=>void classify(review,c)}>{symbols[c]}<span>{c}</span></button>)}</div><button className="wt-later" onClick={()=>setReview(null)}>I'll do this later</button></div></div>}
 </div>
}
function WTTransactions({rows,onReview,onDelete}:{rows:Tx[];onReview:(t:Tx)=>void;onDelete:(id:string)=>void}){return <div className="wt-transactions">{rows.length?rows.map(t=><div className="wt-tx" key={t.id}><div className="wt-tx-icon">{symbols[t.category]||'◈'}</div><div className="wt-tx-info"><b>{t.note||t.category||'Transaction'}</b><span>{t.occurred_on} · {t.category||'Needs review'}</span></div><strong className={t.kind==='income'?'income':''}>{t.kind==='income'?'+':'−'}{money(Number(t.amount))}</strong><div className="wt-tx-actions">{t.kind==='expense'&&<button onClick={()=>onReview(t)}>{t.category==='Uncategorized'?'Review':'Edit'}</button>}<button className="wt-delete" onClick={()=>onDelete(t.id)} title="Delete transaction" aria-label="Delete transaction">×</button></div></div>):<div className="wt-empty"><b>Nothing here yet</b><p>Add an expense or import a CSV to get started.</p></div>}</div>}
