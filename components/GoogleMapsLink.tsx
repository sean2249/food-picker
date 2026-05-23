// Pin icon that deep-links to Google Maps. On mobile the universal link is
// intercepted by the Google Maps app; on desktop it opens the web map.
// Shared by RestaurantCard and RecommendPanel result cards.

interface Props {
  url: string
  address?: string | null
}

export function GoogleMapsLink({ url, address }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="在 Google Maps 開啟"
      title={address ?? '在 Google Maps 開啟'}
      className="inline-flex items-center justify-center h-6 w-6 rounded-full
                 text-brand/70 hover:text-brand hover:bg-brand/10 transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <GoogleMapsPinIcon />
    </a>
  )
}

// Hand-drawn pin with a small dog-ear "map fold" to read as Maps, not a generic
// location pin. Same stroke language as PinIcon / StarIcon.
function GoogleMapsPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  )
}
