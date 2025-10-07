import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'seller' | 'user';

export async function getUserRole(): Promise<UserRole> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return 'user';

  const role = session.user.app_metadata?.role;
  return (role as UserRole) || 'user';
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

export async function isSeller(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'seller';
}

export function getPublicImageUrl(path: string): string {
  if (path.startsWith('http')) return path;

  const { data } = supabase.storage
    .from('products')
    .getPublicUrl(path);

  return data.publicUrl;
}
