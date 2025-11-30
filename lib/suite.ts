/**
 * THE AEON LAUNCHER SUITE: every tool in the family, for the switcher in the header (components/suite-switcher.tsx).
 * Shared: the same file in every app (_shared, synced by `node _shared/sync.mjs`). Each app says which one it is
 * through `chain.suiteId` in its own lib/chain.ts. Add a launcher here once and every app lists it.
 *
 * Where the tools live is set at build time:
 *   NEXT_PUBLIC_SUITE_DOMAIN   "example.com" → https://solana.example.com, https://robinhood.example.com, …
 *                              unset → each tool's local port (the `dev` / `start` script of its package.json)
 *   NEXT_PUBLIC_HOME_URL       where the logo in the header goes (default: this app's own home)
 *   NEXT_PUBLIC_DOCS_URL       a docs link in the header and the switcher (hidden when unset)
 *   NEXT_PUBLIC_GITHUB_URL     the organisation the repositories live under: shows "Clone this app" (hidden when unset)
 */
export type SuiteStatus = "live" | "soon"
export type SuiteItem = {
  id: string
  /** what people call it ("Solana", "Robinhood Chain") */
  name: string
  /** the launchpads it covers, or what it does */
  sub: string
  /** where it runs; null while it is coming */
  url: string | null
  /** its repository, when NEXT_PUBLIC_GITHUB_URL is set */
  repo: string | null
  /** a logo under public/logos/ (every app ships the same logo set) */
  logo: string
  status: SuiteStatus
}

const DOMAIN = (process.env.NEXT_PUBLIC_SUITE_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
const GITHUB = (process.env.NEXT_PUBLIC_GITHUB_URL || "").trim().replace(/\/+$/, "")
const at = (sub: string, port: number): string => (DOMAIN ? `https://${sub}.${DOMAIN}` : `http://localhost:${port}`)
const repo = (name: string): string | null => (GITHUB ? `${GITHUB}/${name}` : null)

export const SUITE: { name: string; home: string; docs: string | null; github: string | null } = {
  name: "Aeon Launcher",
  home: process.env.NEXT_PUBLIC_HOME_URL || "/",
  docs: process.env.NEXT_PUBLIC_DOCS_URL || null,
  github: GITHUB || null,
}

export const LAUNCHERS: SuiteItem[] = [
  { id: "pumpfun", name: "Solana", sub: "pump.fun · StonkFun · letsbonk · Raydium", url: at("solana", 4101), repo: repo("solana-launcher"), logo: "/logos/chains/solana.svg", status: "live" },
  { id: "pons", name: "Robinhood Chain", sub: "pons · pools.trade · circus · Sushi · pools.fun", url: at("robinhood", 4102), repo: repo("robinhood-launcher"), logo: "/logos/chains/robinhood.svg", status: "live" },
  { id: "bnb", name: "BNB Chain", sub: "Flap · four.meme", url: at("bnb", 4103), repo: repo("bnb-launcher"), logo: "/logos/chains/bnb.svg", status: "live" },
  { id: "base", name: "Base", sub: "Clanker", url: at("base", 4104), repo: repo("base-launcher"), logo: "/logos/chains/base.svg", status: "live" },
  { id: "eth", name: "Ethereum", sub: "Sender · Stockereum", url: at("eth", 4105), repo: repo("eth-launcher"), logo: "/logos/chains/ethereum.svg", status: "live" },
  { id: "arc", name: "Arc", sub: "Tolly · Argus · pools.trade", url: at("arc", 4106), repo: repo("arc-launcher"), logo: "/logos/chains/arc.png", status: "live" },
  { id: "elysium", name: "Elysium", sub: "Montra · Ascend · Volta · BOXA", url: at("elysium", 4107), repo: repo("elysium-launcher"), logo: "/logos/chains/elysium.svg", status: "live" },
]

export const TOOLS: SuiteItem[] = [
  { id: "mover", name: "Wallet mover", sub: "move coins between wallets and chains", url: at("mover", 4108), repo: repo("wallet-mover"), logo: "/logos/tools/mover.svg", status: "live" },
]

export const suiteItem = (id: string): SuiteItem | undefined => [...LAUNCHERS, ...TOOLS].find((x) => x.id === id)
