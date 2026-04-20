import { redirect } from 'next/navigation';

// Deep-link alias so docs, emails and in-app CTAs ("Publish a listing", "New listing")
// never 404. The real wizard lives inside /market/agents with the `new=1` flag.
export default function PublishRedirect() {
  redirect('/market/agents?tab=mine&new=1');
}
