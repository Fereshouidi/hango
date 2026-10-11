import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

type FetchPageFn<T> = (search: string, filter: 'all' | 'unassigned', limit: number, offset: number) => T[];
type CountFn = (search: string, filter: 'all' | 'unassigned') => number;

/**
 * Hook for paginated loading of a DB section in Add pages.
 * Fetches PAGE_SIZE items at a time; supports search and filter.
 * When search/filter changes, resets to page 0 automatically.
 */
export function usePagedSection<T>(
    fetchPage: FetchPageFn<T>,
    getCount: CountFn,
    initialFilter: 'all' | 'unassigned' = 'all'
) {
    const [items, setItems] = useState<T[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unassigned'>(initialFilter);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const searchRef = useRef(search);
    const filterRef = useRef(filter);

    const loadPage = useCallback(
        (s: string, f: 'all' | 'unassigned', off: number, replace: boolean) => {
            try {
                const rows = fetchPage(s, f, PAGE_SIZE, off);
                setItems((prev) => (replace ? rows : [...prev, ...rows]));
                setOffset(off + rows.length);
            } catch (e) {
                console.warn('[usePagedSection] loadPage error:', e);
            }
        },
        [fetchPage]
    );

    const refreshCount = useCallback(
        (s: string, f: 'all' | 'unassigned') => {
            try {
                setTotal(getCount(s, f));
            } catch { /* ignore */ }
        },
        [getCount]
    );

    // Initial load
    const reset = useCallback(
        (s: string, f: 'all' | 'unassigned') => {
            setLoading(true);
            searchRef.current = s;
            filterRef.current = f;
            refreshCount(s, f);
            loadPage(s, f, 0, true);
            setLoading(false);
        },
        [loadPage, refreshCount]
    );

    // Reset on search/filter change (with a small debounce for search)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            reset(search, filter);
        }, 200);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, filter]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadMore = useCallback(() => {
        if (items.length >= total) return;
        loadPage(searchRef.current, filterRef.current, offset, false);
    }, [items.length, total, offset, loadPage]);

    const hasMore = items.length < total;

    return {
        items,
        search,
        setSearch,
        filter,
        setFilter,
        loadMore,
        hasMore,
        total,
        loading,
        /** Call on initial page mount / focus */
        initialize: () => reset(searchRef.current, filterRef.current),
    };
}
