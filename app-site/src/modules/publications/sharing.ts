export interface ShareDetails {
  title: string;
  summary: string;
  url: string;
}

export function emailShareUrl(details: ShareDetails): string {
  const parameters = new URLSearchParams({
    subject: details.title,
    body: `${details.summary}\n\n${details.url}`,
  });
  return `mailto:?${parameters.toString()}`;
}

export function xShareUrl(details: ShareDetails): string {
  const parameters = new URLSearchParams({
    text: `${details.summary} ${details.url}`,
  });
  return `https://twitter.com/intent/tweet?${parameters.toString()}`;
}

export function linkedInShareUrl(details: ShareDetails): string {
  const parameters = new URLSearchParams({ url: details.url });
  return `https://www.linkedin.com/sharing/share-offsite/?${parameters.toString()}`;
}

export function facebookShareUrl(details: ShareDetails): string {
  const parameters = new URLSearchParams({ u: details.url });
  return `https://www.facebook.com/sharer/sharer.php?${parameters.toString()}`;
}
