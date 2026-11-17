import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { timeAgo } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { MarkNotificationsRead } from "@/components/library-clients";
import { Empty, PageTitle } from "@/components/ui";

export default async function NotificationsPage() {
  const userId = await getUserId();
  const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 60 });
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="Notifications" subtitle={unread ? `${unread} new` : "You are all caught up"} />
      <MarkNotificationsRead hasUnread={unread > 0} />
      {items.length === 0 ? (
        <Empty title="No notifications yet" body="Gift receipts, new releases and updates will appear here." />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((n) => {
            const body = (
              <>
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-white/[0.06] text-muted" : "bg-primary/20 text-primary"}`}><Icon name="bell" size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15.5px] font-semibold text-white">{n.title}</span>
                    <span className="shrink-0 text-[12.5px] text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="block text-[14px] font-light text-ink/85">{n.body}</span>
                </span>
              </>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="panel flex gap-3.5 p-3.5 hover:bg-white/5">{body}</Link>
                ) : (
                  <div className="panel flex gap-3.5 p-3.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
