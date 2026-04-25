import React from "react";
import { ArrowRight, Clock3, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";

export default function FeaturePlaceholderScreen({
  title,
  description,
  notes = [],
  primaryLink = "/",
  primaryLabel = "Kembali ke Dashboard",
}) {
  return (
    <PageLayout className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-[#4a4b4d] bg-gradient-to-br from-[#343538] to-[#25262a] p-8 shadow-xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-[#74CD25]/15 px-4 py-2 text-sm font-semibold text-[#A6F268]">
            <Construction className="h-4 w-4" />
            Struktur menu Opsi 4 sudah aktif
          </div>

          <h1 className="text-3xl font-black text-white">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">{description}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#4a4b4d] bg-[#2d2e32] p-5">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5 text-[#74CD25]" />
                <span className="font-bold">Status saat ini</span>
              </div>
              <p className="text-sm text-gray-400">
                Halaman ini sudah disiapkan di navigasi, tetapi modul detailnya belum tersedia penuh di backend atau UI.
              </p>
            </div>

            <div className="rounded-2xl border border-[#4a4b4d] bg-[#2d2e32] p-5">
              <div className="mb-3 flex items-center gap-2 text-white">
                <ArrowRight className="h-5 w-5 text-[#74CD25]" />
                <span className="font-bold">Langkah lanjut</span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                {notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          </div>

          <Link
            to={primaryLink}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#74CD25] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#5fa01c]"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
