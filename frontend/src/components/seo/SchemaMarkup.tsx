import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SchemaProps {
    type: 'Legislation' | 'VoteAction' | 'FAQPage' | 'Person';
    data: any;
}

export const SchemaMarkup: React.FC<SchemaProps> = ({ type, data }) => {
    let schema = {};

    if (type === 'Legislation') {
        schema = {
            "@context": "https://schema.org",
            "@type": "Legislation",
            "name": data.title, // "Wakacje Kredytowe 2024" (Street Title)
            "description": data.description,
            "legislationType": "Act",
            "legislationPassedBy": {
                "@type": "Organization",
                "name": "Sejm Rzeczypospolitej Polskiej"
            },
            "datePublished": data.date,
            "text": data.contentSnippet, // Short excerpt
            "keywords": data.keywords?.join(", ")
        };
    }

    if (type === 'VoteAction') {
        schema = {
            "@context": "https://schema.org",
            "@type": "VoteAction",
            "agent": {
                "@type": "Person",
                "name": data.mpName
            },
            "object": {
                "@type": "Legislation",
                "name": data.billTitle
            },
            "actionOption": data.voteResult // "Za", "Przeciw"
        };
    }

    if (type === 'FAQPage') {
        schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": data.questions?.map((q: any) => ({
                "@type": "Question",
                "name": q.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": q.answer
                }
            })) || []
        }
    }

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};
