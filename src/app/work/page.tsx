import React from "react";
import WorkBoard from "@/components/work/WorkBoard";

export const dynamic = "force-dynamic";

export default function WorkPage() {
  return (
    <main className="mc min-h-screen w-full bg-[#0c0d10]">
      <WorkBoard />
    </main>
  );
}
