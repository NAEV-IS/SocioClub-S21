# Local membership views

Default exports implement the approved agenda's DNI entry, active schedules and itemized monthly fee. All membership writes use the frozen `SocioContext`; this is a local example, not authentication, persistence or payment.

## Integration

| Export | Shell integration |
| --- | --- |
| `IngresoSocio` | `/`; optional `location.state.desde` local pathname, otherwise `/actividades` |
| `MisActividades` | `/mis-actividades`, inside the shell's selected-member boundary |
| `ResumenCuota` | Required `actividades` array, validated with real PropTypes and the shared activity shape |

Render inside the existing Router and `SocioProvider`. Each page supplies `h1#page-title`, never another main/header/footer. CSS is imported by the components, scoped to `.login`/`.membership`, and uses shared tokens/controls. The parent owns global action feedback and route/confirmation-result focus.

## Behaviors to verify

- DNI stays a string: native validation is bypassed; rejected input is neither cleared nor normalized. Shared errors appear inline without navigation or enrollment changes. The three existing profiles are labelled as examples with current counts.
- Schedules are ordered by time. Cancellation opens inline confirmation and focuses “Mantener inscripción”; keeping restores the trigger. Only explicit confirmation calls `darDeBaja`. Pending confirmation is discarded on page/member changes, while Context preserves enrollments and filters.
- The shared fee helper covers 0/1/2/3 activities: no discount / no discount / 10% / 15%. Camila's initial 65,000 − 9,750 = 55,250 is rendered with the shared es-AR formatter. Empty schedules retain the summary and an agenda recovery link.

## Focused check

From `app-socios`:

```sh
npm test -- --runTestsByPath src/features/membership/membership.test.jsx
```

The suite uses the real React/Router/Provider harness and public Context observations. Full-app build, sibling integration, desktop/mobile browser rendering and screenshot comparison belong to the parent; these checks are not implied by jsdom results.
