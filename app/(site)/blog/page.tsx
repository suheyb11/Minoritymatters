import Link from "next/link";
import { getPosts, formatDate } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/Motion";

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <PageHeader title="blog" arc={0.5} intro="News, campaigns and reflections from Minority Matters." />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        {posts.length === 0 && <p className="text-muted">There are no posts yet. Check back soon.</p>}
        <ul className="divide-y divide-grey/40">
          {posts.map((post, i) => (
            <li key={post.id}>
              <Reveal delay={Math.min(i * 0.05, 0.2)}>
                <Link href={`/blog/${post.slug}`} className="group grid gap-6 py-10 sm:grid-cols-[1fr_2.5fr]">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImage} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                  ) : (
                    <time className="text-muted" dateTime={post.publishedAt.toISOString()}>
                      {formatDate(post.publishedAt)}
                    </time>
                  )}
                  <div>
                    {post.coverImage && <p className="text-sm text-muted">{formatDate(post.publishedAt)}</p>}
                    <h2 className="font-display text-3xl font-semibold leading-tight text-pink group-hover:underline">
                      {post.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-muted">{post.excerpt}</p>
                    <span className="mt-4 inline-block font-semibold text-ink">Read post</span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
