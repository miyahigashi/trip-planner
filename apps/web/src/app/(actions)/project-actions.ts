// apps/web/src/app/(actions)/project-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  projectSelections, // 既存
  // ↓ ここはあなたの実スキーマ名に合わせてください
  projects,
  projectMembers,
  users,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/* =========================================================
 *  確定プラン: 追加 / 解除
 * =======================================================*/

/**
 * スポットを確定プランに追加（同一 place の更新は dayIndex / orderInDay を上書き）
 */
export async function selectPlace(
  projectId: string,
  placeId: string,
  dayIndex = 0,
  orderInDay = 0
) {
  await db
    .insert(projectSelections)
    .values({ projectId, placeId, dayIndex, orderInDay })
    .onConflictDoUpdate({
      target: [projectSelections.projectId, projectSelections.placeId],
      set: { dayIndex, orderInDay },
    });

  // UI更新を確実に
  revalidatePath(`/projects/${projectId}/selections`);
  revalidatePath(`/projects/${projectId}/candidates`);
}

/**
 * 確定プランからスポットを外す
 */
export async function unselectPlace(projectId: string, placeId: string) {
  await db
    .delete(projectSelections)
    .where(
      and(
        eq(projectSelections.projectId, projectId),
        eq(projectSelections.placeId, placeId)
      )
    );

  revalidatePath(`/projects/${projectId}/selections`);
  revalidatePath(`/projects/${projectId}/candidates`);
}

/* =========================================================
 *  プロジェクト編集（開始/終了日、メンバー追加）
 * =======================================================*/

export type UpdateProjectMetaInput = {
  title?: string;
  description?: string;
  /** "YYYY-MM-DD" 形式など（クライアントの <input type="date"> から来る想定） */
  startDate?: string;
  /** "YYYY-MM-DD" 形式など */
  endDate?: string;
  /** 追加したいユーザーのメール（既存ユーザーのみメンバーに登録） */
  inviteEmails?: string[];
};

/**
 * プロジェクトの開始/終了日を更新し、メールで指定された既存ユーザーをメンバーに追加
 * 未登録メールの「招待」運用がある場合は、この中で招待テーブルへ保存を追加してください。
 */
export async function updateProjectMeta(
  projectId: string,
  input: UpdateProjectMetaInput
) {
  // ---- 1) 日付更新（渡ってきた項目のみ） ----
  const patch: Record<string, any> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.startDate) {
    // drizzle の型推論対策として any 経由で渡す（Date を期待する列でもOK）
    patch.startDate = new Date(input.startDate) as unknown as Date;
  }
  if (input.endDate) {
    patch.endDate = new Date(input.endDate) as unknown as Date;
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();
    await db.update(projects).set(patch).where(eq(projects.id, projectId));
  }

  // ---- 2) メールでメンバー追加（既存ユーザーのみ）----
  if (input.inviteEmails && input.inviteEmails.length > 0) {
    const emails = normalizeEmails(input.inviteEmails);
    if (emails.length > 0) {
      // 既存ユーザー取得
      const found = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.email, emails));

      // (projectId, userId) にユニーク制約がある前提で onConflictDoNothing で冪等に
      for (const u of found) {
        await db
        .insert(projectMembers)
        .values({
          projectId,
          userId: u.id,
          role: "editor",            // enum/union に合わせて
          // status: "active",       // もし列があるなら
          joinedAt: new Date() as unknown as Date, // ← createdAt ではなく joinedAt
        })
        .onConflictDoNothing();
      }

      // 見つからなかったメールを「招待テーブル」に入れるならここで処理
      // const notFound = emails.filter(e => !found.some(f => f.email === e));
      // await db.insert(projectInvites).values(notFound.map(e => ({ projectId, email: e })));
    }
  }

  // ---- 3) 再検証 ----
  revalidatePath(`/projects/${projectId}/selections`);
}

/* =========================================================
 *  ユーティリティ
 * =======================================================*/

function normalizeEmails(list: string[]) {
  return list
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}
