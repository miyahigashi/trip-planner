export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-slate-600">指定されたURLは存在しないようです。</p>
      <a href="/" className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-white">ホームへ</a>
    </main>
  );
}