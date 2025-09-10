import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Music, Plus, Users, LogOut, Mail } from 'lucide-react';
import { safeFormat } from '@/lib/utils';
import { fadeIn, staggerContainer, cardHover, pulseAnimation } from '@/lib/animations';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const EventCardSkeleton = () => (
  <Card className="glass border-primary/20">
    <CardHeader>
      <div className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { user, events, setCurrentPage, setCurrentEvent, logout } = usePartyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEvent, setInviteEvent] = useState<any>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [invitePreview, setInvitePreview] = useState<string | null>(null);

  useEffect(() => {
  setIsLoading(false);
  }, []);

  const handleEventClick = async (event: any) => {
    // Ensure guests are loaded for the event before navigating to management to avoid race conditions
    try {
      await setCurrentEvent(event);
    } catch (e) {
      // ignore
    }
    setCurrentPage('event-management');
  };

  const handleInviteClick = (event: any) => {
    setInviteEvent(event);
    setInviteModalOpen(true);
    setInviteFile(null);
    setInvitePreview(null);
  };

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
    setInviteModalOpen(false);
  };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      {/* Header */}
      <motion.header 
        variants={fadeIn}
        className="border-b border-border/50 glass-dark sticky top-0 z-10"
      >
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-2xl font-bold text-gradient text-glow"
                variants={pulseAnimation}
                animate="animate"
              >
                PartyHaus
              </motion.h1>
              <p className="text-muted-foreground">Welcome back, {user?.name || user?.email || 'User'}!</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container-responsive py-8">
        {/* Create New Event Button */}
        <motion.div
          variants={fadeIn}
          className="mb-8"
        >
          <Button
            onClick={() => setCurrentPage('create-event')}
            className="btn-party h-16 px-8 text-lg font-semibold"
            size="lg"
          >
            <Plus className="h-6 w-6 mr-3" />
            Create New Event
          </Button>
        </motion.div>

        {/* Events Grid */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                transition={{ delay: 0.1 * index }}
              >
                <EventCardSkeleton />
              </motion.div>
            ))
          ) : events.map((event, index) => (
            <motion.div
              key={event.id}
              variants={cardHover}
              whileHover="hover"
            >
              <Card 
                className="glass card-hover border-primary/20 cursor-pointer group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => handleEventClick(event)} style={{ cursor: 'pointer' }}>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {event.name}
                      </CardTitle>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          {safeFormat(event.event_date, 'PPP p', 'Invalid date')}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-accent" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <motion.div variants={pulseAnimation} animate="animate">
                        <Music className="h-6 w-6 text-primary" />
                      </motion.div>
                      <Button size="sm" variant="outline" onClick={() => handleInviteClick(event)}>
                        <Mail className="h-4 w-4 mr-1" /> Invite
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Guest List</span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex-center group-hover:bg-primary/30 transition-all duration-300">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      {/* Invite Upload Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Upload or Create Invite for {inviteEvent?.name}</CardTitle>
              <CardDescription>
                Upload an invite image/PDF for your event, or skip for later.
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
                  <Button type="submit" className="flex-1">Save</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
        </motion.div>

        {!isLoading && events.length === 0 && (
          <motion.div
            variants={fadeIn}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <motion.div
                variants={pulseAnimation}
                animate="animate"
              >
                <Music className="h-16 w-16 mx-auto text-primary/50 mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 text-gradient">No events yet</h3>
              <p className="text-muted-foreground mb-6">
                Ready to throw an amazing party? Create your first event to get started!
              </p>
              <Button
                onClick={() => setCurrentPage('create-event')}
                className="btn-party"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
