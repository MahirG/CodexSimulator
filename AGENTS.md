# Repository guidance

- Use Next.js App Router and strict TypeScript.
- Preserve the three product surfaces: Quick Deck, Agent Workbench, and Workflow Builder.
- Do not expose shell, filesystem, Git credentials, or service-role keys to browser code.
- New destructive or production actions must pass through an explicit approval object and audit event.
- Keep touch targets accessible, provide text labels in addition to color, and support reduced motion.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` before publishing changes.
