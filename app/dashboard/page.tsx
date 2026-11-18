import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../login/actions'
export default async function Dashboard(){const supabase=await createClient();const {data:{user},error}=await supabase.auth.getUser();if(error||!user)redirect('/login');return <main><div className="card"><h1>Your dashboard</h1><p className="muted">Signed in as {user.email}</p><p>Only your account can access your finance records. Your dashboard modules can be added here.</p><form action={signOut}><button type="submit">Sign out</button></form></div></main>}
