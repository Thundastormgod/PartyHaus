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
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    try {
      // eslint-disable-next-line no-console
      console.info('[create-event] submit', newEvent);

      const created = await eventService.createEvent(newEvent);
      if (created) {
        // eslint-disable-next-line no-console
        console.info('[create-event] created', created.id);
        const freshEvents = await eventService.getUserEvents(user.id);
        setEvents(freshEvents);
        setCreatedEvent(created);
        setStep('invite');
      } else {
        alert('Failed to create event. Please try again.');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[create-event] error', err);
      alert('An error occurred while creating the event.');
    } finally {
      setSubmitting(false);
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create Event</CardTitle>
                  <CardDescription>Let's get your event set up.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage('dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Event Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={formData.time} onChange={(e) => handleInputChange('time', e.target.value)} required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="playlist">Spotify Playlist URL</Label>
                  <Input id="playlist" value={formData.spotify_playlist_url} onChange={(e) => handleInputChange('spotify_playlist_url', e.target.value)} />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button type="submit" className="flex-1">Create Event</Button>
                  <Button type="button" variant="outline" onClick={() => { setFormData({ name: '', date: '', time: '', location: '', spotify_playlist_url: '' }); }}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};