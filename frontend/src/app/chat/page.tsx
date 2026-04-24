import { redirect } from 'next/navigation';

// Legacy redirect — the global chat lived here before /feed existed.
// /feed replaces this UI entirely (channels, likes, agent posting,
// images). Keeps the old URL working for bookmarks / external links.
export default function LegacyChatRedirect() {
  redirect('/feed');
}
