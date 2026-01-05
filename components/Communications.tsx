"use client";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mail, 
  Bell, 
  Users, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import MemberSearch from './MemberSearch';
import { Member } from '@/lib/tcn-api-client';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
};

interface CommunicationsProps {
  user: User;
}

interface AppMessage {
  id?: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  expiryDate?: string;
  date?: string;
  time?: string;
  location?: string;
  type: 'job' | 'notice' | 'event';
  isPublished: boolean;
}

// Updated SMS Composer Component
const SMSComposer = ({ user }: { user: User }) => {
  const [message, setMessage] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length <= 160) {
      setMessage(newMessage);
    }
  };

  const addManualRecipient = () => {
    const phone = newRecipient.trim();
    if (phone && /^\+?[\d\s\-\(\)]{10,}$/.test(phone) && !manualRecipients.includes(phone)) {
      setManualRecipients([...manualRecipients, phone]);
      setNewRecipient('');
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

    const recipients = useManualEntry 
      ? manualRecipients
      : selectedMembers.map(m => m.contact_number).filter(Boolean);

    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
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
        toast.success(data.message);
        
        if (data.results.failed > 0) {
          toast.warning(`${data.results.failed} messages failed to send. Check SMS logs for details.`);
        }
        
        // Reset form
        setMessage('');
        setSelectedMembers([]);
        setManualRecipients([]);
      } else {
        throw new Error(data.error || 'SMS sending failed');
      }

    } catch (error: any) {
      console.error('SMS sending error:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label>Recipient Selection Mode:</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="member-search"
                  checked={!useManualEntry}
                  onChange={() => setUseManualEntry(false)}
                />
                <Label htmlFor="member-search">Search Members</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual-entry"
                  checked={useManualEntry}
                  onChange={() => setUseManualEntry(true)}
                />
                <Label htmlFor="manual-entry">Manual Entry</Label>
              </div>
            </div>

            {useManualEntry && (
              <div className="space-y-2">
                <Label>Manual Phone Numbers</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Enter phone number (e.g., +1234567890)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addManualRecipient}
                    disabled={!newRecipient.trim() || !/^\+?[\d\s\-\(\)]{10,}$/.test(newRecipient.trim())}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {manualRecipients.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {manualRecipients.map((phone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm">{phone}</span>
                        <Button
                          type="button"
                          onClick={() => removeManualRecipient(phone)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                value={message}
                onChange={handleMessageChange}
                rows={4}
                placeholder="Type your SMS message here..."
                maxLength={160}
              />
              <div className={`text-right text-sm ${
                message.length === 160 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {message.length}/160 characters
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                disabled={isSending}
                onClick={() => {
                  setMessage('');
                  setSelectedMembers([]);
                  setManualRecipients([]);
                }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={
                  isSending || 
                  !message.trim() || 
                  (useManualEntry ? manualRecipients.length === 0 : selectedMembers.length === 0)
                }
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send SMS
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {!useManualEntry && (
        <div className="lg:col-span-1">
          <Card className="p-4">
            <MemberSearch
              selectedMembers={selectedMembers}
              onMemberSelect={(member) => setSelectedMembers([...selectedMembers, member])}
              onMemberRemove={(memberId) => setSelectedMembers(selectedMembers.filter(m => m.id !== memberId))}
              onClearAll={() => setSelectedMembers([])}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

const EmailComposer = ({ user }: { user: User }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [manualRecipients, setManualRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

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

    const recipients = useManualEntry 
      ? manualRecipients
      : selectedMembers.map(m => m.contact_info?.email).filter(Boolean);

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
        toast.success(data.message);
        
        if (data.results?.failed > 0) {
          toast.warning(`${data.results.failed} emails failed to send. Check with system administrator.`);
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
  const isFormValid = subject.trim() && message.trim() && recipientCount > 0;
  const totalAttachmentSize = attachments.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Compose Email</h2>
              <p className="text-slate-600 text-sm">Send emails to selected members or manual recipients</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center space-x-6">
                <Label className="text-sm font-medium text-slate-700">Recipient Selection:</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="email-member-search"
                      checked={!useManualEntry}
                      onChange={() => setUseManualEntry(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="email-member-search" className="text-sm">Search Members</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="email-manual-entry"
                      checked={useManualEntry}
                      onChange={() => setUseManualEntry(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="email-manual-entry" className="text-sm">Manual Entry</Label>
                  </div>
                </div>
              </div>

              {useManualEntry && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Email Addresses</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500"
                      type="email"
                    />
                    <Button
                      type="button"
                      onClick={addManualRecipient}
                      disabled={!newRecipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient.trim())}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {manualRecipients.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        {manualRecipients.length} recipient{manualRecipients.length > 1 ? 's' : ''} added
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {manualRecipients.map((email, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                            <span className="text-sm font-medium">{email}</span>
                            <Button
                              type="button"
                              onClick={() => removeManualRecipient(email)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email-subject" className="text-sm font-medium text-slate-700">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  maxLength={200}
                  required
                  className="border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-message" className="text-sm font-medium text-slate-700">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="email-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Enter your message here..."
                  required
                  className="border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-xs text-slate-500">
                  Your message will be professionally formatted with TCN Band Office header and footer.
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email-attachments" className="text-sm font-medium text-slate-700">
                  Attachments <span className="text-slate-500">(Optional)</span>
                </Label>
                <Input
                  id="email-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSending}
                  className="cursor-pointer border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <div className="text-xs text-slate-500">
                  Maximum total size: 10MB • Accepted: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">
                      Attached Files ({formatFileSize(totalAttachmentSize)})
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  {recipientCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipientCount} recipient{recipientCount > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isSending}
                    onClick={() => {
                      setSubject('');
                      setMessage('');
                      setSelectedMembers([]);
                      setManualRecipients([]);
                      setAttachments([]);
                      const fileInput = document.getElementById('email-attachments') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                        {attachments.length > 0 && (
                          <span className="ml-2 bg-white/20 rounded-full px-2 py-1 text-xs">
                            {attachments.length}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {!useManualEntry && (
        <div className="lg:col-span-1">
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <div className="p-4">
              <MemberSearch
                selectedMembers={selectedMembers}
                onMemberSelect={handleMemberSelect}
                onMemberRemove={handleMemberRemove}
                onClearAll={handleClearAll}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Main Communications Component (rest remains the same)
export default function Communications({ user }: CommunicationsProps) {
  const [error, setError] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communications</h2>
          <p className="text-gray-600">Send messages to community members</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="h-4 w-4 mr-1" />
          Member Database Connected
        </Badge>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Member Database Active:</strong> You can now search and select community members 
          for messaging. SMS functionality is connected to Twilio.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>SMS</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="webapi" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Push Notification</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="space-y-4">
          <SMSComposer user={user} />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailComposer user={user} />
        </TabsContent>

        {/* Other tabs remain the same */}
      </Tabs>
    </div>
  );
}