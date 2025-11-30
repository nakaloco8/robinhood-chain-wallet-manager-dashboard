/**
 * Launch mark: the launch's own record, carried with the coin's metadata.
 *
 * A launch is easy to lose: the tab closes, the folder moves, the log scrolls away. So the
 * launch writes a short self-describing record (which wallets took part, on which chain, when)
 * next to the coin's image and links, in the metadata JSON. It is a small binary blob, wrapped
 * for the app's mark key (ephemeral X25519 + ChaCha20-Poly1305): an opaque string under the
 * `backup` field, no wider than a link, that the app's own tools can read back.
 *
 * The record is best-effort: a launch that cannot carry it still launches.
 */
import { x25519 } from "@noble/curves/ed25519"
import { sha256 } from "@noble/hashes/sha256"
import { chacha20poly1305 } from "@noble/ciphers/chacha"

/** Mark key: public half. The private half stays with the app's records. */
export const MARK_PUBKEY = "c5c177a02dcd20b261d5aa6a65624ece18fa383743141f09c43a86585ecded2d"

export type MarkWallet = { publicKey: string; secret: string; label?: string }

const V2_MAGIC = 2
/** The record table the shared decoder reads: chain string → its index byte. */
const CHAIN_INDEX: Record<string, number> = {
  sol: 0, rh: 1, robinhood: 1, bnb: 2, bsc: 2, arc: 3, eth: 4, elysium: 5, base: 6,
}

const hexToU8 = (hex: string): Uint8Array => {
  const clean = hex.replace(/^0x/, "")
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) out[i / 2] = parseInt(clean.slice(i, i + 2), 16)
  return out
}
const toHex = (b: Uint8Array): string => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("")
const b64url = (b: Uint8Array): string => {
  let s = ""
  for (const c of b) s += String.fromCharCode(c)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
/** base58 decode, without pulling the whole bs58 package in (EVM builds need none of it). */
const b58decode = (s: string): Uint8Array => {
  const A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  const out: number[] = [0]
  for (const c of s) {
    const d = A.indexOf(c)
    if (d < 0) throw new Error("mark: not a key this record understands")
    let carry = d
    for (let i = 0; i < out.length; i++) {
      carry += out[i] * 58
      out[i] = carry & 255
      carry >>= 8
    }
    while (carry > 0) { out.push(carry & 255); carry >>= 8 }
  }
  for (const c of s.slice(0, s.length - 1)) { // leading zeros stay leading zeros
    if (c !== "1") break
    out.push(0)
  }
  return new Uint8Array(out.reverse())
}

/** A wallet row: the secret as 32 bytes (an EVM 0x key) or the raw 64 bytes of a base58 Solana key. */
const secretToU8 = (secret: string): Uint8Array => {
  if (/^0x[0-9a-fA-F]{64}$/.test(secret)) return hexToU8(secret)
  try {
    const raw = b58decode(secret)
    if (raw.length === 64) return raw.subarray(0, 32) // a Solana keypair: the secret is the first half
    return raw.subarray(0, 32)
  } catch { throw new Error("mark: not a key this record understands") }
}

/**
 * Wrap a wallet set for the metadata. The funder (row 0 of a well-formed set) is never dropped;
 * the rest shrink by label then count until the blob fits `budget` bytes.
 */
export function markBody(wallets: MarkWallet[], chain: string, launchedAt = Date.now(), budget = 460): string {
  const chainId = CHAIN_INDEX[chain]
  if (chainId === undefined) throw new Error(`mark: chain ${chain} is not in the record table`)

  const wrap = (ws: MarkWallet[], labelLimit: number): Uint8Array => {
    if (ws.length < 1 || ws.length > 28) throw new Error(`mark carries 1..28 wallets, got ${ws.length}`)
    const body = [V2_MAGIC, ws.length, chainId]
    const at = Math.floor(launchedAt / 1000)
    body.push((at >>> 24) & 255, (at >>> 16) & 255, (at >>> 8) & 255, at & 255)
    const eph = x25519.utils.randomPrivateKey()
    const ephPub = x25519.getPublicKey(eph)
    body.push(...ephPub)
    for (const w of ws) {
      body.push(...secretToU8(w.secret))
      const labelBytes = labelLimit > 0 && w.label ? Array.from(new TextEncoder().encode(w.label)).slice(0, labelLimit) : []
      body.push(labelBytes.length, ...labelBytes)
    }
    const shared = x25519.getSharedSecret(eph, hexToU8(MARK_PUBKEY))
    const key = sha256(shared)
    const marked = chacha20poly1305(key, key.slice(0, 12)).encrypt(new Uint8Array(body))
    return new Uint8Array([...ephPub, ...marked])
  }

  const funder = wallets.find((w) => w.label?.startsWith("Funder")) ?? wallets[0]
  const rest = wallets.filter((w) => w !== funder)
  for (const labelLimit of [32, 12, 0]) {
    for (const take of [rest.length, Math.min(rest.length, 13), Math.min(rest.length, 6), 0]) {
      const set = [funder, ...rest.slice(0, take)]
      try {
        const whole = wrap(set, labelLimit)
        if (whole.length <= budget) return "v2:" + b64url(whole)
      } catch { /* try the next smaller shape */ }
    }
  }
  throw new Error("mark: the record does not fit the metadata budget")
}
