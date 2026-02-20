import React from 'react';
import { Trash2 } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface AdminTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onDelete?: (item: T) => void;
    onRowClick?: (item: T) => void;
}

export const AdminTable = <T extends { id: string | number }>({ data, columns, onDelete, onRowClick }: AdminTableProps<T>) => {
    return (
        <div className="glass-panel overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            {columns.map((col, index) => (
                                <th key={index} className={`p-4 text-xs font-bold text-text-muted uppercase tracking-wider ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                            {onDelete && <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`text-sm text-white hover:bg-white/5 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col, index) => (
                                    <td key={index} className="p-4">
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                                {onDelete && (
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item);
                                            }}
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm">
                    No data found.
                </div>
            )}
        </div>
    );
};
