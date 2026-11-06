import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card } from "../../../../components/card";

export default function FundSuccessPage() {
  return (
    <Card className="mx-auto mt-16 max-w-md text-center">
      <CheckCircle2 className="mx-auto mb-3 text-emerald" size={36} />
      <h1 className="text-lg font-semibold text-ink">Velo checkout completed</h1>
      <p className="mt-2 text-sm text-ink/60">
        Velo confirms payment via a signed webhook, not this redirect. Once it lands, the funding request below
        updates to <span className="font-medium text-emerald">paid</span>. Escrow is funded separately.
      </p>
      <Link href="/fund" className="mt-4 inline-block text-sm font-medium text-emerald hover:underline">
        Back to funding
      </Link>
    </Card>
  );
}
