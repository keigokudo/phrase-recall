# Project Instructions

## Working style

- Work autonomously and complete tasks end-to-end.
- Do not stop to ask for confirmation unless a genuine product decision is ambiguous.
- Inspect the existing implementation before making changes.
- Prefer the smallest change that cleanly satisfies the requirement.
- Do not introduce unnecessary abstractions or dependencies.
- Preserve existing behavior unless the task explicitly requires changing it.

## Validation

After making changes:

1. Run relevant tests.
2. Run TypeScript type checking if available.
3. Run linting if available.
4. Run the production build if appropriate.
5. Fix any issues caused by your changes before finishing.

Do not stop after merely editing the files. Verify the implementation.

## Code quality

- Follow the existing architecture and coding style.
- Prefer simple, readable TypeScript.
- Avoid premature abstraction.
- Avoid large unrelated refactors.
- Reuse existing utilities/components where appropriate.
- Keep components and functions focused.

## Communication

- Do not ask for permission for routine implementation decisions.
- If multiple reasonable implementation approaches exist, choose the simplest one consistent with the current architecture.
- At the end, summarize:
  - what changed
  - files changed
  - tests/checks run
  - any remaining limitations
