"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, Paperclip, Mail } from 'lucide-react';
import { toast } from 'sonner';
import MemberSearch from './MemberSearch';
import { Member } from '@/lib/tcn-api-client';

export default function EmailComposer() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Check for pre-filled recipients from form submissions
  useEffect(() => {
    const storedEmails = sessionStorage.getItem('emailRecipients');
    const storedContext = sessionStorage.getItem('emailContext');
    
    if (storedEmails) {
      try {
        const emails = JSON.parse(storedEmails) as string[];
        if (emails.length > 0) {
          setManualRecipients(emails);
          setUseManualEntry(true);
          toast.success(`${emails.length} recipient(s) loaded from form submissions`);
          
          // Pre-fill subject if context available
          if (storedContext) {
            setSubject(`Re: ${storedContext}`);
          }
        }
      } catch (e) {
        console.error('Failed to parse stored emails:', e);
      }
      
      // Clear the stored data after loading
      sessionStorage.removeItem('emailRecipients');
      sessionStorage.removeItem('emailContext');
    }
  }, []);

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

  const addManualRecipient = () => {
    const email = newRecipient.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && !manualRecipients.includes(email)) {
      setManualRecipients([...manualRecipients, email]);
      setNewRecipient('');
    }
  };

  const removeManualRecipient = (email: string) => {
    setManualRecipients(manualRecipients.filter(r => r !== email));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalSize = [...attachments, ...files].reduce((sum, file) => sum + file.size, 0);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (totalSize > maxSize) {
      toast.error('Total attachment size cannot exceed 10MB');
      return;
    }
    
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Get email addresses from selected members or manual entry
    const recipients = useManualEntry 
      ? manualRecipients
      : selectedMembers
          .map(m => m.email || m.contact_info?.email)
          .filter((email): email is string => !!email);

    if (recipients.length === 0) {
      toast.error('No valid email addresses found');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('message', message.trim());
      formData.append('recipients', JSON.stringify(recipients));
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/email', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      if (data.success) {
        toast.success(data.message || `Email sent to ${recipients.length} recipient(s)`);
        
        if (data.results?.failed > 0) {
          toast.warning(`${data.results.failed} emails failed to send`);
        }
        
        // Reset form
        setSubject('');
        setMessage('');
        setSelectedMembers([]);
        setManualRecipients([]);
        setAttachments([]);
        
        const fileInput = document.getElementById('email-attachments') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.error || 'Email sending failed');
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const recipientCount = useManualEntry ? manualRecipients.length : selectedMembers.length;
  const totalAttachmentSize = attachments.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Email Form */}
      <div className="lg:col-span-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-amber-900">
              <Mail className="h-5 w-5 text-amber-700" />
              Compose Email
            </h2>
            <p className="text-sm text-stone-500 mt-1">Send emails to selected members or manual recipients</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Selection Mode */}
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium text-amber-900">Recipient Selection:</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useManualEntry}
                    onChange={() => setUseManualEntry(false)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">Search Members</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useManualEntry}
                    onChange={() => setUseManualEntry(true)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-stone-700">Manual Entry</span>
                </label>
              </div>
            </div>

            {/* Manual Email Entry */}
            {useManualEntry && (
              <div className="space-y-2">
                <Label className="text-amber-900 font-medium">Email Addresses</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Enter email address"
                    type="email"
                    className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addManualRecipient();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addManualRecipient}
                    disabled={!newRecipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient.trim())}
                    size="sm"
                    className="bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {manualRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {manualRecipients.map((email, index) => (
                      <Badge key={index} className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeManualRecipient(email)}
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

            {/* Selected Members Display (when not using manual entry) */}
            {!useManualEntry && selectedMembers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-amber-900 font-medium">Selected Recipients ({selectedMembers.length})</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-amber-50 rounded-xl max-h-32 overflow-y-auto border border-amber-200">
                  {selectedMembers.map((member) => (
                    <Badge key={member.id} className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300">
                      {member.personal_info.first_name} {member.personal_info.last_name}
                      {(member.email || member.contact_info?.email) && (
                        <span className="text-xs text-amber-700 ml-1">
                          ({member.email || member.contact_info?.email})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMemberRemove(member.id)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="email-subject" className="text-amber-900 font-medium">Subject *</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  maxLength={200}
                  required
                  className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="email-message" className="text-amber-900 font-medium">Message *</Label>
                <Textarea
                  id="email-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Enter your message here..."
                  required
                  className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                />
                <p className="text-xs text-stone-500">
                  Your message will be professionally formatted with TCN Band Office header and footer.
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="email-attachments" className="text-amber-900 font-medium">Attachments (Optional)</Label>
                <Input
                  id="email-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSending}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                  className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                />
                <p className="text-xs text-stone-500">
                  Max 10MB total • PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF
                </p>

                {attachments.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-sm border border-amber-200">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-amber-600" />
                          <span className="truncate max-w-[200px] text-amber-900">{file.name}</span>
                          <span className="text-amber-600">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-stone-500">
                      Total size: {formatFileSize(totalAttachmentSize)} / 10 MB
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setSubject('');
                    setMessage('');
                    setSelectedMembers([]);
                    setManualRecipients([]);
                    setAttachments([]);
                  }}
                  disabled={isSending}
                  className="bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300"
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  disabled={isSending || !subject.trim() || !message.trim() || recipientCount === 0}
                  className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-md"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email ({recipientCount})
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

      {/* Member Search Sidebar */}
      {!useManualEntry && (
        <div className="lg:col-span-1">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200 p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-2">Find Members</h3>
            <p className="text-sm text-stone-500 mb-4">Search the member database</p>
            <MemberSearch
              selectedMembers={selectedMembers}
              onMemberSelect={handleMemberSelect}
              onMemberRemove={handleMemberRemove}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      )}
    </div>
  );
}
