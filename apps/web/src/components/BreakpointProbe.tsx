// apps/web/src/components/BreakpointProbe.tsx
export default function BreakpointProbe() {
  return (
    <div className="fixed left-2 top-20 z-[9999] text-xs">
      <span className="inline md:hidden bg-red-600 text-white px-2 py-1 rounded">base (&lt;768)</span>
      <span className="hidden md:inline lg:hidden bg-blue-600 text-white px-2 py-1 rounded">md (≥768 &lt;1024)</span>
      <span className="hidden lg:inline xl:hidden bg-green-600 text-white px-2 py-1 rounded">lg (≥1024 &lt;1280)</span>
      <span className="hidden xl:inline bg-purple-600 text-white px-2 py-1 rounded">xl (≥1280)</span>
    </div>
  );
}