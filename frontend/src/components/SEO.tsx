import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
}

export default function SEO({
    title,
    description = "Przeglądaj dane Sejmu RP. Wyniki głosowań, profile posłów, rankingi i statystyki. Sprawdź jak pracują Twoi reprezentanci.",
    image = "/og-image.png",
    url
}: SEOProps) {

    const siteTitle = "OtwartyParlament.pl";
    const fullTitle = title === siteTitle ? siteTitle : `${title} | ${siteTitle}`;

    // Ensure absolute URL for OG tags
    const siteUrl = "https://otwartyparlament.pl";
    const absoluteUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;
    const absoluteImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={absoluteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={absoluteImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={absoluteUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={absoluteImage} />
        </Helmet>
    );
}
