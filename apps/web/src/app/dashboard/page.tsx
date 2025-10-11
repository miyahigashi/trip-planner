import { currentUser } from "@clerk/nextjs/server";

export default async function Page() {
  const u = await currentUser();
  return <main className="p-6">ようこそ、{u?.firstName ?? "ユーザー"} さん</main>;
}