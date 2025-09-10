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
import { Plus, UserCheck, UserX, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

interface GuestListProps {
  eventId: string;
}

export const GuestList = ({ eventId }: GuestListProps) => {
  const { guests } = usePartyStore();
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', email: '' });
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      setNewGuest({ name: '', email: '' });
      setIsAddingGuest(false);
    }
  };

  const toggleGuestDialog = (guestId: string | null) => {
    setSelectedGuest(guestId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Guest List</h3>
        <Button onClick={() => setIsAddingGuest(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
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
          <AnimatePresence mode="popLayout">
            {guests.map((guest) => (
              <motion.tr
                key={guest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <TableCell>{guest.name}</TableCell>
                <TableCell>{guest.email}</TableCell>
                <TableCell>
                  {guest.is_checked_in ? (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGuestDialog(guest.id)}
                  >
                    <QRCodeCanvas
                      value={guest.id}
                      size={24}
                      className="mr-2"
                    />
                    QR Code
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
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
            <QRCodeCanvas
              value={selectedGuest || ''}
              size={200}
              level="H"
              includeMargin
            />
            <Button variant="outline" onClick={() => toggleGuestDialog(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
