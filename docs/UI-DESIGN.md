# Fountain Gate interface

The interface follows the approved ivory-and-muted-gold church dashboard reference while retaining existing routes, capabilities, forms, and server services.

The church identity is **Fountain Gate Chapel, Change Pastures**. Use the supplied blue-and-gold logo at `public/images/church-logo.jpeg` without recoloring or distortion. The shared Brand component displays the church name and Change Pastures branch name across navigation and standalone screens.

## Shared styling

- `tailwind.config.js` defines the warm `slate` neutrals and `church` gold palette used throughout the app. Status colors retain their existing warning, success, and error meanings.
- `app/globals.css` supplies semantic surface, text, border, accent, radius, and shadow variables, shared card/button styles, form/table defaults, keyboard focus, reduced motion, and mobile safe-area clearance.
- Keep Inter for body copy and Outfit for headings. Prefer regular, medium, and semibold weights, subtle borders, and restrained shadows.
- Use `church-600` or darker for gold text/button backgrounds that must contrast with white. Lighter gold shades suit decorative icons and tinted surfaces.

## Navigation and dashboards

- `components/layout/navigation.ts` is the shared navigation definition. Permission filtering uses the existing capability map; presentation changes must not introduce a separate role policy.
- Desktop has a scrollable sidebar and persistent profile link. Mobile has Home, Giving, Prayer, Sermons, and More. More uses the existing native dialog with keyboard focus containment and restoration.
- Login, guest intake, and kiosk stay standalone, without application navigation.
- Only the member dashboard has the worship photograph. A live badge and Watch Live action require both enabled live settings and a broadcast URL. Otherwise the card offers Explore Sermons.
- Prayer highlights and staff attendance/giving cards read existing services. Loading, empty, and unavailable states must never invent records or success.
- Photograph source and license are recorded in `public/images/README.md`.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run test:browser`.

Browser redesign checks bundle actual client components with a browser-only router adapter, synthetic account props, and intercepted API responses. This isolated fixture is never included as a production route and does not alter authentication. Existing browser checks separately verify public forms and anonymous access denial; the native authenticated-navigation test requires the disposable PostgreSQL fixture.
