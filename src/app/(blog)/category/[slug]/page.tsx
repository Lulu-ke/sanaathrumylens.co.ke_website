import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { CategoryPageClient } from './category-client';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} — Sanaa Through My Lens`,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });

  if (!category || !category.isActive) {
    notFound();
  }

  const posts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      categories: { some: { categoryId: category.id } },
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  const events = await db.event.findMany({
    where: {
      isActive: true,
      categories: { some: { categoryId: category.id } },
      startDate: { gte: new Date().toISOString() },
    },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
    },
    orderBy: { startDate: 'asc' },
    take: 3,
  });

  return (
    <CategoryPageClient
      category={JSON.parse(JSON.stringify(category))}
      posts={JSON.parse(JSON.stringify(posts))}
      events={JSON.parse(JSON.stringify(events))}
    />
  );
}
