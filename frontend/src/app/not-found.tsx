import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col items-center px-4 py-32 text-center sm:px-6 lg:px-10">
      <span className="display text-[clamp(6rem,18vw,13rem)] leading-none text-ink-750">404</span>

      <p className="eyebrow -mt-6">Off the shelf</p>

      <h1 className="display mt-6 text-[clamp(1.9rem,4vw,3rem)]">
        We couldn&rsquo;t find that page
      </h1>

      <p className="mt-6 max-w-md text-[14px] leading-[1.85] text-ink-400">
        The link may be broken, or the product may no longer be listed.
        Try searching the catalogue instead — five hundred products are still
        exactly where we left them.
      </p>

      <div className="mt-11 flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="lux-btn">
          Browse the collection
        </Link>
        <Link href="/" className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500">
          Go home
        </Link>
      </div>
    </div>
  );
}
