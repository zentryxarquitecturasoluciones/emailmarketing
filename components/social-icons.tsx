const socialPlatforms = [
  {
    name: "WhatsApp",
    path: "M12 2a10 10 0 0 0-8.62 15.07L2 22l5.1-1.34A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.3-.18-3.03.8.81-2.95-.2-.31A8 8 0 1 1 12 20Zm4.4-5.98c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.53.12-.16.24-.61.78-.75.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.1.24-.28.36-.41.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.28-.73-1.75-.19-.45-.39-.39-.53-.39h-.45c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.99s.86 2.3.98 2.46c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.57.18 1.08.15 1.48.09.45-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z",
  },
  {
    name: "Facebook",
    path: "M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.6V3.9c-.8-.1-1.6-.2-2.4-.2-2.4 0-4 1.5-4 4.2V10H7.7v3h2.6v8h3.2Z",
  },
  {
    name: "Instagram",
    path: "",
  },
  {
    name: "TikTok",
    path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 1 1 2.9-2.9c0-.2-.02-.4-.06-.6v-3.52a6.37 6.37 0 1 0 3.51 5.68V9.3a8.16 8.16 0 0 0 4.77 1.53V7.4c-.34 0-.68-.03-1-.1Z",
  },
]

export function SocialIcons() {
  return (
    <div className="flex items-center justify-center gap-4 text-muted-foreground" role="group" aria-label="Social media">
      {socialPlatforms.map(({ name, path }) => (
        <span key={name} className="inline-flex h-5 w-5 items-center justify-center" role="img" aria-label={name}>
          {name === "Instagram" ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d={path} />
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}
