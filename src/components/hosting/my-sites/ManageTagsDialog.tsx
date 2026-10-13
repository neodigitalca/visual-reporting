import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  assignHostedGroupTags,
  createHostedTag,
  deleteHostedTag,
  renameHostedTag,
  type HostedSiteGroup,
  type HostedTag,
} from "@/lib/hosting-api";
import { MY_SITES_FIELD, MY_SITES_PRIMARY_BTN } from "./my-sites-theme";

export type ManageTagsDialogProps = {
  open: boolean;
  tags: HostedTag[];
  /** When set, the dialog also assigns tags to this site. */
  group: HostedSiteGroup | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

const ICON_BTN = "h-7 w-7 shrink-0 rounded-none p-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground";

export function ManageTagsDialog({ open, tags, group, onOpenChange, onChanged }: ManageTagsDialogProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setEditingId(null);
    setError("");
    setSelected(group?.tags.map((t) => t.id) ?? []);
  }, [open, group]);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError("");
    const res = await action();
    setBusy(false);
    if (res.ok === false) {
      setError(res.error ?? "Request failed.");
      return false;
    }
    onChanged();
    return true;
  }

  async function create() {
    const name = newName.trim();
    if (!name) return;
    if (await run(() => createHostedTag(name))) setNewName("");
  }

  async function saveRename() {
    if (editingId === null) return;
    const name = editName.trim();
    if (!name) return;
    if (await run(() => renameHostedTag(editingId, name))) setEditingId(null);
  }

  async function saveAssignment() {
    if (!group) return;
    if (await run(() => assignHostedGroupTags(group.id, selected))) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none bg-zinc-950 p-5 text-base">
        <DialogHeader>
          <DialogTitle className="text-lg text-white">{group ? `Tags for ${group.name}` : "Manage tags"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              className={MY_SITES_FIELD}
              placeholder="New tag"
              aria-label="New tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void create();
              }}
            />
            <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={busy || !newName.trim()} onClick={() => void create()}>
              Add
            </Button>
          </div>
          <ul className="flex max-h-64 flex-col overflow-y-auto border border-white/[0.08]">
            {tags.length === 0 ? <li className="flex h-9 items-center px-2 text-muted-foreground">No tags yet</li> : null}
            {tags.map((tag) => (
              <li key={tag.id} className="flex h-9 items-center gap-2 border-t border-white/[0.06] px-2 first:border-t-0">
                {group ? (
                  <Checkbox
                    checked={selected.includes(tag.id)}
                    onCheckedChange={(v) => setSelected((prev) => (v ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)))}
                    aria-label={`Assign ${tag.name}`}
                  />
                ) : null}
                {editingId === tag.id ? (
                  <Input
                    className={`${MY_SITES_FIELD} h-7 flex-1`}
                    value={editName}
                    aria-label="Tag name"
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <span className="flex-1 truncate">{tag.name}</span>
                )}
                {editingId === tag.id ? (
                  <>
                    <Button type="button" variant="ghost" className={ICON_BTN} aria-label="Save" onClick={() => void saveRename()}>
                      <Check className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button type="button" variant="ghost" className={ICON_BTN} aria-label="Cancel" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={ICON_BTN}
                      aria-label={`Rename ${tag.name}`}
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditName(tag.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={ICON_BTN}
                      aria-label={`Delete ${tag.name}`}
                      disabled={busy}
                      onClick={() => void run(() => deleteHostedTag(tag.id))}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="h-6 truncate text-red-300" title={error || undefined}>
            {error}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="h-8 rounded-none" onClick={() => onOpenChange(false)}>
              {group ? "Cancel" : "Done"}
            </Button>
            {group ? (
              <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={busy} onClick={() => void saveAssignment()}>
                Save tags
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
