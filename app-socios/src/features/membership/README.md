# Local membership views

The DNI form selects one of the example profiles through `SocioContext`. It does not authenticate a user or persist data.

## Integration

| Export | Shell integration |
| --- | --- |
| `IngresoSocio` | `/`; optional `location.state.desde` local pathname, otherwise `/actividades` |

Render inside the existing Router and `SocioProvider`. The form provides `h1#page-title`; the shell owns the page landmarks. The component imports its `.login` styles and uses the shared tokens and controls.

## Behaviors to verify

- DNI stays a string: native validation is bypassed; rejected input is neither cleared nor normalized. Shared errors appear inline without navigation or enrollment changes. The three existing profiles are labelled as examples with current counts.

## Focused check

From `app-socios`:

```sh
npm test -- --runTestsByPath src/features/membership/membership.test.jsx
```

The suite uses the real React/Router/Provider harness and public Context observations. Full-app build, sibling integration, desktop/mobile browser rendering and screenshot comparison belong to the parent; these checks are not implied by jsdom results.
