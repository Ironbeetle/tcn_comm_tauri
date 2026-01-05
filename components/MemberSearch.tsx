'use client';
import { useState, useRef, useEffect } from 'react';
import { useSearchMembers } from '@/hooks/useMembers';
import { Member } from '@/lib/tcn-api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Users, Mail, Phone, MapPin, Loader2, User } from 'lucide-react';

interface MemberSearchProps {
  selectedMembers: Member[];
  onMemberSelect: (member: Member) => void;
  onMemberRemove: (memberId: string) => void;
  onClearAll: () => void;
}

export default function MemberSearch({
  selectedMembers,
  onMemberSelect,
  onMemberRemove,
  onClearAll
}: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: searchResponse, isLoading, error } = useSearchMembers(searchTerm);
  const searchResults = searchResponse?.success ? searchResponse.data || [] : [];
  const hasError = error || (searchResponse && !searchResponse.success);

  const isSelected = (memberId: string) => 
    selectedMembers.some(m => m.id === memberId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when typing
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setIsDropdownOpen(true);
    }
  }, [searchTerm]);

  const handleSelectMember = (member: Member) => {
    if (!isSelected(member.id)) {
      onMemberSelect(member);
    }
    setSearchTerm('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-700" />
          <h3 className="font-semibold text-amber-900">Find Members</h3>
        </div>
        {selectedMembers.length > 0 && (
          <Button 
            onClick={onClearAll}
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All ({selectedMembers.length})
          </Button>
        )}
      </div>

      {/* Search Input with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setIsDropdownOpen(true)}
            placeholder="Search by name or T-number..."
            className="pl-10 pr-10 border-stone-300 focus:border-amber-500 focus:ring-amber-500"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-600 animate-spin" />
          )}
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && searchTerm.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-600" />
                <p className="text-sm">Searching members...</p>
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <div className="p-4 text-center text-red-600 bg-red-50">
                <p className="text-sm font-medium">Search Error</p>
                <p className="text-xs mt-1">Unable to search members</p>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !hasError && searchResults.length === 0 && (
              <div className="p-4 text-center text-stone-500">
                <User className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                <p className="text-sm">No members found for "{searchTerm}"</p>
                <p className="text-xs mt-1 text-stone-400">Try a different name or T-number</p>
              </div>
            )}

            {/* Results List */}
            {!isLoading && searchResults.length > 0 && (
              <div className="overflow-y-auto max-h-72">
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 font-medium">
                  {searchResults.length} member{searchResults.length !== 1 ? 's' : ''} found
                </div>
                {searchResults.map((member) => {
                  const selected = isSelected(member.id);
                  const email = member.email || member.contact_info?.email;
                  const phone = member.phone || member.contact_number || member.contact_info?.phone;
                  
                  return (
                    <div
                      key={member.id}
                      onClick={() => !selected && handleSelectMember(member)}
                      className={`p-3 border-b border-stone-100 last:border-b-0 cursor-pointer transition-colors ${
                        selected 
                          ? 'bg-emerald-50 cursor-default' 
                          : 'hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Name and T-number */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-amber-900">
                              {member.personal_info.first_name} {member.personal_info.last_name}
                            </span>
                            <Badge className="text-xs font-mono bg-stone-100 text-stone-700 border border-stone-300">
                              T#{member.personal_info.t_number}
                            </Badge>
                            {selected && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs border border-emerald-300">
                                ✓ Selected
                              </Badge>
                            )}
                          </div>
                          
                          {/* Contact Details */}
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-500">
                            {email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {email}
                              </span>
                            )}
                            {phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {phone}
                              </span>
                            )}
                            {member.community && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {member.community}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Members Chips */}
      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <span>Selected Recipients</span>
            <Badge className="bg-amber-100 text-amber-800 border border-amber-300">{selectedMembers.length}</Badge>
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => {
              const email = member.email || member.contact_info?.email;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm group"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-amber-900">
                      {member.personal_info.first_name} {member.personal_info.last_name}
                    </span>
                    {email && (
                      <span className="text-amber-700 text-xs">
                        ({email})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onMemberRemove(member.id)}
                    className="text-amber-500 hover:text-red-500 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      {selectedMembers.length === 0 && (
        <p className="text-xs text-stone-400 flex items-center gap-1">
          <Search className="h-3 w-3" />
          Type at least 2 characters to search for members
        </p>
      )}
    </div>
  );
}
