import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1. Create SUPER_ADMIN user
  // ============================================
  const hashedPassword = await hash("Admin@2024!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "admin@sanaathrumylens.co.ke",
      name: "Admin Sanaa",
      username: "admin_sanaa",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: new Date(),
      bio: "Super Administrator for Sanaa Through My Lens blog CMS",
    },
  });

  console.log(`✅ Created SUPER_ADMIN: ${admin.email}`);

  // Create additional demo users
  const editor = await prisma.user.upsert({
    where: { email: "editor@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "editor@sanaathrumylens.co.ke",
      name: "Wanjiku Editor",
      username: "wanjiku_editor",
      password: await hash("Editor@2024!", 12),
      role: "EDITOR",
      isActive: true,
      emailVerified: new Date(),
      bio: "Senior Editor at Sanaa Through My Lens",
    },
  });

  const author = await prisma.user.upsert({
    where: { email: "author@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "author@sanaathrumylens.co.ke",
      name: "Otieno Writer",
      username: "otieno_writer",
      password: await hash("Author@2024!", 12),
      role: "AUTHOR",
      isActive: true,
      emailVerified: new Date(),
      bio: "Arts and culture writer based in Nairobi",
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "moderator@sanaathrumylens.co.ke",
      name: "Amina Mod",
      username: "amina_mod",
      password: await hash("Moderator@2024!", 12),
      role: "MODERATOR",
      isActive: true,
      emailVerified: new Date(),
      bio: "Community moderator for Sanaa Through My Lens",
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {},
    create: {
      email: "reader@example.com",
      name: "Blog Reader",
      username: "blog_reader",
      password: await hash("Reader@2024!", 12),
      role: "READER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created demo users: editor, author, moderator, reader");

  // ============================================
  // 2. Create Categories
  // ============================================
  const categoriesData = [
    { name: "Music", slug: "music", description: "Kenyan and East African music scene — from gengetone to benga, Afro-fusion and beyond", color: "#E11D48", icon: "music", sortOrder: 1 },
    { name: "Film & Video", slug: "film-video", description: "Kenyan cinema, documentary, short films and the growing video content scene", color: "#7C3AED", icon: "film", sortOrder: 2 },
    { name: "Books & Literature", slug: "books-literature", description: "Kenyan literature, poetry, publishing and the storytelling tradition", color: "#0891B2", icon: "book-open", sortOrder: 3 },
    { name: "Visual Arts", slug: "visual-arts", description: "Contemporary and traditional visual arts — painting, sculpture, photography, digital art", color: "#059669", icon: "palette", sortOrder: 4 },
    { name: "Theatre & Performance", slug: "theatre-performance", description: "Stage arts, spoken word, dance and performance art in Kenya and East Africa", color: "#D97706", icon: "drama", sortOrder: 5 },
    { name: "Opinion & Commentary", slug: "opinion-commentary", description: "Critical perspectives on arts, culture and creative industry policy", color: "#DC2626", icon: "message-square", sortOrder: 6 },
    { name: "Events", slug: "events", description: "Art exhibitions, festivals, concerts, launches and cultural happenings", color: "#2563EB", icon: "calendar", sortOrder: 7 },
    { name: "Interviews & Features", slug: "interviews-features", description: "In-depth conversations with artists, curators, and cultural figures", color: "#9333EA", icon: "mic", sortOrder: 8 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.name] = created.id;
  }

  console.log(`✅ Created ${categoriesData.length} categories`);

  // ============================================
  // 3. Create Tags
  // ============================================
  const tagsData = [
    "Nairobi", "Kenya", "East Africa", "Afrobeats", "Gengetone",
    "Benga", "Contemporary Art", "Photography", "Poetry", "Festival",
    "Kampala", "Dar es Salaam", "Mombasa", "Culture", "Heritage",
    "Emerging Artists", "Review", "Analysis", "Trending", "New Release",
  ];

  const tags: Record<string, string> = {};
  for (const tagName of tagsData) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const created = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: tagName, slug },
    });
    tags[tagName] = created.id;
  }

  console.log(`✅ Created ${tagsData.length} tags`);

  // ============================================
  // 4. Create Sample Posts
  // ============================================
  const postsData = [
    {
      title: "The Rise of Gengetone: How Nairobi's Youth Are Redefining Kenyan Music",
      slug: "rise-of-gengetone-nairobi-youth-music",
      excerpt: "From the clubs of Eastlands to global streaming platforms, gengetone has become the voice of a generation.",
      content: `<h2>The Sound of a Generation</h2>
<p>Gengetone emerged from Nairobi's informal settlements around 2018, blending sheng slang, catchy hooks, and pulsating beats. What started as underground party music has become Kenya's most recognizable cultural export.</p>

<h2>From Clubs to Charts</h2>
<p>Artists like Sailors, Ethic, and Boondocks Gang pioneered the genre with tracks that dominated airwaves and social media. Their raw energy and unapologetic celebration of urban youth culture resonated far beyond Nairobi.</p>

<blockquote>"Gengetone is more than music — it's a cultural movement. It tells our stories in our language." — DJ Proposition</blockquote>

<h2>The Global Stage</h2>
<p>With collaborations featuring international artists and millions of YouTube views, gengetone has proven that local sounds can achieve global reach. The genre continues to evolve, incorporating Afrobeat influences and electronic production.</p>

<h2>What's Next</h2>
<p>As the industry matures, gengetone artists are exploring more sophisticated themes while maintaining the genre's infectious energy. The question isn't whether gengetone will endure — it's how it will transform next.</p>`,
      status: "PUBLISHED",
      isFeatured: true,
      allowComments: true,
      readingTime: 6,
      views: 1247,
      publishedAt: new Date("2024-12-15"),
      categoryNames: ["Music"],
      tagNames: ["Nairobi", "Kenya", "Gengetone", "Trending"],
      authorId: author.id,
    },
    {
      title: "Wanuri Kahiu's 'Pumzi' and the Future of African Sci-Fi Film",
      slug: "wanuri-kahiu-pumzi-african-sci-fi-film",
      excerpt: "How a Kenyan filmmaker's short film pioneered Afrofuturism in cinema and inspired a new wave of African speculative storytelling.",
      content: `<h2>A Vision of the Future</h2>
<p>Wanuri Kahiu's 2009 short film "Pumzi" (Swahili for "breath") presented a post-apocalyptic Africa where water is the most precious resource. Made on a modest budget, it became a landmark of African science fiction cinema.</p>

<h2>Afrofuturism on Screen</h2>
<p>Before Black Panther made Afrofuturism a household term, Kahiu was already imagining African futures rooted in both technology and tradition. "Pumzi" showed that African filmmakers could create compelling speculative fiction without Hollywood budgets.</p>

<blockquote>"I wanted to show that Africa has always been a place of innovation and imagination." — Wanuri Kahiu</blockquote>

<h2>The Ripple Effect</h2>
<p>Kahiu's work, including the acclaimed "Rafiki," has inspired a generation of East African filmmakers to explore genres beyond social realism. From Nairobi's emerging VFX studios to streaming platforms seeking African content, the infrastructure for African sci-fi is finally catching up to the vision.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 5,
      views: 834,
      publishedAt: new Date("2024-11-28"),
      categoryNames: ["Film & Video"],
      tagNames: ["Kenya", "Review", "Emerging Artists"],
      authorId: author.id,
    },
    {
      title: "Inside Nairobi's Thriving Contemporary Art Galleries",
      slug: "nairobi-contemporary-art-galleries",
      excerpt: "A guide to the spaces shaping Kenya's visual art landscape — from established institutions to experimental collectives.",
      content: `<h2>The Gallery Scene</h2>
<p>Nairobi's contemporary art scene has experienced remarkable growth over the past decade. Galleries like Circle Art Agency, One Off Contemporary Art Gallery, and the Nairobi Contemporary Art Institute (NCAI) have created platforms for both established and emerging artists.</p>

<h2>Must-Visit Spaces</h2>
<p>From the established corridors of Rahimtulla Museum to the experimental walls of Kuona Artists Collective, Nairobi offers a diverse gallery landscape. Each space has its own curatorial voice and community focus.</p>

<h2>Beyond the Walls</h2>
<p>Street art and public installations are also gaining recognition, with murals transforming neighborhoods like Kibera and downtown Nairobi into open-air galleries. The boundary between gallery and street continues to blur.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 7,
      views: 562,
      publishedAt: new Date("2024-12-01"),
      categoryNames: ["Visual Arts"],
      tagNames: ["Nairobi", "Kenya", "Contemporary Art", "Photography"],
      authorId: editor.id,
    },
    {
      title: "Draft: The State of Publishing in East Africa",
      slug: "state-of-publishing-east-africa",
      excerpt: "An in-depth look at the challenges and opportunities facing East African publishers in the digital age.",
      content: `<h2>Draft Content</h2><p>This is a draft article exploring the East African publishing landscape, from traditional print to digital platforms...</p>`,
      status: "DRAFT",
      isFeatured: false,
      allowComments: true,
      readingTime: 8,
      views: 0,
      categoryNames: ["Books & Literature"],
      tagNames: ["East Africa", "Kenya", "Culture"],
      authorId: author.id,
    },
    {
      title: "Pending: Lamu Cultural Festival — Preserving Swahili Heritage",
      slug: "lamu-cultural-festival-swahili-heritage",
      excerpt: "Celebrating twenty years of the Lamu Cultural Festival and its role in preserving Swahili traditions.",
      content: `<h2>A Celebration of Culture</h2><p>The Lamu Cultural Festival brings together communities to celebrate Swahili heritage through donkey races, dhow sailing, poetry, and traditional dance...</p>`,
      status: "PENDING_REVIEW",
      isFeatured: false,
      allowComments: true,
      readingTime: 5,
      views: 0,
      categoryNames: ["Events", "Heritage"],
      tagNames: ["Kenya", "Mombasa", "Heritage", "Festival"],
      authorId: author.id,
    },
  ];

  for (const postData of postsData) {
    const { categoryNames, tagNames, ...rest } = postData;

    const existingPost = await prisma.post.findUnique({ where: { slug: rest.slug } });
    if (existingPost) continue;

    // Get category IDs for this post
    const postCategoryIds = categoryNames
      .map((name: string) => categories[name])
      .filter(Boolean);

    const postTagIds = tagNames
      .map((name: string) => tags[name])
      .filter(Boolean);

    const post = await prisma.post.create({
      data: {
        ...rest,
        publishedAt: rest.publishedAt || undefined,
        categories: {
          create: postCategoryIds.map((categoryId: string) => ({ categoryId })),
        },
        tags: {
          create: postTagIds.map((tagId: string) => ({ tagId })),
        },
      },
    });

    // Create initial revision
    await prisma.postRevision.create({
      data: {
        postId: post.id,
        title: post.title,
        content: post.content,
        changeNote: "Initial version",
        version: 1,
        authorId: postData.authorId,
      },
    });
  }

  console.log(`✅ Created ${postsData.length} sample posts`);

  // ============================================
  // 5. Create Sample Events
  // ============================================
  const eventsData = [
    {
      title: "Nairobi International Jazz Festival 2025",
      slug: "nairobi-international-jazz-festival-2025",
      description: "The annual Nairobi International Jazz Festival returns with a stellar lineup of local and international jazz artists. Experience world-class performances in the heart of Kenya's capital.",
      excerpt: "Annual jazz festival featuring local and international artists",
      coverImage: null,
      eventType: "IN_PERSON",
      venue: "Carnivore Grounds",
      location: "Langata Road, Nairobi",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2025-03-15T14:00:00"),
      endDate: new Date("2025-03-16T22:00:00"),
      timezone: "Africa/Nairobi",
      websiteUrl: "https://nairobijazzfestival.com",
      ticketUrl: "https://nairobijazzfestival.com/tickets",
      isFree: false,
      price: "KES 3,000 - 15,000",
      isFeatured: true,
      isActive: true,
      categoryIds: [categories["Music"]],
    },
    {
      title: "East African Film Festival",
      slug: "east-african-film-festival-2025",
      description: "A celebration of East African cinema featuring screenings, workshops, and networking opportunities for filmmakers across the region.",
      excerpt: "Showcasing the best of East African cinema",
      coverImage: null,
      eventType: "HYBRID",
      venue: "Alliance Française, Nairobi",
      location: "Monrovia Street, Nairobi",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2025-04-10T09:00:00"),
      endDate: new Date("2025-04-14T21:00:00"),
      timezone: "Africa/Nairobi",
      isFree: false,
      price: "KES 500 - 2,000",
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Film & Video"]],
    },
    {
      title: "Kuona Artists Open Studio",
      slug: "kuona-artists-open-studio-2025",
      description: "Visit Kuona Artists Collective for their annual open studio event. Meet artists, see works in progress, and purchase original art directly from creators.",
      excerpt: "Meet artists and explore their creative spaces",
      coverImage: null,
      eventType: "IN_PERSON",
      venue: "Kuona Artists Collective",
      location: "Dennis Pritt Road, Nairobi",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2025-02-22T10:00:00"),
      endDate: new Date("2025-02-23T17:00:00"),
      timezone: "Africa/Nairobi",
      isFree: true,
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Visual Arts"]],
    },
  ];

  for (const eventData of eventsData) {
    const { categoryIds: eventCatIds, ...rest } = eventData;

    const existingEvent = await prisma.event.findUnique({ where: { slug: rest.slug } });
    if (existingEvent) continue;

    await prisma.event.create({
      data: {
        ...rest,
        categories: {
          create: eventCatIds
            .filter(Boolean)
            .map((categoryId: string) => ({ categoryId })),
        },
      },
    });
  }

  console.log(`✅ Created ${eventsData.length} sample events`);

  // ============================================
  // 6. Create Site Settings
  // ============================================
  const settingsData = [
    { key: "site_name", value: "Sanaa Through My Lens", label: "Site Name", type: "text" },
    { key: "site_description", value: "An arts & culture opinion blog focused on Kenya and East Africa — exploring music, film, literature, visual arts, and theatre through critical perspectives.", label: "Site Description", type: "text" },
    { key: "site_tagline", value: "Arts. Culture. Perspective.", label: "Tagline", type: "text" },
    { key: "site_url", value: "https://sanaathrumylens.co.ke", label: "Site URL", type: "text" },
    { key: "posts_per_page", value: "10", label: "Posts Per Page", type: "number" },
    { key: "allow_comments", value: "true", label: "Allow Comments", type: "boolean" },
    { key: "moderate_comments", value: "true", label: "Moderate Comments", type: "boolean" },
    { key: "require_review", value: "true", label: "Require Post Review", type: "boolean" },
    { key: "social_twitter", value: "@sanaalens", label: "Twitter Handle", type: "text" },
    { key: "social_instagram", value: "@sanaathrumylens", label: "Instagram Handle", type: "text" },
    { key: "social_youtube", value: "", label: "YouTube Channel", type: "text" },
    { key: "contact_email", value: "hello@sanaathrumylens.co.ke", label: "Contact Email", type: "text" },
    { key: "analytics_enabled", value: "false", label: "Analytics Enabled", type: "boolean" },
    { key: "maintenance_mode", value: "false", label: "Maintenance Mode", type: "boolean" },
    { key: "newsletter_enabled", value: "true", label: "Newsletter Enabled", type: "boolean" },
  ];

  for (const setting of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✅ Created ${settingsData.length} site settings`);

  // ============================================
  // 7. Create Newsletter Subscribers
  // ============================================
  const subscribersData = [
    { email: "subscriber1@example.com", name: "Jane Doe", token: "sub_token_001" },
    { email: "subscriber2@example.com", name: "John Smith", token: "sub_token_002" },
  ];

  for (const sub of subscribersData) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: sub.email },
      update: {},
      create: { ...sub, status: "ACTIVE" },
    });
  }

  console.log("✅ Created newsletter subscribers");

  // ============================================
  // 8. Create Sample Comments
  // ============================================
  const publishedPost = await prisma.post.findFirst({ where: { status: "PUBLISHED" } });
  if (publishedPost) {
    await prisma.comment.createMany({
      data: [
        {
          content: "Great article! Gengetone really has changed the Kenyan music landscape.",
          postId: publishedPost.id,
          authorId: reader.id,
          status: "APPROVED",
        },
        {
          content: "I'd love to see more coverage of the underground hip-hop scene in Nairobi too.",
          postId: publishedPost.id,
          authorId: moderator.id,
          status: "APPROVED",
          moderatedById: editor.id,
        },
        {
          content: "This is a pending comment for moderation review.",
          postId: publishedPost.id,
          authorId: reader.id,
          status: "PENDING",
        },
      ],
    });
    console.log("✅ Created sample comments");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials:");
  console.log("  SUPER_ADMIN: admin@sanaathrumylens.co.ke / Admin@2024!");
  console.log("  EDITOR:      editor@sanaathrumylens.co.ke / Editor@2024!");
  console.log("  AUTHOR:      author@sanaathrumylens.co.ke / Author@2024!");
  console.log("  MODERATOR:   moderator@sanaathrumylens.co.ke / Moderator@2024!");
  console.log("  READER:      reader@example.com / Reader@2024!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
