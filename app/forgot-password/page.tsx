import Link from 'next/link'
import { requestPasswordReset } from '../login/actions'
export default async function ForgotPassword({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const p=await searchParams
 return <main><div className="card"><h1>Reset password</h1><p className="muted">Enter your registered email. We will send a recovery link if your account exists.</p>
 {p.error&&<p className="error">{p.error}</p>}{p.message&&<p role="status">{p.message}</p>}
 <form action={requestPasswordReset}><label>Email<input name="email" type="email" autoComplete="email" required/></label><button type="submit">Send reset link</button></form><p><Link href="/login">← Back to sign in</Link></p></div></main>
}
