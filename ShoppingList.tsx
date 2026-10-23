import React, { useState, useMemo } from 'react';
import { AppTranslations } from '../i18n/translations';
import { ShoppingItem, UserProfile } from '../types';
import {
  Plus,
  Check,
  Trash2,
  PackageCheck,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Info,
  X,
  Edit3,
} from 'lucide-react';

interface ShoppingListProps {
  t: AppTranslations;
  user: UserProfile;
  shopping: ShoppingItem[];
  onAddItem: (item: Partial<ShoppingItem>) => Promise<void>;
  onTogglePurchased: (id: string, purchased: boolean) => Promise<void>;
  onConfirmPurchase: (
    item: ShoppingItem,
    actualQuantity: number,
    actualUnit: string,
    actualPrice?: number
  ) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onTransferToPantry: () => Promise<void>;
}

const COMMON_UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pcs',
  'packets',
  'bunches',
  'cans',
  'bottles',
  'boxes',
  'cups',
  'tbsp',
  'tsp',
];

export const ShoppingList: React.FC<ShoppingListProps> = ({
  t,
  user,
  shopping,
  onAddItem,
  onTogglePurchased,
  onConfirmPurchase,
  onDeleteItem,
  onTransferToPantry,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState<ShoppingItem | null>(null);
  const [actualQuantity, setActualQuantity] = useState<number>(1);
  const [actualUnit, setActualUnit] = useState<string>('kg');
  const [actualPrice, setActualPrice] = useState<number>(0);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Groceries',
    quantity: 1,
    unit: 'kg',
    estimatedPrice: 0,
    notes: '',
  });

  const purchasedCount = shopping.filter((s) => s.purchased).length;
  const pendingItems = shopping.filter((s) => !s.purchased);
  const purchasedItems = shopping.filter((s) => s.purchased);

  const totalEstimatedPrice = useMemo(() => {
    return shopping.reduce((acc, curr) => acc + (Number(curr.estimatedPrice) || 0), 0);
  }, [shopping]);

  const handleOpenPurchaseModal = (item: ShoppingItem) => {
    setPurchasingItem(item);
    setActualQuantity(item.suggestedQuantity || item.quantity || 1);
    setActualUnit(item.unit || 'kg');
    setActualPrice(item.estimatedPrice || 0);
  };

  const handleConfirmPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasingItem) return;

    await onConfirmPurchase(
      purchasingItem,
      Number(actualQuantity) || 1,
      actualUnit.trim() || 'kg',
      Number(actualPrice) || undefined
    );
    setPurchasingItem(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onAddItem(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      category: 'Groceries',
      quantity: 1,
      unit: 'kg',
      estimatedPrice: 0,
      notes: '',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
            <span>Separate from My Pantry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {t.shoppingTitle || 'Smart Shopping List'}
          </h2>
          <p className="text-sm text-[#5A625B] mt-1">
            {t.shoppingSubtitle ||
              'Items you intend to buy. Marking items as purchased syncs them directly into your pantry inventory.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {purchasedCount > 0 && (
            <button
              onClick={onTransferToPantry}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>
                {t.transferToPantry || 'Transfer Bought Items to Pantry'} ({purchasedCount})
              </span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-[#2D5A43] text-[#2D5A43] hover:bg-[#EBF3EE] text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addShoppingItem || 'Add Item to Buy'}</span>
          </button>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5]">
          <div className="text-xs text-[#5A625B]">Needed to Buy</div>
          <div className="text-2xl font-bold text-[#1F2421]">{pendingItems.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5]">
          <div className="text-xs text-[#5A625B]">Purchased (Ready to Sync)</div>
          <div className="text-2xl font-bold text-emerald-700">{purchasedItems.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] col-span-2 sm:col-span-1">
          <div className="text-xs text-[#5A625B]">Estimated Budget</div>
          <div className="text-2xl font-bold text-[#1F2421]">
            {user.currency || '₹'} {totalEstimatedPrice.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs space-y-6">
        {/* Pending items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-lg text-[#1F2421]">
              Items to Purchase ({pendingItems.length})
            </h3>
            <span className="text-xs text-[#5A625B]">
              Tap checkbox or &quot;Buy&quot; to confirm actual quantity bought
            </span>
          </div>

          {pendingItems.length > 0 ? (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] hover:border-[#2D5A43]/50 transition group gap-3"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <button
                      onClick={() => handleOpenPurchaseModal(item)}
                      className="mt-1 sm:mt-0 w-6 h-6 rounded-lg border-2 border-gray-400 hover:border-[#2D5A43] hover:bg-[#EBF3EE] flex items-center justify-center transition cursor-pointer shrink-0"
                      title="Confirm purchase & set quantity bought"
                    >
                      <Check className="w-3.5 h-3.5 text-[#2D5A43] opacity-0 group-hover:opacity-60 transition" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base text-[#1F2421] group-hover:text-[#2D5A43] transition">
                          {item.name}
                        </span>

                        {/* Badges for Auto Restock or Recipe Needs */}
                        {item.restockReason === 'out_of_stock' && (
                          <span className="inline-flex items-center text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                            Out of stock
                          </span>
                        )}
                        {item.restockReason === 'low_stock' && (
                          <span className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                            Low stock
                          </span>
                        )}
                        {item.neededForRecipe && (
                          <span className="inline-flex items-center text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            Needed for: {item.neededForRecipe}
                          </span>
                        )}
                        {item.isAutoRestock && !item.restockReason && (
                          <span className="inline-flex items-center text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            Restock needed
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#5A625B] mt-1 space-x-2">
                        <span>
                          Target: <strong className="text-[#1F2421]">{item.quantity} {item.unit}</strong>
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>

                        {item.pantryQuantity !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-[#8B5E3C]">
                              Pantry had: {item.pantryQuantity} {item.unit}
                              {item.pantryThreshold !== undefined && ` (Min: ${item.pantryThreshold})`}
                            </span>
                          </>
                        )}

                        {item.notes && <span className="italic"> — &quot;{item.notes}&quot;</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 pl-9 sm:pl-0">
                    {item.estimatedPrice ? (
                      <span className="text-sm font-semibold text-[#1F2421]">
                        {user.currency || '₹'} {item.estimatedPrice}
                      </span>
                    ) : null}

                    <button
                      onClick={() => handleOpenPurchaseModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      Bought
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 transition cursor-pointer"
                      title="Remove / Dismiss"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#5A625B]">
              No pending shopping items! Add missing ingredients from recipes or meal plans.
            </div>
          )}
        </div>

        {/* Bought items section */}
        {purchasedItems.length > 0 && (
          <div className="pt-6 border-t border-[#E6DFD5]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-lg text-emerald-900">
                Purchased ({purchasedItems.length})
              </h3>
              <button
                onClick={onTransferToPantry}
                className="text-xs font-semibold text-[#2D5A43] hover:underline cursor-pointer"
              >
                Transfer to Pantry Inventory →
              </button>
            </div>

            <div className="space-y-2">
              {purchasedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onTogglePurchased(item.id, false)}
                      className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center transition cursor-pointer"
                      title="Mark as unbought"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <span className="line-through text-sm text-gray-500 font-medium">
                      {item.quantity} {item.unit} {item.name}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Purchase Modal: "How much did you actually buy?" */}
      {purchasingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E6DFD5] shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#2D5A43]">
                  Stock Synchronization
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1F2421]">
                  Confirm Purchase
                </h3>
              </div>
              <button
                onClick={() => setPurchasingItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] mb-5">
              <div className="font-semibold text-base text-[#1F2421]">
                {purchasingItem.name}
              </div>
              <div className="text-xs text-[#5A625B] mt-0.5">
                Planned amount: {purchasingItem.quantity} {purchasingItem.unit} • {purchasingItem.category}
              </div>
            </div>

            <form onSubmit={handleConfirmPurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1.5">
                  How much did you actually buy? *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={actualQuantity}
                    onChange={(e) => setActualQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    placeholder="Quantity"
                  />
                  <select
                    value={actualUnit}
                    onChange={(e) => setActualUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-[#5A625B] mt-1.5">
                  Compatible units (e.g. g ↔ kg, ml ↔ L) are converted automatically into your pantry.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                  Total Price Paid ({user.currency || '₹'})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  placeholder="Optional expense tracking"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPurchasingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Confirm &amp; Add to Pantry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shopping Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E6DFD5] shadow-2xl">
            <h3 className="text-xl font-serif font-bold text-[#1F2421] mb-4">
              {t.addShoppingItem || 'Add Item to Buy'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tomatoes, Cooking Oil, Cinnamon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2421] mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains and rice">Grains and rice</option>
                  <option value="Pulses and lentils">Pulses and lentils</option>
                  <option value="Dairy and dairy alternatives">Dairy</option>
                  <option value="Spices and seasonings">Spices</option>
                  <option value="Oils and fats">Oils and fats</option>
                  <option value="Household essentials">Household</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">
                  Estimated Budget ({user.currency || '₹'})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedPrice: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Optional price estimate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
