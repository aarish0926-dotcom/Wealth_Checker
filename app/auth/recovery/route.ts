import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
export async function GET(request:NextRequest){
 const params=new URL(request.url).searchParams
 const code=params.get('code'),token_hash=params.get('token_hash')
 const supabase=await createClient()
 if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/reset-password',request.url))}
 if(token_hash){const {error}=await supabase.auth.verifyOtp({token_hash,type:'recovery' as EmailOtpType});if(!error)return NextResponse.redirect(new URL('/reset-password',request.url))}
 return NextResponse.redirect(new URL('/forgot-password?error=Invalid%20or%20expired%20recovery%20link',request.url))
}
