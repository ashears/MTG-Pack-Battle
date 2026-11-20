# MTG Pack Battle

A free, static homepage and starting-token randomizer for a casual two-player Magic: The Gathering variant.

**Website:** https://ashton.website/MTG-Pack-Battle/

## Preview and test

Requires Node.js 22 or newer. There are no dependencies to install.

```sh
npm start
```

Open http://127.0.0.1:4173/MTG-Pack-Battle/. The preview deliberately uses the same project path as GitHub Pages.

```sh
npm test
npm run build
```

`build` only copies public files into `_site/`; the application itself is buildless HTML, CSS, and JavaScript modules. Tests cover sampling with and without replacement, equal-probability intervals and permutations, validation, catalog integrity, and saved-setting recovery.

## Format

- Each of two players opens one booster, removes tokens and non-playable inserts, and keeps all playable cards, including basic lands.
- Add 10 basic lands of your choice. Each player has an emblem: **Basic lands you control have “{T}: Add one mana of any color.”** Existing abilities remain.
- Start at 20 life, with five cards and no mulligans. Randomly choose who decides play/draw. The starting player skips their first draw step.
- When a player would draw from an empty library, they lose 5 life, shuffle their graveyard into their library, and try that draw again. They lose at zero life or if their library remains empty. Resolve multiple draws individually.
- Optional starting tokens: agree on the pool and count, roll individually or share a roll by agreement, then each player creates their assigned tokens untapped at the beginning of their first upkeep.
- Other normal two-player Magic rules apply. Multiple-booster rules are not defined in v1.

## Expand the catalog

`data/tokens.js` stores one record per mechanical token type: stable `id`, `name`, `rulesText`, `imageUrl`, `sourceUrl`, and `artist`. Artwork does not create an additional roll option. Add future token records there; controls and reference cards render automatically.

`data/presets.js` is a separate list of named presets containing `id`, `name`, and `tokenIds`. The initial **Supplies** preset contains Treasure, Clue, Map, and Lander. Add IDs explicitly to a preset when extending it; this prevents catalog additions from silently altering existing pools. Update the intentional initial-catalog assertions in the tests when expanding the catalog.

Retrieve representative card metadata from the Scryfall API during maintenance, with an identifying User-Agent and Accept header and within its rate limits. Copy the canonical rules, image URL, source URL, and artist into the catalog. The browser never requests the API. Card images load directly from Scryfall's image service. Image failures show the token name, while rules remain readable. Rolling works if external images are unavailable.

Settings are stored under `mtg-pack-battle.settings.v1` in localStorage. No accounts, analytics, server, or API keys are required. Blocked browser storage falls back to in-memory settings. Rolled results are ephemeral.

## GitHub Pages deployment

The public repository is `ashears/MTG-Pack-Battle`. In **Settings → Pages → Build and deployment**, select **GitHub Actions**. Keep the project custom-domain field empty and do not add a `CNAME` here: the account's main Pages repository already owns `ashton.website`, so this project inherits `https://ashton.website/MTG-Pack-Battle/`.

`.github/workflows/pages.yml` tests and stages the site for pushes and pull requests. Pushes to `main` (and manual workflow runs) publish `_site/` with GitHub Pages. Pull requests only validate. The workflow uses read-only repository contents and grants Pages write/OIDC permissions only to the deployment job. All site assets use relative paths; navigation uses anchors and needs no SPA rewrites. No paid hosting service is used.

To provision Pages with an authenticated GitHub CLI, once the repository exists:

```sh
gh api --method POST repos/ashears/MTG-Pack-Battle/pages -f build_type=workflow
```

If Pages is already provisioned, change its build type with `--method PUT`. Check workflow status and the deployed URL after publishing. Keep the account-level domain settings unchanged.

## Credits

Unofficial fan project, unaffiliated with Wizards of the Coast. Magic: The Gathering and card artwork © Wizards of the Coast. Card data and images via [Scryfall](https://scryfall.com); each card credits its artist and links to the original listing. Original site code and game-variant description are distinct from third-party card artwork and trademarks.
