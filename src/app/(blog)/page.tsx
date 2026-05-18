import { db } from '@/lib/db';
import { HomepageClient } from './homepage-client';

export default async function HomePage() {
  // Fetch all data server-side
  const [
    featuredPost,
    recentPosts,
    categories,
    events,
    ads,
  ] = await Promise.all([
    // Featured post
    db.post.findFirst({
      where: { status: 'PUBLISHED', isFeatured: true },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true, bookmarks: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    // Recent published posts
    db.post.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true, bookmarks: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
    }),
    // Categories
    db.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { posts: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    // Upcoming events
    db.event.findMany({
      where: { isActive: true, startDate: { gte: new Date().toISOString() } },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
    // Sidebar ads
    db.ad.findMany({
      where: { placement: 'SIDEBAR', status: 'ACTIVE' },
      take: 1,
    }),
  ]);

  // If no featured post found, use the first recent post
  const heroPost = featuredPost || recentPosts[0];
  // Filter out hero post from grid
  const gridPosts = recentPosts.filter((p) => p.id !== heroPost?.id);
  // Trending posts for ticker (just title + slug)
  const trendingPosts = recentPosts.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
  }));

  // Organization + WebSite structured data
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sanaa Through My Lens',
    url: 'https://sanaathrumylens.co.ke',
    description: 'An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.',
    publisher: {
      '@type': 'Organization',
      name: 'Sanaa Through My Lens',
      url: 'https://sanaathrumylens.co.ke',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sanaathrumylens.co.ke/logo.svg',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <HomepageClient
        heroPost={heroPost ? JSON.parse(JSON.stringify(heroPost)) : null}
        gridPosts={JSON.parse(JSON.stringify(gridPosts))}
        categories={JSON.parse(JSON.stringify(categories))}
        events={JSON.parse(JSON.stringify(events))}
        ads={JSON.parse(JSON.stringify(ads))}
        trendingPosts={trendingPosts}
      />
    </>
  );
}
