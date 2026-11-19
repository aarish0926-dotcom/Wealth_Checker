'use client'
import Link from 'next/link'
import { useState } from 'react'
import { signIn, signUp } from './actions'

export default function Login({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const [mode,setMode]=useState<'signin'|'signup'>('signin')
 const [visible,setVisible]=useState(false)
 const [busy,setBusy]=useState(false)
 const [server,setServer]=useState<{error?:string;message?:string}>({})
 useState(()=>{void searchParams.then(setServer)})
 const isSignup=mode==='signup'
 const error=server.error||''
 const limit=/(\d+) seconds?/.exec(error)
 return <div className="auth-page">
  <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
  <div className="auth-shell">
   <section className="auth-story">
    <div className="auth-logo"><span className="auth-logo-mark">✦</span><span>wealth<span className="auth-accent">track.</span></span></div>
    <div className="auth-story-main"><div className="auth-tag"><span className="auth-tag-dot"/> PERSONAL FINANCE, REIMAGINED</div>
    <h1>Make money<br/><span>make sense.</span></h1>
    <p>One beautiful space to manage your spending, track your goals, and build a brighter financial future.</p>
    <div className="auth-preview">
      <div className="auth-preview-top"><span>YOUR FINANCIAL SNAPSHOT</span><span className="auth-preview-ellipsis">•••</span></div>
      <div className="auth-preview-label">Money at a glance</div>
      <div className="auth-preview-total">₹90,000 <span>/mo</span></div>
      <div className="auth-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="auth-preview-bottom"><span><b className="auth-dot-green"/> Track expenses</span><span><b className="auth-dot-purple"/> Reach your goals</span></div>
    </div></div>
    <div className="auth-story-foot">A smarter relationship with your money. <span>✦</span></div>
   </section>
   <section className="auth-panel">
    <div className="auth-mobile-brand"><span className="auth-logo-mark">✦</span> wealth<span className="auth-accent">track.</span></div>
    <div className="auth-panel-inner">
     <div className="auth-eyebrow">{isSignup?'GET STARTED':'WELCOME BACK'} <span className="auth-spark">✳</span></div>
     <h2>{isSignup?'Your money journey starts here.':'Welcome back.'}</h2>
     <p className="auth-lead">{isSignup?'Create your personal finance account.':'Your financial world is right where you left it.'}</p>
     <div className="auth-tabs" role="group" aria-label="Account action">
      <button type="button" className={!isSignup?'selected':''} onClick={()=>{setMode('signin');setServer({});setBusy(false)}}>Sign in</button>
      <button type="button" className={isSignup?'selected':''} onClick={()=>{setMode('signup');setServer({});setBusy(false)}}>Create account</button>
     </div>
     {error&&<div className="auth-alert" role="alert"><span aria-hidden="true">!</span><div>{limit?'Too many email requests. Supabase is temporarily limiting signup emails. Avoid submitting repeatedly; check your inbox for the earlier confirmation link.':error}</div></div>}
     {server.message&&<div className="auth-info" role="status">✓ &nbsp;{server.message}</div>}
     <form className="auth-form" action={isSignup?signUp:signIn} onSubmit={()=>setBusy(true)}>
      <label htmlFor="auth-email">Email address</label><div className="auth-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg><input id="auth-email" name="email" placeholder="name@example.com" autoComplete="email" type="email" required/></div>
      <div className="auth-label-line"><label htmlFor="auth-password">Password</label>{!isSignup&&<Link href="/forgot-password">Forgot password?</Link>}</div>
      <div className="auth-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="auth-password" name="password" placeholder={isSignup?'Create a strong password':'Enter your password'} type={visible?'text':'password'} minLength={isSignup?8:6} autoComplete={isSignup?'new-password':'current-password'} required/><button type="button" className="auth-eye" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?'Hide':'Show'}</button></div>
      {isSignup&&<p className="auth-field-note">Use at least 8 characters. You may need to verify your email before your first sign in.</p>}
      <button className="auth-submit" type="submit" disabled={busy}>{busy?'Processing…':isSignup?'Create your account':'Sign in to WealthTrack'} <span aria-hidden="true">→</span></button>
     </form>
     <div className="auth-footnote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> Your financial data is private and protected.</div>
     {isSignup&&<p className="auth-signup-hint">Already registered? <button type="button" onClick={()=>setMode('signin')}>Sign in instead</button></p>}
    </div>
    <div className="auth-panel-footer">© 2026 WealthTrack <span>Built for clarity. Designed for you.</span></div>
   </section>
  </div>
 </div>
}
