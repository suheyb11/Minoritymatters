import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, toParagraphs, formatDate } from "@/lib/db";
import { Reveal } from "@/components/Motion";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post ? post.title : "Post not found", description: post?.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article>
      <header className="bg-mist">
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <Link href="/blog" className="text-sm font-semibold text-pink hover:underline">
            Back to blog
          </Link>
          <Reveal>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-muted">
              {post.author} · <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
            </p>
          </Reveal>
        </div>
      </header>

      {post.coverImage && (
        <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt="" className="w-full rounded-3xl object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {toParagraphs(post.body).map((p, i) => (
          <p key={i} className="mb-6 text-lg leading-[1.75] text-ink/85">
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
