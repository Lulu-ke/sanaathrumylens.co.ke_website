import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PostDetailClient } from './post-detail-client';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, ogImage: true, publishedAt: true, updatedAt: true },
  });

  if (!post) return { title: 'Post Not Found' };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/post/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: post.ogImage ? [post.ogImage] : undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.ogImage ? [post.ogImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true, bio: true },
      },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { comments: true, bookmarks: true } },
    },
  });

  if (!post || post.status !== 'PUBLISHED') {
    notFound();
  }

  // Fetch related posts (same categories, excluding current)
  const categoryIds = post.categories.map((c) => c.categoryId);
  const relatedPosts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  // Fetch other posts by same author
  const authorPosts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      authorId: post.authorId,
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const primaryCategory = post.categories[0]?.category;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featuredImage || undefined,
    url: `https://sanaathrumylens.co.ke/post/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sanaathrumylens.co.ke/post/${post.slug}`,
    },
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
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

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sanaathrumylens.co.ke' },
      ...(primaryCategory ? [{ '@type': 'ListItem', position: 2, name: primaryCategory.name, item: `https://sanaathrumylens.co.ke/category/${primaryCategory.slug}` }] : []),
      { '@type': 'ListItem', position: primaryCategory ? 3 : 2, name: post.title, item: `https://sanaathrumylens.co.ke/post/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PostDetailClient
        post={JSON.parse(JSON.stringify(post))}
        relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
        authorPosts={JSON.parse(JSON.stringify(authorPosts))}
      />
    </>
  );
}
