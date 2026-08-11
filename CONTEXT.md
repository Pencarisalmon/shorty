# Shorty

Shortens long URLs into short, shareable links: each short URL carries a unique code that redirects visitors to the original target URL.

## Language

**Target URL**:
The URL a short link points at; where visitors get redirected.
_Avoid_: Long URL, destination

**Code**:
The unique short key that forms the path of a short URL.
_Avoid_: Slug, token

**Short URL**:
The full URL a visitor sees or shares — the code prefixed by the service's base URL. Derived on demand, never stored.
_Avoid_: Shortened URL

**Shorten**:
The act of creating a short URL from a target URL.
_Avoid_: Generate, create
