# ADR 001: Product Scope as a Static Content Hub

- Status: Accepted
- Date: 2026-03-04

## Context

The current repository started from an Astro starter template. It needs a clear product boundary so the project does not drift into unnecessary platform complexity during the first delivery cycles.

## Decision

`agro2code-blog` is a static editorial hub.

- It publishes articles, ideas, news, discussions, and technical notes.
- It integrates with the portfolio through stable URLs only.
- It does not include authentication, comments, or an admin panel in phase 1.

## Consequences

- Publishing speed, content quality, and route stability are the main success criteria.
- Backend features remain explicitly out of scope until the content operation is stable.

