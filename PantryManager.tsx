import React, { useState, useMemo } from 'react';
import { AppTranslations } from '../i18n/translations';
import { PantryItem, StorageLocation } from '../types';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Sparkles,
  Flame,
  MinusCircle,
  Package,
} from 'lucide-react';

export const PANTRY_CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Grains and rice',
  'Pulses, beans, and lentils',
  'Flour and baking ingredients',
  'Dairy and dairy alternatives',
  'Eggs and protein sources',
  'Spices and seasonings',
  'Oils and fats',
  'Sauces and condiments',
  'Bakery products',
  'Snacks',
  'Beverages',
  'Frozen foods',
  'Canned and packaged foods',
  'Household essentials',
];

interface PantryManagerProps {
  t: AppTranslations;
  pantry: PantryItem[];
  onAddItem: (item: Partial<PantryItem>) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onConsumeItem: (id: string, amount: number) => Promise<void>;
  onBatchVoiceAdd: (voiceText: string) => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  t,
  pantry,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onConsumeItem,
  onBatchVoiceAdd,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterMode, setFilterMode] = useState<'all' | 'expiring' | 'lowstock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [consumeModalItem, setConsumeModalItem] = useState<PantryItem | null>(null);
  const [consumeAmount, setConsumeAmount] = useState<number>(1);

  // New item form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    quantity: 1,
    unit: 'kg',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    storageLocation: 'Pantry' as StorageLocation,
    notes: '',
    lowStockThreshold: 1,
  });

  const filteredPantry = useMemo(() => {
    return pantry.filter((item) => {
      // Search match
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      // Category match
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      // Filter status mode
      let matchesFilter = true;
      if (filterMode === 'expiring') {
        if (!item.expiryDate) matchesFilter = false;
        else {
          const diffDays = Math.ceil(
            (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
          );
          matchesFilter = diffDays <= 3;
        }
      } else if (filterMode === 'lowstock') {
        matchesFilter =
          item.lowStockThreshold !== undefined &&
          Number(item.quantity) <= Number(item.lowStockThreshold);
      }

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [pantry, search, selectedCategory, filterMode]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      await onUpdateItem(editingItem.id, formData);
      setEditingItem(null);
    } else {
      await onAddItem(formData);
    }

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: 'Vegetables',
      quantity: 1,
      unit: 'kg',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      storageLocation: 'Pantry',
      notes: '',
      lowStockThreshold: 1,
    });
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate || '',
      storageLocation: item.storageLocation,
      notes: item.notes || '',
      lowStockThreshold: item.lowStockThreshold || 1,
    });
    setIsAddModalOpen(true);
  };

  const handleConfirmConsume = async () => {
    if (!consumeModalItem) return;
    await onConsumeItem(consumeModalItem.id, consumeAmount);
    setConsumeModalItem(null);
    setConsumeAmount(1);
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const diffDays = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    if (diffDays < 0) {
      return { label: t.expiredAlert || 'Expired', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
    if (diffDays <= 3) {
      return {
        label: `${t.expiresIn || 'Expires in'} ${diffDays}d`,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    }
    return { label: `${t.freshBadge || 'Fresh'} (${diffDays}d)`, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {t.pantryTitle || 'My Kitchen Pantry'}
          </h2>
          <p className="text-sm text-[#5A625B] mt-1">
            {t.pantrySubtitle || 'The ingredients and groceries you currently have at home.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addItem || 'Add Ingredient'}</span>
          </button>
        </div>
      </div>

      {/* Search, Status Tabs & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPantryPlaceholder || 'Search pantry items...'}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#D5CCC0] bg-white text-sm text-[#1F2421] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A43]"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-[#D5CCC0]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-[#2D5A43] text-white'
                  : 'text-[#5A625B] hover:text-[#1F2421]'
              }`}
            >
              All ({pantry.length})
            </button>
            <button
              onClick={() => setFilterMode('expiring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                filterMode === 'expiring'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Expiring Soon</span>
            </button>
            <button
              onClick={() => setFilterMode('lowstock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                filterMode === 'lowstock'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Low Stock</span>
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {PANTRY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-[#2D5A43] text-white border-[#2D5A43] shadow-xs'
                  : 'bg-white text-[#5A625B] border-[#E6DFD5] hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pantry Inventory Grid */}
      {filteredPantry.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPantry.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiryDate);
            const isLowStock =
              item.lowStockThreshold !== undefined &&
              Number(item.quantity) <= Number(item.lowStockThreshold);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-[#E6DFD5] shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A625B] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E6DFD5]">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      {isLowStock && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {t.lowStockBadge || 'Low Stock'}
                        </span>
                      )}
                      {expiryStatus && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${expiryStatus.color}`}
                        >
                          {expiryStatus.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[#1F2421] group-hover:text-[#2D5A43] transition">
                    {item.name}
                  </h3>

                  <div className="mt-2 flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-[#1F2421]">
                      {item.quantity}
                    </span>
                    <span className="text-sm font-medium text-[#5A625B]">
                      {item.unit}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-[#5A625B] space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{t.storageLocation || 'Location'}:</span>
                      <span className="font-medium text-[#1F2421]">{item.storageLocation}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-gray-400 italic line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card action buttons */}
                <div className="mt-4 pt-3 border-t border-[#E6DFD5] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setConsumeModalItem(item);
                      setConsumeAmount(1);
                    }}
                    className="flex items-center space-x-1 text-xs font-semibold text-[#2D5A43] hover:text-[#234734] transition"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>{t.consumeItem || 'Use / Consume'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#1F2421] hover:bg-[#FAF7F2] transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DFD5] shadow-xs max-w-md mx-auto">
          <Package className="w-12 h-12 text-[#2D5A43]/40 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-[#1F2421] mb-1">
            No pantry items found
          </h3>
          <p className="text-xs text-[#5A625B] mb-6">
            {t.noPantryItems ||
              'Your pantry is currently empty. Add your ingredients or tell Zestiquee what you bought!'}
          </p>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#2D5A43] text-white text-xs font-semibold shadow-xs"
          >
            {t.addItem || 'Add Ingredient'}
          </button>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E6DFD5] shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-[#1F2421] mb-4">
              {editingItem ? 'Edit Pantry Ingredient' : t.addItem || 'Add Ingredient'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Basmati Rice, Tomatoes, Olive Oil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    {PANTRY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                    Storage Location
                  </label>
                  <select
                    value={formData.storageLocation}
                    onChange={(e) =>
                      setFormData({ ...formData, storageLocation: e.target.value as StorageLocation })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    <option value="Pantry">Pantry</option>
                    <option value="Fridge">Fridge</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Countertop">Countertop</option>
                    <option value="Spice Rack">Spice Rack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="packets">packets</option>
                    <option value="cups">cups</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                    Low Stock Alert Below
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Organic, opened 2 days ago"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consume Modal */}
      {consumeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E6DFD5] shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-[#1F2421] mb-2">
              Use / Consume: {consumeModalItem.name}
            </h3>
            <p className="text-xs text-[#5A625B] mb-4">
              Current inventory: {consumeModalItem.quantity} {consumeModalItem.unit}. How much did you
              use?
            </p>

            <div className="flex items-center space-x-3 mb-6">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={consumeModalItem.quantity}
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(parseFloat(e.target.value) || 0)}
                className="w-32 px-4 py-3 rounded-xl border border-gray-300 text-lg font-bold text-center focus:ring-2 focus:ring-[#2D5A43]"
              />
              <span className="font-semibold text-[#1F2421]">{consumeModalItem.unit}</span>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setConsumeModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConsume}
                className="px-5 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold"
              >
                Confirm Deduct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
