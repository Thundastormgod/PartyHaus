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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be logged in to create an event.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const newEvent = {
      host_id: user.id,
      name: formData.name,
      event_date: `${formData.date}T${formData.time}:00Z`,
      date: `${formData.date}T${formData.time}:00Z`, // Add the date field for compatibility
      location: formData.location,
      spotify_playlist_url: formData.spotify_playlist_url,
      is_public: false, // Default to private events
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const created = await eventService.createEvent(newEvent);
      if (created) {
        const freshEvents = await eventService.getUserEvents(user.id);
        setEvents(freshEvents);
        setCreatedEvent(created);
        setStep('invite');
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (err) {
      // Event creation error
      setError('An error occurred while creating the event. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4"
            >
              Create New Event
            </motion.h1>
            <p className="text-muted-foreground">
              Plan your perfect party and invite your guests
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-primary" />
                  Event Details
                </CardTitle>
                <CardDescription>
                  Fill in the information for your event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., John's Birthday Party"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., 123 Main St, City, State"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Spotify Playlist URL */}
                  <div className="space-y-2">
                    <Label htmlFor="spotify">Spotify Playlist URL (Optional)</Label>
                    <Input
                      id="spotify"
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={formData.spotify_playlist_url}
                      onChange={(e) => handleInputChange('spotify_playlist_url', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add a Spotify playlist to enhance your event experience
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentPage('dashboard')}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.date || !formData.time || !formData.location}
                      className="flex-1 btn-party"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Event...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};