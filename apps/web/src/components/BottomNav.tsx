// 例: apps/web/src/components/BottomNav.tsx
export default function BottomNav() {
  return (
    <nav
      style={{ ['--bottom-nav-h' as any]: '72px' }} // 実際の高さに合わせる
      className="fixed inset-x-0 bottom-0 z-[100] ..."
    >
      {/* ... */}
    </nav>
  );
}