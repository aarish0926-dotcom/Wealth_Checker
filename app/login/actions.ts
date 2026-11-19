'use server'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
const site='https://wealthtrack-two.vercel.app'
function go(path:string,msg:string,kind:'error'|'message'='error'):never{redirect(path+'?'+kind+'='+encodeURIComponent(msg))}
export async function signIn(formData:FormData){
 const email=String(formData.get('email')||'').trim(),password=String(formData.get('password')||'')
 const supabase=await createClient()
 const {error}=await supabase.auth.signInWithPassword({email,password})
 if(error){
  if(error.code==='email_not_confirmed'||/email not confirmed/i.test(error.message))go('/login','Your account exists but the email is not verified. Check your inbox or spam folder for the confirmation email before signing in.')
  if(error.code==='invalid_credentials'||/invalid login credentials/i.test(error.message))go('/login','Email or password is incorrect. If you have not verified your email yet, complete confirmation first. You can also reset your password.')
  if(error.status===429)go('/login','Too many attempts. Please try again after the cooldown.')
  go('/login',error.message)
 }
 redirect('/dashboard')
}
export async function signUp(formData:FormData){
 const email=String(formData.get('email')||'').trim(),password=String(formData.get('password')||'')
 const supabase=await createClient()
 const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:site+'/auth/confirm'}})
 if(error){
  if(error.status===429||error.code==='over_email_send_rate_limit')go('/login','Email verification was recently requested. Please check inbox/spam and do not repeatedly create the account. A new request can be made after the cooldown.')
  go('/login',error.message)
 }
 if(data.user?.identities?.length===0)go('/login','This email may already be registered. Try Sign in or Forgot password.','message')
 go('/login','Account created. Verify your email using the confirmation message in your inbox or spam folder, then sign in.','message')
}
export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const supabase=await createClient()
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:site+'/auth/recovery'})
 if(error&&error.status===429)go('/forgot-password','Too many requests. Please check your existing emails and retry after the cooldown.')
 if(error)go('/forgot-password',error.message)
 go('/forgot-password','If this email is registered, check your inbox and spam folder for a password reset link.','message')
}
export async function updatePassword(formData:FormData){
 const password=String(formData.get('password')||''),confirm=String(formData.get('confirm')||'')
 if(password.length<8||password!==confirm)go('/reset-password','Passwords must match and contain at least 8 characters.')
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)go('/login','Recovery link expired. Request a new reset link.')
 const {error}=await supabase.auth.updateUser({password})
 if(error)go('/reset-password',error.message)
 await supabase.auth.signOut()
 go('/login','Password updated. Sign in with your new password.','message')
}
export async function signOut(){const supabase=await createClient();await supabase.auth.signOut();redirect('/login')}
