import { PaymentResult } from "@/components/store/payment-result"

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  return <PaymentResult
    requestedResult={first(params.result) ?? first(params.status) ?? "pending"}
    paymentId={first(params.payment_id) ?? first(params.collection_id) ?? ""}
    orderId={first(params.external_reference) ?? ""}
  />
}
