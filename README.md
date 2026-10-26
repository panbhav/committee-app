# Banking Society

A React 19 / Vite 8 committee workspace for monthly collections, member and outer loans, borrowing limits, passbooks, annual settlement estimates, and Excel/PDF reports. Capacitor provides the Android wrapper.

## Run locally

Use Node **22.12+** (Node 24 also works).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Development uses a clearly labelled **local demo**: choose an administrator, member, or borrower, or enter a member name / phone / loan ID. Changes persist in this browser. Demo identities never connect to Firebase. Hindi and English are available in the header.

```sh
npm run lint
npm test
npm run verify:calculations
npm run build
npm run preview
```

The native Vite config loader avoids the Windows config-bundler failure seen with native Tailwind plugins. The test command runs in one process for restricted Windows environments. CI checks lint and regression tests before building.

## Build modes and production access

`npm run build` makes the production bundle. The existing `public/app-status.json` suspension remains in place. The hardcoded master unlock and simulated OTP have been removed. If the license is active, production shows an explicit unconfigured-access screen until verified sign-in is implemented. Browser storage is not production authentication.

To build an explicitly local demonstration, set `VITE_DEMO_MODE=true` in `.env.local` and rebuild. Keep this flag off for production. `.env.local` is ignored by Git.

Cloud synchronization is off by default. `VITE_ENABLE_CLOUD_SYNC=true` alone is insufficient: the legacy adapter also requires an authenticated Firebase user. There is no production sign-in integration in this repository yet. Before enabling real access, implement verified authentication, map identities to accounts on the server, deploy and test database/storage permissions, and replace the shared-document write model with transactional records. See [REPO_REVIEW.md](REPO_REVIEW.md).

## Records and calculations

- Initial September 2026 data contains 15 members and 87 loans. Existing agreed installments are preserved.
- Unsaved meeting months project from the nearest saved ledger. Loans are excluded before their start and after their final installment. Saved monthly snapshots remain unchanged.
- Interest defaults: member 10% / 12 months or 5% / 6 months; outer 16% / 12 months or 8% / 6 months. Outer security fee is 0.5%. Existing custom rates remain supported.
- Annual whole-rupee dividends conserve the common pool. Remainders are assigned one rupee at a time in stored member order; the per-member detail and Excel export show each actual allocation.
- Progress is an administrative installment counter, not a verified receipt history. Automatic month projections do not prove payment.
- Financial undo requires the original meeting month, refuses conflicting newer actions, and consumes the original undo entry.
- Factory reset only removes app-prefixed browser keys. The cloud maintenance script is read-only by default; destructive reset additionally requires `--reset` and an explicit environment confirmation. Do not run resets against live records without a backup.

## Android

After building, run `npm run cap:sync`, then build with Android Studio or the existing GitHub Actions workflow. Android device behavior and APK compilation need a configured Android SDK/JDK environment; browser checks do not validate native export or file-sharing behavior.
