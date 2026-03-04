# Definition of Done

A change is done only when:

- tests were written or updated first for the affected behavior
- `npm run test` passes
- `npm run check` passes
- `npm run build` passes
- content contracts remain valid
- public routes remain compatible with the portfolio URL contract
- the change is merged through the expected GitHub branch flow (`feature/*` -> `develop` -> `main`)
