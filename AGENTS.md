# Tavvy engineering handoff

Read [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) and
[docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) before changing Tavvy.
The dated status distinguishes production releases, local preparation and open work.
Older feature notes are historical evidence, not proof that a feature is live.

Product behavior should agree between `tavvy-web` and `tavvy-mobile` where applicable.
Preserve existing eCard designs, saved content, features and approved pricing.
Use fictional examples for templates; never turn a real person's or business's card
into sample data. Check the relevant domain before changing review vocabulary.

The development workspace currently contains unrelated unfinished changes. Build
and deploy reviewed, isolated batches; do not publish the entire dirty workspace.
Record the actual checks, release target and remaining limitations in the status
document after each completed batch. A local change or passing test is not a deployment.

This repository is public. Project memory must not contain credentials, production
data exports, customer inventories, private incident details or privileged commands.
Obtain private operational runbooks and release evidence from the project maintainer.
