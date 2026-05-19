import { useEffect } from 'react';

/**
 * Mutates document.head to inject:
 *  - <title> and <meta description>
 *  - Open Graph + Twitter cards (so WhatsApp/FB previews look real)
 *  - schema.org Product JSON-LD (Google Shopping eligibility)
 *
 * Restores the previous tags on unmount so navigating away doesn't leave
 * stale metadata for the next page.
 */
export default function ProductSEO({ product }) {
  useEffect(() => {
    if (!product) return;

    const title = `${product.name} — Dam Kemon`;
    const description = (product.description || `Compare ${product.name} prices across Bangladesh shops`).slice(0, 240);
    const image = product.imageUrl || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const prevTitle = document.title;
    document.title = title;

    const tags = [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'product' },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    const created = [];
    for (const t of tags) {
      const sel = t.name ? `meta[name="${t.name}"]` : `meta[property="${t.property}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        if (t.name) el.setAttribute('name', t.name);
        if (t.property) el.setAttribute('property', t.property);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute('content', t.content);
    }

    // JSON-LD
    const ld = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      image: product.imageUrl ? [product.imageUrl] : undefined,
      description: product.description || undefined,
      offers: (product.prices || []).map((p) => ({
        '@type': 'Offer',
        url: p.productUrl,
        priceCurrency: p.currency || 'BDT',
        price: p.price,
        availability: p.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: p.siteName },
      })),
    };
    if (product.averageRating > 0) {
      ld.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.totalReviews || 1,
      };
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    script.setAttribute('data-product-seo', '');
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      script.remove();
    };
  }, [product]);

  return null;
}
