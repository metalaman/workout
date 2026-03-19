# IronLog E2E Tests (Maestro)

## Setup
1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Start app: `npx expo start`
3. Run all: `maestro test .maestro/`
4. Run one: `maestro test .maestro/01-auth.yaml`

## Test Order
Tests are numbered and should run sequentially (auth first, then features).

## Screenshots
Baseline screenshots are stored in `.maestro/screenshots/`.
Use `maestro test --format junit` for CI output.
