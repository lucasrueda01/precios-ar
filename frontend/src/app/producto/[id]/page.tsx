"use client"

import { useParams, useSearchParams, useRouter } from "next/navigation"
import ProductoDetailView from "@/components/ProductoDetailView"

export default function ProductoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params?.id || 0);
  const provinciaParam = searchParams?.get("provincia") || "";

  if (!id) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-4 sm:px-6 pt-6 pb-20">
      <ProductoDetailView
        productoId={id}
        provincia={provinciaParam}
        onBack={() => router.back()}
      />
    </main>
  );
}
