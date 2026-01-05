/**
 * TCN Member Contacts API Client
 * Client for querying member contact information from the TCN Portal
 * Uses the /api/sync/contacts endpoint
 */

// Types for the Member data structure (matching portal response)
export interface PersonalInfo {
  first_name: string;
  last_name: string;
  t_number: string;
  date_of_birth?: string;
}

export interface Member {
  id: string;
  memberId?: string;
  t_number: string;
  name?: string;
  personal_info: PersonalInfo;
  contact_number?: string;
  phone?: string;
  email?: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  community?: string;
  status?: string;
  activated?: string;
  birthdate?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    fallback?: string;
  };
}

interface PortalContactsResponse {
  success: boolean;
  data: {
    contacts: PortalContact[];
    count: number;
    pagination: {
      hasMore: boolean;
      nextCursor: string | null;
      limit: number;
    };
    query: Record<string, string>;
  };
  timestamp: string;
}

interface PortalContact {
  memberId: string;
  t_number: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  community?: string;
  status?: string;
  activated?: string;
  birthdate?: string;
}

// Mock data for development/testing when API is unavailable
const MOCK_MEMBERS: Member[] = [
  {
    id: 'mock-1',
    t_number: 'TCN-12345',
    personal_info: {
      first_name: 'John',
      last_name: 'Flett',
      t_number: 'TCN-12345',
    },
    contact_number: '(204) 555-1234',
    phone: '(204) 555-1234',
    email: 'john.flett@example.com',
    contact_info: {
      email: 'john.flett@example.com',
      phone: '(204) 555-1234',
    },
    community: 'Split Lake',
    status: 'On-Reserve',
    activated: 'ACTIVATED',
  },
  {
    id: 'mock-2',
    t_number: 'TCN-67890',
    personal_info: {
      first_name: 'Jane',
      last_name: 'Flett',
      t_number: 'TCN-67890',
    },
    contact_number: '(204) 555-5678',
    phone: '(204) 555-5678',
    email: 'jane.flett@example.com',
    contact_info: {
      email: 'jane.flett@example.com',
      phone: '(204) 555-5678',
    },
    community: 'Split Lake',
    status: 'Off-Reserve',
    activated: 'ACTIVATED',
  },
  {
    id: 'mock-3',
    t_number: 'TCN-11111',
    personal_info: {
      first_name: 'Bob',
      last_name: 'Johnson',
      t_number: 'TCN-11111',
    },
    contact_number: '(204) 555-9012',
    phone: '(204) 555-9012',
    email: 'bob.johnson@example.com',
    contact_info: {
      email: 'bob.johnson@example.com',
      phone: '(204) 555-9012',
    },
    community: 'Tataskweyak',
    status: 'On-Reserve',
    activated: 'ACTIVATED',
  },
];

/**
 * Convert portal contact to our Member format
 */
function portalContactToMember(contact: PortalContact): Member {
  return {
    id: contact.memberId,
    memberId: contact.memberId,
    t_number: contact.t_number,
    name: contact.name,
    personal_info: {
      first_name: contact.firstName,
      last_name: contact.lastName,
      t_number: contact.t_number,
      date_of_birth: contact.birthdate,
    },
    contact_number: contact.phone,
    phone: contact.phone,
    email: contact.email,
    contact_info: {
      email: contact.email,
      phone: contact.phone,
    },
    community: contact.community,
    status: contact.status,
    activated: contact.activated,
    birthdate: contact.birthdate,
  };
}

export class TCNApiClient {
  private useLocalProxy: boolean;

  constructor() {
    // Always use the local API proxy to avoid CORS issues
    // The proxy route at /api/contacts handles the actual portal communication
    this.useLocalProxy = true;
  }

