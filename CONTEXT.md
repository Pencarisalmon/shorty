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

**Sign in**:
The act of establishing a session, by entering a one-time code sent to an email address.
_Avoid_: Login, log in, authenticate

**One-time code**:
The 6-digit code emailed to a visitor's address that proves they own it; expires after 5 minutes.
_Avoid_: OTP, code, verification code

**Session**:
The signed-in state stored server-side, carried by an httpOnly cookie; slides on use up to a 90-day absolute cap.
_Avoid_: JWT, token, login state

**Tape**:
The chronological stream of printed receipts / recent short links displayed on the home page.
_Avoid_: Feed, history, link list

**Dismiss**:
The act of removing a receipt from a visitor's local tape view without deleting the link from the database.
_Avoid_: Hide, clear item

**Delete**:
The act of permanently removing a short link from the database, permitted only to the link's owner.
_Avoid_: Remove, destroy, purge

