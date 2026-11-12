import type { Metadata } from "next";
import Link from "next/link";
import { PrepView } from "@/components/prep-view";
import sampleTask from "@/data/practical-sample.json";
import { SAMPLE } from "@/lib/sample-prep";
import type { Practical } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sample prep · Prepster",
  description: "A finished sample prep with invented people, to try the practice deck and the practical with no key.",
};

export default function SamplePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          ← Prepster
        </Link>
      </nav>
      <PrepView prep={SAMPLE} practical={sampleTask as Practical} storageId="sample" />
    </main>
  );
}
