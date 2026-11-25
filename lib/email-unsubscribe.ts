export function addUnsubscribeLink(content: string, email: string, origin: string): string {
  const unsubscribeUrl = new URL("/unsubscribe", process.env.APP_BASE_URL || origin)
  unsubscribeUrl.searchParams.set("email", email)
  const href = unsubscribeUrl.toString().replace(/&/g, "&amp;")
  const personalizedContent = content.replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, href)

  if (/<a\b[^>]*href=(["'])[^"']*\/unsubscribe(?:[?#][^"']*)?\1/i.test(personalizedContent)) {
    return personalizedContent
  }

  return `${personalizedContent}\n\n<p style="text-align: center; font-size: 12px; color: #999;"><a href="${href}">Cancelar suscripción</a></p>`
}
