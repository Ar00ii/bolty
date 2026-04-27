import { redirect } from 'next/navigation';

/**
 * Landing page removed. The marketing surface (hero, feature grid,
 * testimonials, etc.) was burying the actual product behind a
 * scroll-and-pitch wall. Visitors now land directly in the
 * marketplace where they can see real listings and either browse or
 * sign in to publish.
 *
 * Server-side redirect (Next 14 App Router) so search engines
 * follow the 308 to /market and there's zero client-side flash of
 * the old landing.
 */
export default function HomeRedirect() {
  redirect('/market');
}
