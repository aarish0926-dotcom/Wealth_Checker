import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
type CookieEntry={name:string;value:string;options?:Record<string,any>}
export async function updateSession(request:NextRequest){
 let response=NextResponse.next({request})
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(items:CookieEntry[]){
    items.forEach(({name,value})=>request.cookies.set(name,value))
    response=NextResponse.next({request})
    items.forEach(({name,value,options})=>response.cookies.set(name,value,options))
   }
  }
 })
 const {data}=await supabase.auth.getClaims()
 const claims=data?.claims
 const protectedPath=request.nextUrl.pathname.startsWith('/dashboard')
 if(protectedPath&&!claims){
  const url=request.nextUrl.clone();url.pathname='/login';url.searchParams.set('next',request.nextUrl.pathname)
  const redirect=NextResponse.redirect(url);response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));return redirect
 }
 if(request.nextUrl.pathname==='/login'&&claims){
  const url=request.nextUrl.clone();url.pathname='/dashboard';url.search=''
  const redirect=NextResponse.redirect(url);response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));return redirect
 }
 return response
}
