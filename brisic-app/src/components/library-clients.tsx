"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/catalog/types";
import { clearHistory, deletePlaylist, markNotificationsRead, removeFromPlaylist, renamePlaylist } from "@/app/actions";
import { Icon } from "@/components/icons";
import { useLibrary, useToast } from "@/components/app-state";
import { PlayButtons, TrackList } from "@/components/track-list";

export function NewPlaylistButton() {
  const lib = useLibrary();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>
        <Icon name="plus" size={16} /> New playlist
      </button>
    );
  }
  return (
    <form
      className="flex w-full max-w-sm gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || busy) return;
        setBusy(true);
        const created = await lib.newPlaylist(name);
        setBusy(false);
        if (created) router.push(`/library/playlists/${created.id}`);
      }}
    >
      <input autoFocus className="field !h-10 !text-[14.5px]" placeholder="Playlist name" aria-label="Playlist name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <button className="btn btn-primary btn-sm shrink-0" disabled={!name.trim() || busy}>Create</button>
      <button type="button" className="btn btn-sm shrink-0" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}

export function UserPlaylistView({ id, name, tracks }: { id: string; name: string; tracks: Track[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(tracks);
  const [title, setTitle] = useState(name);
  const [editing, setEditing] = useState(false);

  return (
    <>
      {editing ? (
        <form
          className="mt-4 flex max-w-md gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await renamePlaylist(id, title).catch(() => null);
            if (r?.ok) { setEditing(false); router.refresh(); } else toast(r && !r.ok ? r.error : "Could not rename the playlist.");
          }}
        >
          <input autoFocus className="field !h-11" aria-label="Playlist name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
          <button className="btn btn-primary shrink-0">Save</button>
          <button type="button" className="btn shrink-0" onClick={() => { setTitle(name); setEditing(false); }}>Cancel</button>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <PlayButtons tracks={list} />
          <button type="button" className="btn" onClick={() => setEditing(true)}><Icon name="pencil" size={17} /> Rename</button>
          <button
            type="button" className="btn"
            onClick={async () => {
              if (!window.confirm(`Delete the playlist “${name}”? This cannot be undone.`)) return;
              await deletePlaylist(id).catch(() => {});
              router.push("/library");
            }}
          >
            <Icon name="trash" size={17} /> Delete
          </button>
        </div>
      )}

      <div className="mt-5">
        {list.length === 0 ? (
          <p className="text-sm font-light text-muted">This playlist is empty. Open the menu on any song and choose “Add to playlist”.</p>
        ) : (
          <TrackList
            tracks={list}
            numbered={false}
            variant="playlist"
            showStreams={false}
            onRemove={(trackId) => {
              setList((l) => l.filter((t) => t.id !== trackId));
              removeFromPlaylist(id, trackId).then(() => toast("Removed from playlist")).catch(() => router.refresh());
            }}
          />
        )}
      </div>
    </>
  );
}

export function ClearHistoryButton() {
  const router = useRouter();
  return (
    <button
      type="button" className="btn btn-sm"
      onClick={async () => {
        if (!window.confirm("Clear your listening history? This cannot be undone.")) return;
        await clearHistory().catch(() => {});
        router.refresh();
      }}
    >
      <Icon name="trash" size={16} /> Clear history
    </button>
  );
}

/** Marks notifications as read once the list has been shown. */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markNotificationsRead().catch(() => {});
  }, [hasUnread]);
  return null;
}
