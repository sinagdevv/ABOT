import { XCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "../../../../components/card";

export default function FundCancelPage() {
  return (
    <Card className="mx-auto mt-16 max-w-md text-center">
      <XCircle className="mx-auto mb-3 text-ink/40" size={36} />
      <h1 className="text-lg font-semibold text-ink">Checkout cancelled</h1>
      <p className="mt-2 text-sm text-ink/60">No funds moved. You can start a new session any time.</p>
      <Link href="/fund" className="mt-4 inline-block text-sm font-medium text-emerald hover:underline">
        Back to funding
      </Link>
    </Card>
  );
}
