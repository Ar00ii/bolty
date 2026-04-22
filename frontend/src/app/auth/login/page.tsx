import { redirect } from 'next/navigation';

/**
 * Legacy alias — older code pushed users to `/auth/login` (which
 * 404'd because the actual auth UI lives at `/auth`). Redirect so
 * stale buttons / external links / bookmarks still land correctly.
 */
export default function AuthLoginRedirect() {
  redirect('/auth');
}
