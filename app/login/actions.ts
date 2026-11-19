'use server'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
const site='https://wealthtrack-two.vercel.app'
export async function signIn(formData:FormData){
 const email=String(formData.get('email')||'').trim(),password=String(formData.get('password')||'')
 const supabase=await createClient()
 const {error}=await supabase.auth.signInWithPassword({email,password})
 if(error){const msg=error.code==='invalid_credentials'||/invalid login credentials/i.test(error.message)?'Incorrect email or password. If you already registered, use Forgot password to recover access.':error.message;redirect('/login?error='+encodeURIComponent(msg))}
 redirect('/dashboard')
}
export async function signUp(formData:FormData){
 const email=String(formData.get('email')||'').trim(),password=String(formData.get('password')||'')
 const supabase=await createClient()
 const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:site+'/auth/confirm'}})
 if(error)redirect('/login?error='+encodeURIComponent(error.message))
 if(data.user?.identities?.length===0)redirect('/login?message='+encodeURIComponent('If you registered before, please sign in or use Forgot password.'))
 redirect('/login?message='+encodeURIComponent('Check your email for confirmation. If you already have an account, use Sign in or Forgot password.'))
}
export async function requestPasswordReset(formData:FormData){
 const email=String(formData.get('email')||'').trim()
 const supabase=await createClient()
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:site+'/auth/recovery'})
 if(error&&error.status===429)redirect('/forgot-password?error='+encodeURIComponent('Too many attempts. Please try again later.'))
 if(error)redirect('/forgot-password?error='+encodeURIComponent(error.message))
 redirect('/forgot-password?message='+encodeURIComponent('If this email is registered, check your inbox and spam folder for a password reset link.'))
}
export async function updatePassword(formData:FormData){
 const password=String(formData.get('password')||''),confirm=String(formData.get('confirm')||'')
 if(password.length<8||password!==confirm)redirect('/reset-password?error='+encodeURIComponent('Passwords must match and contain at least 8 characters.'))
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?error='+encodeURIComponent('Recovery link expired. Request a new reset link.'))
 const {error}=await supabase.auth.updateUser({password})
 if(error)redirect('/reset-password?error='+encodeURIComponent(error.message))
 await supabase.auth.signOut()
 redirect('/login?message='+encodeURIComponent('Password updated. Sign in with your new password.'))
}
export async function signOut(){const supabase=await createClient();await supabase.auth.signOut();redirect('/login')}