  /**
   * Test connection to the Portal API via local proxy
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a minimal query to test connection via local proxy
      const response = await fetch('/api/contacts?limit=1');
      return response.ok;
    } catch (error) {
      console.error('Portal API connection test failed:', error);
      return false;
    }
  }

  /**
   * Search members by name or T-number
   * Uses local /api/contacts proxy which calls the portal
   */
  async searchMembers(searchTerm: string, limit: number = 50): Promise<APIResponse<Member[]>> {
    try {
      const params = new URLSearchParams({
        query: searchTerm,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/contacts?${params}`);

      if (!response.ok) {
        console.error(`Portal API error: ${response.status}`);
        return this.searchMockMembers(searchTerm);
      }

      const data: PortalContactsResponse = await response.json();
      
      if (!data.success) {
        console.error('Portal API returned error:', data);
        return this.searchMockMembers(searchTerm);
      }

      const members = data.data.contacts.map(portalContactToMember);
      
      return {
        success: true,
        data: members,
        meta: {
          total: data.data.count,
          limit: data.data.pagination.limit,
        },
      };
    } catch (error) {
      console.error('Search failed:', error);
      return this.searchMockMembers(searchTerm);
    }
  }

  /**
   * Get members with optional filters
   */
  async getMembers(params?: {
    page?: number;
    limit?: number;
    community?: string;
    search?: string;
    include_deceased?: boolean;
  }): Promise<APIResponse<Member[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('query', params.search);

      const response = await fetch(`/api/contacts?${queryParams}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PortalContactsResponse = await response.json();
      
      if (!data.success) {
        return this.getMockMembers(params);
      }

      const members = data.data.contacts.map(portalContactToMember);
      
      return {
        success: true,
        data: members,
        meta: {
          total: data.data.count,
          page: params?.page || 1,
          limit: params?.limit || 100,
        },
      };
    } catch (error) {
      console.error('Failed to get members:', error);
      return this.getMockMembers(params);
    }
  }

  /**
   * Get a member by T-number
   */
  async getMemberByTNumber(tNumber: string): Promise<APIResponse<Member | null>> {
    try {
      const response = await fetch(`/api/contacts?query=${encodeURIComponent(tNumber)}&limit=1`);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: null };
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        return { success: true, data: null };
      }

      const member = portalContactToMember(data.data);
      return { success: true, data: member };
    } catch (error) {
      console.error('Failed to get member by T-number:', error);
      const member = MOCK_MEMBERS.find(m => m.t_number === tNumber);
      return { success: true, data: member || null, meta: { fallback: 'mock_data' } };
    }
  }

  /**
   * Get members by community
   */
  async getMembersByCommunity(community: string): Promise<APIResponse<Member[]>> {
    try {
      const params = new URLSearchParams({
        query: community,
        limit: '500',
      });

      const response = await fetch(`/api/contacts?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PortalContactsResponse = await response.json();
      
      if (!data.success) {
        return { success: false, error: 'Failed to fetch members' };
      }

      const members = data.data.contacts.map(portalContactToMember);
      return { success: true, data: members };
    } catch (error) {
      console.error('Failed to get members by community:', error);
      return { success: false, error: 'Failed to fetch members' };
    }
  }

  /**
   * Get all emails for email campaigns
   */
  async getAllEmails(limit: number = 500): Promise<APIResponse<Member[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`/api/contacts?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PortalContactsResponse = await response.json();
      
      if (!data.success) {
        return { success: false, error: 'Failed to fetch emails' };
      }

      const members = data.data.contacts
        .filter(c => c.email) // Only members with emails
        .map(portalContactToMember);
      
      return { success: true, data: members };
    } catch (error) {
      console.error('Failed to get emails:', error);
      return { success: false, error: 'Failed to fetch emails' };
    }
  }

  /**
   * Get all phone numbers for SMS campaigns
   */
  async getAllPhoneNumbers(limit: number = 500): Promise<APIResponse<Member[]>> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`/api/contacts?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PortalContactsResponse = await response.json();
      
      if (!data.success) {
        return { success: false, error: 'Failed to fetch phone numbers' };
      }

      const members = data.data.contacts
        .filter(c => c.phone) // Only members with phone numbers
        .map(portalContactToMember);
      
      return { success: true, data: members };
    } catch (error) {
      console.error('Failed to get phone numbers:', error);
      return { success: false, error: 'Failed to fetch phone numbers' };
    }
  }

  // Private mock data methods
  private getMockMembers(params?: {
    page?: number;
    limit?: number;
    community?: string;
    search?: string;
    include_deceased?: boolean;
  }): APIResponse<Member[]> {
    let members = [...MOCK_MEMBERS];

    if (params?.search) {
      const search = params.search.toLowerCase();
      members = members.filter(
        m =>
          m.personal_info.first_name.toLowerCase().includes(search) ||
          m.personal_info.last_name.toLowerCase().includes(search) ||
          m.t_number.toLowerCase().includes(search)
      );
    }

    if (params?.community) {
      members = members.filter(
        m => m.community?.toLowerCase() === params.community?.toLowerCase()
      );
    }

    return {
      success: true,
      data: members,
      meta: {
        total: members.length,
        page: params?.page || 1,
        limit: params?.limit || 50,
        fallback: 'mock_data',
      },
    };
  }

  private searchMockMembers(searchTerm: string): APIResponse<Member[]> {
    const search = searchTerm.toLowerCase();
    const members = MOCK_MEMBERS.filter(
      m =>
        m.personal_info.first_name.toLowerCase().includes(search) ||
        m.personal_info.last_name.toLowerCase().includes(search) ||
        m.t_number.toLowerCase().includes(search)
    );

    return {
      success: true,
      data: members,
      meta: { fallback: 'mock_data' },
    };
  }
}
