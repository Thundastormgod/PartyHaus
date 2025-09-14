import { useState } from 'react';
import { usePartyStore } from '@/store/usePartyStore';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, UserCheck, UserX, Mail, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { sendEmailWithTracking, sendEmail, emailTemplates } from '@/lib/email-tracking';
import { useToast } from '@/hooks/use-toast';
import format from 'date-fns/format';

// Utility function to generate invitation URL
const generateInvitationUrl = (eventId: string, guestId: string): string => {
  return `${window.location.origin}/event/${eventId}/guest/${guestId}`;
};

interface GuestListProps {
  eventId: string;
}

export const GuestList = ({ eventId }: GuestListProps) => {
  const { guests, currentEvent } = usePartyStore();
  const { toast } = useToast();
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', email: '' });
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  // Memoize filtered guests for this event to prevent unnecessary re-renders
  const eventGuests = guests.filter(guest => guest.event_id === eventId);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate email in this event
    const existingGuest = eventGuests.find(guest => 
      guest.email.toLowerCase() === newGuest.email.toLowerCase()
    );
    
    if (existingGuest) {
      alert(`A guest with email "${newGuest.email}" is already invited to this event.`);
      return;
    }
    
    const { data, error } = await supabase
      .from('guests')
      .insert({
        event_id: eventId,
        name: newGuest.name,
        email: newGuest.email,
        is_checked_in: false,
      })
      .select()
      .single();

    if (!error && data) {
      // Update the store with the new guest
      const { addGuest } = usePartyStore.getState();
      addGuest(data);
      
      // Send invitation email if current event is available
      if (currentEvent) {
        const invitationUrl = generateInvitationUrl(eventId, data.id);
        try {
          const emailResult = await sendEmailWithTracking(
            emailTemplates.eventInvitation(
              data.email,
              {
                name: currentEvent.name,
                date: format(new Date(currentEvent.date), 'PPP'),
                location: currentEvent.location
              },
              invitationUrl,
              currentEvent.invite_image_url
            ),
            {
              eventId: currentEvent.id,
              guestId: data.id,
              emailType: 'invitation',
              recipientEmail: data.email,
              subject: `🎉 You're Invited to ${currentEvent.name}!`
            }
          );
          
          // Show success toast with tracking info
          toast({
            title: "Invitation sent! 🎉",
            description: `Email invitation sent to ${data.name} with tracking enabled`,
          });
          
        } catch (emailError) {
          // Email sending failed, but don't break the guest addition flow
          console.warn('Failed to send invitation email:', emailError);
          toast({
            title: "Guest added, but email failed",
            description: `${data.name} was added to the guest list, but we couldn't send the invitation email. You can copy the invitation link manually.`,
            variant: "destructive",
          });
        }
      }
      
      setNewGuest({ name: '', email: '' });
      setIsAddingGuest(false);
    } else {
      console.error('Failed to add guest:', error);
      alert('Failed to add guest. Please try again.');
    }
  };

  const toggleGuestDialog = (guestId: string | null) => {
    setSelectedGuest(guestId);
  };

  const copyInvitationUrl = async (guestId: string) => {
    if (copiedGuestId === guestId) return; // Prevent double-clicks

    const invitationUrl = generateInvitationUrl(eventId, guestId);
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopiedGuestId(guestId);
      setTimeout(() => setCopiedGuestId(null), 2000);
      toast({
        title: "Link copied! 📋",
        description: "Invitation link copied to clipboard",
      });
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async () => {
    if (!currentEvent) return;
    
    try {
      await sendEmail({
        to: 'thecommodore30@gmail.com', // Your verified email for testing
        subject: `✅ Test Email from ${currentEvent.name} - PartyHaus Working!`,
        html: `
          <div style="font-family: system-ui, sans-serif; padding: 20px;">
            <h1 style="color: #6C63FF;">Test Email ✅</h1>
            <p>This is a test email from PartyHaus!</p>
            <p><strong>Event:</strong> ${currentEvent.name}</p>
            <p><strong>Date:</strong> ${format(new Date(currentEvent.date), 'PPP')}</p>
            <p><strong>Location:</strong> ${currentEvent.location}</p>
            <p>If you received this email, the PartyHaus email system is working perfectly! 🎉</p>
          </div>
        `,
      });
      
      toast({
        title: "Test email sent! ✅",
        description: "Check your inbox - the email system is working!",
      });
      
    } catch (error) {
      console.error('Test email failed:', error);
      toast({
        title: "Test email failed ❌",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Guest List</h3>
        <div className="flex gap-2">
          <Button 
            onClick={sendTestEmail}
            variant="outline"
            size="sm"
          >
            <Mail className="mr-2 h-4 w-4" />
            Test Email
          </Button>
          <Button onClick={() => setIsAddingGuest(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventGuests.map((guest) => (
            <TableRow key={guest.id}>
              <TableCell>{guest.name}</TableCell>
              <TableCell>{guest.email}</TableCell>
              <TableCell>
                {guest.status === 'checked_in' ? (
                  <span className="flex items-center text-green-500">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Checked In
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <UserX className="mr-2 h-4 w-4" />
                    Not Arrived
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyInvitationUrl(guest.id)}
                    className="text-xs"
                  >
                    {copiedGuestId === guest.id ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedGuestId === guest.id ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGuestDialog(guest.id)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Guest Dialog */}
      <Dialog open={isAddingGuest} onOpenChange={setIsAddingGuest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGuest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newGuest.name}
                onChange={(e) =>
                  setNewGuest((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newGuest.email}
                onChange={(e) =>
                  setNewGuest((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingGuest(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Guest</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Guest QR Code Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={() => toggleGuestDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Guest QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4">
            {selectedGuest && (
              <QRCodeCanvas
                value={generateInvitationUrl(eventId, selectedGuest)}
                size={200}
                level="H"
                includeMargin
              />
            )}
            <Button variant="outline" onClick={() => toggleGuestDialog(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
