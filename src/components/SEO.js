import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SEO({
    title,
    description = "Rent luxury properties, villas, and apartments with JustRentIt.",
    image = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200",
    type = "website"
}) {
    const router = useRouter();
    const siteUrl = "https://justrent-it.vercel.app";
    const canonicalUrl = `${siteUrl}${router.asPath === '/' ? '' : router.asPath}`;
    const fullTitle = `${title} | JustRentIt`;

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="JustRentIt" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonicalUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
        </Head>
    );
}
