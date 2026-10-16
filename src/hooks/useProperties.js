import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../services/api';

const useProperties = (endpoint, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (page = 1, limit = 12) => {
    const cacheKey = `${endpoint}-${JSON.stringify(filters)}-${page}-${limit}`;
    const cached = cacheRef.current[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < 30000) {
      setData(cached.data);
      setPagination(cached.pagination);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint, {
        params: { ...filters, page, limit },
        signal: abortControllerRef.current.signal
      });
      
      const result = response.data;
      const items = Array.isArray(result) ? result : (result.data || result.properties || []);
      const paginationData = result.pagination || { 
        page, 
        limit, 
        total: items.length, 
        totalPages: Math.ceil(items.length / limit) 
      };
      
      cacheRef.current[cacheKey] = {
        data: items,
        pagination: paginationData,
        timestamp: Date.now()
      };
      
      setData(items);
      setPagination(paginationData);
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        setError(err.message || 'حدث خطأ في جلب البيانات');
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, filters]);

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const goToPage = useCallback((page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchData(page, pagination.limit);
  }, [fetchData, pagination.limit, pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.page, goToPage]);

  const memoizedData = useMemo(() => data, [data]);
  const memoizedPagination = useMemo(() => pagination, [pagination]);

  return {
    data: memoizedData,
    loading,
    error,
    pagination: memoizedPagination,
    goToPage,
    nextPage,
    prevPage,
    refetch: () => {
      cacheRef.current = {};
      fetchData(pagination.page, pagination.limit);
    }
  };
};

export default useProperties;