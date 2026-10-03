export type LinkInput = {
  title: string;
  url: string;
  category: string;
  pinned: boolean;
  eventId?: string | null; // left out = unchanged on edit
};

/** Validates a link body; only http(s) URLs are accepted so a link can't run script when clicked. */
export function parseLinkInput(body: unknown): LinkInput | { error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const rawUrl = typeof input.url === 'string' ? input.url.trim() : '';

  if (!title || !category || !rawUrl) {
    return { error: 'Title, URL, and category are required' };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { error: 'That URL is not valid' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { error: 'URL must start with https://' };
  }

  const parsed: LinkInput = { title, url: url.toString(), category, pinned: input.pinned === true };
  if ('eventId' in input) {
    parsed.eventId = typeof input.eventId === 'string' && input.eventId ? input.eventId : null;
  }
  return parsed;
}
