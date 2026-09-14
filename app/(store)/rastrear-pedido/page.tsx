import { TrackingLookup } from "@/components/store/tracking-lookup"

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido = "" } = await searchParams
  return <TrackingLookup initialOrderId={pedido} />
}
