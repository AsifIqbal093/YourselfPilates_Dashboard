"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { PackCard } from "@/components/PackCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePack, getPacks, Pack, updatePack } from "@/lib/apiActions";

import { PackModal } from "./PackModal";

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packToDelete, setPackToDelete] = useState<Pack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPacks(1);
      setPacks(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPack(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack);
    setIsModalOpen(true);
  };

  const handleDelete = (pack: Pack) => {
    setPackToDelete(pack);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (packToDelete) {
      try {
        await deletePack(Number(packToDelete.id));
        setPacks(packs.filter((p) => p.id !== packToDelete.id));
        setDeleteDialogOpen(false);
        setPackToDelete(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete pack");
        setDeleteDialogOpen(false);
      }
    }
  };

  const handleToggleActive = async (pack: Pack) => {
    try {
      await updatePack(Number(pack.id), { active: !pack.active });
      setPacks(
        packs.map((p) => (p.id === pack.id ? { ...p, active: !p.active } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pack");
    }
  };

  const handleSubscribe = (_pack: Pack) => {
    // TODO: Implement subscription logic
    void _pack;
  };

  const handleModalSuccess = () => {
    fetchPacks();
    setIsModalOpen(false);
    setEditingPack(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Packs
        </h2>
        <Button
          onClick={handleCreate}
          className="cursor-pointer w-full sm:w-auto"
        >
          <PlusIcon className="mr-2 w-4 h-4" /> Create New Pack
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Loading packs...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {packs.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onSubscribe={handleSubscribe}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                showActions={true}
              />
            ))}
          </div>

          {packs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No packs available. Create your first pack to get started.
              </p>
            </div>
          )}
        </>
      )}

      <PackModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleModalSuccess}
        initialData={editingPack}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Pack</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{packToDelete?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPackToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2Icon className="mr-2 w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
