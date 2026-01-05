"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import MemberSearch from './MemberSearch';
import { Member } from '@/lib/tcn-api-client';

export default function SmsComposer() {
  const [message, setMessage] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // SMS character limits
  const SMS_CHAR_LIMIT = 160;
  const SMS_EXTENDED_LIMIT = 1600; // ~10 segments
  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1;

  const handleMemberSelect = (member: Member) => {
    if (selectedMembers.some(m => m.id === member.id)) {
      return;
    }
    setSelectedMembers(prev => [...prev, member]);
  };

  const handleMemberRemove = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleClearAll = () => {
    setSelectedMembers([]);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10-digit numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // Format as +X (XXX) XXX-XXXX for 11-digit numbers
    if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const addManualRecipient = () => {
    const phone = newRecipient.trim().replace(/\D/g, '');
    // Accept 10 or 11 digit numbers
    if (phone.length >= 10 && phone.length <= 11) {
      const formattedPhone = formatPhoneNumber(newRecipient);
      if (!manualRecipients.includes(formattedPhone)) {
        setManualRecipients([...manualRecipients, formattedPhone]);
        setNewRecipient('');
      }
    } else {
      toast.error('Please enter a valid 10 or 11 digit phone number');
    }
  };

  const removeManualRecipient = (phone: string) => {
    setManualRecipients(manualRecipients.filter(r => r !== phone));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (charCount > SMS_EXTENDED_LIMIT) {
      toast.error(`Message too long. Maximum ${SMS_EXTENDED_LIMIT} characters allowed.`);
      return;
    }

    // Get phone numbers from selected members or manual entry
    const recipients = useManualEntry 
      ? manualRecipients.map(p => p.replace(/\D/g, '')) // Strip formatting for API
      : selectedMembers
          .map(m => m.phone || m.contact_number || m.contact_info?.phone)
          .filter((phone): phone is string => !!phone)
          .map(p => p.replace(/\D/g, '')); // Strip formatting for API

    if (recipients.length === 0) {
      toast.error('No valid phone numbers found');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          recipients,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      if (data.success) {
        toast.success(data.message || `SMS sent to ${recipients.length} recipient(s)`);
        
        if (data.results?.failed > 0) {
          toast.warning(`${data.results.failed} messages failed to send`);
        }
        
        // Reset form
        setMessage('');
        setSelectedMembers([]);
        setManualRecipients([]);
      } else {
        throw new Error(data.error || 'SMS sending failed');
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-amber-900">
          <MessageSquare className="h-5 w-5 text-amber-700" />
          Send SMS
        </h2>
        <p className="text-sm text-stone-500 mt-1">Send text messages to members via Twilio</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle between member search and manual entry */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => setUseManualEntry(false)}
            className={!useManualEntry 
              ? "bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white" 
              : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }
          >
            Search Members
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setUseManualEntry(true)}
            className={useManualEntry 
              ? "bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white" 
              : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }
          >
            Enter Numbers Manually
          </Button>
        </div>

        {/* Member Search or Manual Entry */}
        {!useManualEntry ? (
          <MemberSearch
            selectedMembers={selectedMembers}
            onMemberSelect={handleMemberSelect}
            onMemberRemove={handleMemberRemove}
            onClearAll={handleClearAll}
          />
        ) : (
          <div className="space-y-4">
            <Label className="text-amber-900 font-medium">Phone Numbers</Label>
            <div className="flex gap-2">
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter phone number (e.g., 204-555-1234)"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualRecipient())}
                className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
              />
              <Button type="button" onClick={addManualRecipient} className="bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Manual Recipients List */}
            {manualRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {manualRecipients.map((phone) => (
                  <Badge key={phone} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300">
                    <Phone className="h-3 w-3" />
                    {phone}
                    <button
                      type="button"
                      onClick={() => removeManualRecipient(phone)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipients Summary */}
        {!useManualEntry && selectedMembers.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <Phone className="h-4 w-4" />
              <span className="font-medium">
                {selectedMembers.filter(m => m.phone || m.contact_number || m.contact_info?.phone).length} recipients with phone numbers
              </span>
            </div>
            {selectedMembers.filter(m => !(m.phone || m.contact_number || m.contact_info?.phone)).length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ {selectedMembers.filter(m => !(m.phone || m.contact_number || m.contact_info?.phone)).length} selected member(s) have no phone number
              </p>
            )}
          </div>
        )}

        {/* Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-message" className="text-amber-900 font-medium">Message</Label>
            <div className="text-xs text-stone-500">
              <span className={charCount > SMS_EXTENDED_LIMIT ? 'text-red-500 font-medium' : charCount > SMS_CHAR_LIMIT ? 'text-amber-600' : ''}>
                {charCount}
              </span>
              /{SMS_EXTENDED_LIMIT} characters
              {charCount > 0 && (
                <span className="ml-2">
                  ({segmentCount} segment{segmentCount !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
          <Textarea
            id="sms-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className={`border-stone-300 focus:border-amber-500 focus:ring-amber-500 ${charCount > SMS_EXTENDED_LIMIT ? 'border-red-500' : ''}`}
          />
          {charCount > SMS_CHAR_LIMIT && charCount <= SMS_EXTENDED_LIMIT && (
            <p className="text-xs text-amber-600">
              ⚠️ Message will be sent as {segmentCount} SMS segments (may incur additional charges)
            </p>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={isSending || (!useManualEntry && selectedMembers.length === 0) || (useManualEntry && manualRecipients.length === 0)}
          className="w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-md"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send SMS
              {((!useManualEntry && selectedMembers.length > 0) || (useManualEntry && manualRecipients.length > 0)) && (
                <span className="ml-1">
                  to {useManualEntry ? manualRecipients.length : selectedMembers.filter(m => m.phone || m.contact_number || m.contact_info?.phone).length} recipient(s)
                </span>
              )}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
