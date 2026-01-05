import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { TCNApiClient, Member, APIResponse } from '@/lib/tcn-api-client';

// Create API client instance - uses NEXT_PUBLIC env vars for client-side
const apiClient = new TCNApiClient();

// Original hooks for specific queries
export function useMembers(params?: {
  page?: number;
  limit?: number;
  community?: string;
  search?: string;
  include_deceased?: boolean;
}) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => apiClient.getMembers(params),
    enabled: !!params?.search && params.search.length > 2,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
  });
}

export function useMemberByTNumber(tNumber: string) {
  return useQuery({
    queryKey: ['member', 'tNumber', tNumber],
    queryFn: () => apiClient.getMemberByTNumber(tNumber),
    enabled: !!tNumber,
    staleTime: 30000,
    gcTime: 60000,
  });
}

// Enhanced hook for Communications component
export function useTCNMembers() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const connected = await apiClient.testConnection();
        setIsConnected(connected);
        if (!connected) {
          console.warn('Failed to connect to TCN Member Database');
        }
      } catch (error) {
        console.error('Failed to connect to TCN API:', error);
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  // Search members with real-time capabilities
  const searchMembers = useCallback(async (searchTerm: string): Promise<Member[]> => {
    if (!isConnected || !searchTerm.trim() || searchTerm.length < 2) {
      return [];
    }
    
    try {
      const response = await apiClient.searchMembers(searchTerm, 100);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [isConnected]);

  // Get members by community
  const getMembersByCommunity = useCallback(async (community: string): Promise<Member[]> => {
    if (!isConnected || !community.trim()) return [];
    
    try {
      const response = await apiClient.getMembersByCommunity(community);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('Failed to get members by community:', error);
      return [];
    }
  }, [isConnected]);

  // Test connection manually
  const testConnection = useCallback(async () => {
    try {
      const connected = await apiClient.testConnection();
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  return {
    // Connection status
    isConnected,
    testConnection,
    
    // Search functions for Communications
    searchMembers,
    getMembersByCommunity,
    
    // Direct access to API client
    apiClient,
  };
}

// Hook for real-time member search (for MemberSearch component)
export function useSearchMembers(searchTerm: string, debounceMs: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useQuery({
    queryKey: ['search-members', debouncedSearchTerm],
    queryFn: () => apiClient.searchMembers(debouncedSearchTerm),
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length > 2,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    retry: 1, // Only retry once
    retryDelay: 1000, // 1 second between retries
  });
}

// Hook for getting all emails (for bulk email campaigns)
export function useAllEmails(limit: number = 500) {
  return useQuery({
    queryKey: ['tcn-all-emails', limit],
    queryFn: () => apiClient.getAllEmails(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for getting all phone numbers (for bulk SMS campaigns)
export function useAllPhoneNumbers(limit: number = 500) {
  return useQuery({
    queryKey: ['tcn-all-phones', limit],
    queryFn: () => apiClient.getAllPhoneNumbers(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}