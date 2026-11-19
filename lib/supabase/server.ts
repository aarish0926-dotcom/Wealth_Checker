import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
type CookieEntry={name:string;value:string;options?:Record<string,any>}
export async function createClient(){
 const store=await cookies()
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
  cookies:{
   getAll(){return store.getAll()},
   setAll(items:CookieEntry[]){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Cookies cannot be written in Server Components; proxy refreshes session. */}}
  }
 })
}
