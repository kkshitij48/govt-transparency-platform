'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Service-role client — bypasses RLS, used only server-side
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please verify your email before signing in. Check your inbox.' };
    }
    return { error: 'Invalid email or password. Please try again.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user!.id)
    .single();

  revalidatePath('/', 'layout');

  const role = profile?.role;
  if (role === 'Admin') redirect('/admin/dashboard');
  if (role === 'Official') redirect('/official/dashboard');
  redirect('/citizen/dashboard');
}

export async function registerAction(formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    role: (formData.get('role') as string) || 'Citizen',
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered')) {
      return { error: 'An account with this email already exists.' };
    }
    return { error: error.message };
  }

  // If signup created a user, ensure the profile row exists.
  // This is a safety net in case the database trigger failed —
  // the service-role client bypasses RLS and writes directly.
  if (data.user) {
    const admin = getAdminClient();
    await admin.from('profiles').upsert(
      {
        user_id: data.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role as 'Citizen' | 'Official' | 'Admin',
      },
      { onConflict: 'user_id' }
    );
  }

  return {
    success: 'Account created! Check your email to verify, then sign in.',
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const name  = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || null;

  if (!name || name.length < 2) return { error: 'Name must be at least 2 characters.' };

  const { error } = await supabase
    .from('profiles')
    .update({ name, phone })
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to update profile.' };

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const password        = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 8)
    return { error: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password))
    return { error: 'Password must contain at least one uppercase letter.' };
  if (!/[0-9]/.test(password))
    return { error: 'Password must contain at least one number.' };
  if (password !== confirmPassword)
    return { error: "Passwords don't match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, department:departments(department_id, department_name)')
    .eq('user_id', user.id)
    .single();

  return profile;
}
