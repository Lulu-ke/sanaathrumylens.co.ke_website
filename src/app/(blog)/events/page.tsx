import { db } from '@/lib/db';
import { EventsPageClient } from './events-client';

export const metadata = {
  title: 'Events — Sanaa Through My Lens',
  description: 'Art exhibitions, festivals, concerts, launches and cultural happenings in Kenya and East Africa',
  alternates: {
    canonical: '/events',
  },
  openGraph: {
    title: 'Events — Sanaa Through My Lens',
    description: 'Art exhibitions, festivals, concerts, launches and cultural happenings in Kenya and East Africa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events — Sanaa Through My Lens',
    description: 'Art exhibitions, festivals, concerts, launches and cultural happenings in Kenya and East Africa',
  },
};

export default async function EventsPage() {
  const [events, categories] = await Promise.all([
    db.event.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 30,
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const featuredEvents = events.filter((e) => e.isFeatured);

  return (
    <EventsPageClient
      events={JSON.parse(JSON.stringify(events))}
      featuredEvents={JSON.parse(JSON.stringify(featuredEvents))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
