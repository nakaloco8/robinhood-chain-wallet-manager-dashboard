import { cn } from "@/lib/cn"
import { chain } from "@/lib/chain"
import { BrandIcon } from "./ui/brand"

/**
 * The Aeon Launcher mark: two chevrons going up (a launch out of the aeon). The upper one takes the app's accent
 * (--brand, so each chain's launcher wears its own colour), the lower one the text colour.
 */
export function LogoMark({ className }: { className?: string; small?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("h-5 w-auto shrink-0", className)} fill="none" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 15.5 16 5.5l10 10" stroke="var(--brand)" />
      <path d="M6 27 16 17l10 10" stroke="currentColor" />
    </svg>
  )
}

/** The wordmark, set in the app's own font. */
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("text-[13px] leading-none font-extrabold tracking-[0.16em] whitespace-nowrap uppercase", className)}>Aeon <span className="text-muted-foreground font-semibold">Launcher</span></span>
}

/** This tool's identity in its own bar: its launchpad's logo and its name ("Solana launcher"; "pump.fun" on a phone). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandIcon src={chain.launchpadLogo} label={chain.launchpad} size={22} />
      <span className="font-semibold whitespace-nowrap"><span className="sm:hidden">{chain.launchpad}</span><span className="hidden sm:inline">{chain.appName}</span></span>
    </span>
  )
}
