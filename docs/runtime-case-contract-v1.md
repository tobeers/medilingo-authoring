# Medilingo Runtime Case Contract v1

This contract is the boundary between the authoring platform and the learning apps.

## Runtime endpoints

The database exposes two read-only RPCs for published content:

- `list_runtime_cases_v1(p_locale text)`
- `get_runtime_case_package_v1(p_case_code text, p_locale text)`

Both functions are `SECURITY INVOKER`. Existing RLS remains authoritative, so Draft / Review / Approved content is not exposed to the learning app.

## Design goal

Authoring data may evolve without forcing iOS or Android to know the internal database schema. The RPC converts the published authoring representation into the stable Clinical Case runtime package used by the existing iOS engine.

## Runtime package fields

- `schemaVersion`
- `caseID`
- `caseVersion`
- `title`
- `initialPresentation`
- `history[]`
- `procedures[]`
- `diagnostics[]`
- `treatments[]`
- `targetDiagnosisID`
- `hints[]`
- `timeline[]`
- `completion`
- `endpointPolicy`
- `scoring`

The v1 output intentionally matches the existing Swift `ClinicalCaseContent` Codable shape so iOS can decode server content directly without rebuilding medical truth in the client.

## Cross-platform rule

Android must consume the same runtime package. Medical action IDs, diagnosis IDs, endpoints and case truth remain language-neutral. Localization is selected server-side via `p_locale`.

## Offline rule

Clients cache the exact runtime JSON. A previously downloaded case remains playable offline. Uncached cases require a network connection.

## Version rule

`caseVersion` maps to the published content version. Future incompatible package changes require a new contract/RPC version rather than silently changing v1.
