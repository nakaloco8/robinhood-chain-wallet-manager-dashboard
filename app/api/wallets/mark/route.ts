import { body, fail, ok, strings } from "@/lib/http"
import { exportKeys } from "@/lib/wallets"
import { CHAIN } from "@/lib/core/wallet-record"
import { markBody } from "@/lib/core/launch-mark"

/**
 * POST /api/wallets/mark { wallets: [{ publicKey, label? }] } → { mark }: the launch's wallet set, packed
 * (lib/core/launch-mark.ts) as the record the coin's metadata carries. Local mode's copy of the browser engine's
 * route of the same name.
 */
export async function POST(req: Request) {
  const b = await body<{ wallets: Array<{ publicKey: string; label?: string }> }>(req)
  const targets = strings(b.wallets?.map((w) => w.publicKey))
  if (!targets.length) return fail(new Error("wallets: at least one wallet"), 400)
  try {
    const keys = exportKeys(targets)
    return ok({ mark: markBody(keys.map((k, i) => ({ publicKey: k.publicKey, secret: k.privateKey, label: b.wallets?.[i]?.label ?? k.label })), CHAIN) })
  } catch (e) {
    return fail(e)
  }
}
