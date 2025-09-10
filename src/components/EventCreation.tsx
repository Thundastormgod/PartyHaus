import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, Music, Sparkles } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';


export const EventCreation = () => {
  const { setCurrentPage, setEvents, events, user } = usePartyStore();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    spotify_playlist_url: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationTip, setShowLocationTip] = useState(false);
  const [showPlaylistTip, setShowPlaylistTip] = useState(false);
  const [step, setStep] = useState<'form' | 'invite' | 'curate'>('form');
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [invitePreview, setInvitePreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      alert('You must be logged in to create an event.');
      return;
    }
    const newEvent = {
      host_id: user.id,
      name: formData.name,
      event_date: `${formData.date}T${formData.time}:00Z`,
      location: formData.location,
      spotify_playlist_url: formData.spotify_playlist_url
    };
    try {
      const created = await eventService.createEvent(newEvent);
      if (created) {
        const freshEvents = await eventService.getUserEvents(user.id);
        setEvents(freshEvents);
        setCreatedEvent(created);
        setStep('invite');
      } else {
        alert('Failed to create event. Please try again.');
      }
    } catch (err) {
      alert('An error occurred while creating the event.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Invite upload/creation handlers
  const handleInviteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInviteFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setInvitePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setInvitePreview(null);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Upload invite file to storage and associate with event if needed
    setStep('curate');
  };

  // Step rendering
  if (step === 'invite') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Upload or Create Your Event Invite</CardTitle>
            <CardDescription>
              Upload an invite image/PDF or skip to curate your event experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <input type="file" accept="image/*,application/pdf" onChange={handleInviteFileChange} />
              {invitePreview && (
                <div className="mt-2">
                  <span className="font-semibold">Preview:</span>
                  {inviteFile?.type.startsWith('image') ? (
                    <img src={invitePreview} alt="Invite Preview" className="max-h-48 mt-2 rounded shadow" />
                  ) : (
                    <a href={invitePreview} target="_blank" rel="noopener noreferrer" className="text-primary underline">View PDF</a>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button type="submit" className="flex-1">Continue</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('curate')}>Skip</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'curate') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Curate Your Event Experience</CardTitle>
            <CardDescription>
              Add agenda, music, guest list, and more to make your event special!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCurrentPage('dashboard')}>Finish & Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: event creation form
  return (
    <div className="min-h-screen bg-background">
      {/* ...existing code... */}
      {/* The rest of the event creation form remains unchanged */}
      {/* ...existing code... */}
    </div>
  );
};