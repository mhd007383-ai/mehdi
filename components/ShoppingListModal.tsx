import React, { useState } from 'react';
import type { ShoppingListItem } from '../types';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingListItem[];
  onAddItem: (item: string) => void;
  onRemoveItem: (item: string) => void;
  onClearList: () => void;
  onToggleItem: (item: string) => void;
  onClearPurchased: () => void;
}

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ 
    isOpen, 
    onClose, 
    list, 
    onAddItem, 
    onRemoveItem, 
    onClearList,
    onToggleItem,
    onClearPurchased
}) => {
  const [newItem, setNewItem] = useState('');

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAddItem(newItem.trim());
      setNewItem('');
    }
  };

  const hasPurchasedItems = list.some(item => item.purchased);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose} aria-modal="true" role="dialog">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md m-4 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">لیست خرید</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="بستن">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">لیست خرید شما خالی است.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((listItem, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md group">
                  <span 
                    onClick={() => onToggleItem(listItem.item)}
                    className={`flex-grow text-gray-800 dark:text-gray-200 cursor-pointer transition-colors ${listItem.purchased ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}
                    >
                    {listItem.item}
                  </span>
                  <button onClick={() => onRemoveItem(listItem.item)} className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`حذف ${listItem.item}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="ماده جدید اضافه کنید..."
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    افزودن
                </button>
            </form>
            {hasPurchasedItems && (
                <button onClick={onClearPurchased} className="w-full mt-3 py-2 text-sm text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                    پاک کردن خریده‌شده‌ها
                </button>
            )}
            {list.length > 0 && (
                 <button 
                    onClick={onClearList} 
                    className={`w-full ${hasPurchasedItems ? 'mt-1' : 'mt-3'} py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors`}
                >
                    پاک کردن همه موارد
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListModal;