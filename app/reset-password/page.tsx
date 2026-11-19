import Link from 'next/link'
import { updatePassword } from '../login/actions'
export default async function ResetPassword({searchParams}:{searchParams:Promise<{error?:string}>}){
 const p=await searchParams
 return <main><div className="card"><h1>Choose a new password</h1><p className="muted">For security, use a unique password of at least 8 characters.</p>{p.error&&<p className="error" role="alert">{p.error}</p>}
 <form action={updatePassword}><label>New password<input type="password" name="password" required minLength={8} autoComplete="new-password"/></label><label>Confirm password<input type="password" name="confirm" required minLength={8} autoComplete="new-password"/></label><button type="submit">Update password</button></form><p><Link href="/login">Back to login</Link></p></div></main>
}
