import React from 'react';
import { Edit3, X, Save } from 'lucide-react';
import { useVaults } from '../contexts/VaultContext';
import { useUI } from '../contexts/UIContext';

export function EditVaultModal() {
  const { selectedVault, updateSelectedVault } = useVaults();
  const { editFormData, setEditFormData, closeModal } = useUI();

  const handleSave = () => {
    if (!editFormData.name.trim()) {
      alert('Vault name is required');
      return;
    }

    updateSelectedVault({
      name: editFormData.name.trim(),
      description: editFormData.description.trim()
    });
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Edit3 size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Vault</h2>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Vault Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="My Inheritance Vault"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Description (optional)</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Notes about this vault..."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={closeModal}
              className="flex-1 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
