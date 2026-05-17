import { NewsletterPageClient } from './newsletter-client';

export const metadata = {
  title: 'Newsletter — Sanaa Through My Lens',
  description: 'Subscribe to "This Week in East African Arts" — get curated event picks, new reviews, and exclusive content.',
};

export default async function NewsletterPage() {
  return <NewsletterPageClient />;
}
