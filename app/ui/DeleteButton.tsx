'use client';

import { TrashIcon } from '@heroicons/react/24/outline';

export default function DeleteButton({ entity, deleteAction }: { entity: string; deleteAction: () => void }) {
  return (
    <form 
      action={deleteAction}
      onSubmit={(e) => {
        if (!confirm(`Are you sure you want to delete this ${entity}?`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}