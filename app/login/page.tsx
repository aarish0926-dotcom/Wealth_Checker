import Link from 'next/link'
import { signIn, signUp } from './actions'
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const p=await searchParams
 return <main><div className="card"><div className="eyebrow">YOUR FINANCIAL COMMAND CENTER</div><h1>WealthTrack</h1><p className="muted">Sign in to your private finance account.</p>
 {p.error&&<p className="error" role="alert">{p.error}</p>}{p.message&&<p role="status">{p.message}</p>}
 <form><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" minLength={6} autoComplete="current-password" required/></label>
 <button formAction={signIn}>Sign in</button><button formAction={signUp} style={{background:'#d7e7fa'}}>Create account</button></form>
 <p className="muted" style={{fontSize:13,marginTop:22}}>Already signed up? Use your existing password. <Link href="/forgot-password">Forgot password?</Link></p>
 </div></main>
}
