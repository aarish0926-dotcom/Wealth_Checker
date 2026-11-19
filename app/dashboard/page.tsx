import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../login/actions'
import FinanceDashboard from './finance-dashboard'
export default async function Dashboard(){
 const supabase=await createClient()
 const {data:{user},error}=await supabase.auth.getUser()
 if(error||!user)redirect('/login')
 return <FinanceDashboard email={user.email||''} signOut={signOut}/>
}
