
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { ArrowLeft, Calendar, MapPin, Music, Plus, QrCode, Users, UserCheck, UserX } from 'lucide-react';
import format from 'date-fns/format';

  export const EventManagement = () => {
  const { currentEvent, events, setCurrentEvent, guests, guestsByEventId, guestsLoadedMap, setCurrentPage, addGuest, isLoading } = usePartyStore();
    // Recover currentEvent from events if missing
    // Robustly recover currentEvent and guests
    // Ref to track last event id for which setCurrentEvent was called
    const lastFetchedEventId = useRef<string | null>(null);

    useEffect(() => {
      if (isLoading) return;
      if (!currentEvent && events && events.length > 0) {
        // set first event as current if missing
        (async () => {
          lastFetchedEventId.current = events[0].id;
          await setCurrentEvent(events[0]);
        })();
        return;
      }

      if (!currentEvent) return;

      // Check fast maps first to see if guests are already loaded for this event
      const loaded = !!(guestsLoadedMap && guestsLoadedMap[currentEvent.id]) || !!(guestsByEventId && (guestsByEventId[currentEvent.id]?.length ?? 0) > 0) || guests.some(g => g.event_id === currentEvent.id);
      if (!loaded && lastFetchedEventId.current !== currentEvent.id) {
        lastFetchedEventId.current = currentEvent.id;
        // await to avoid bounce/re-entry
        (async () => {
          await setCurrentEvent(currentEvent);
        })();
      }
    }, [currentEvent, events, guests, guestsByEventId, guestsLoadedMap, setCurrentEvent, isLoading]);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [guestForm, setGuestForm] = useState({ name: '', email: '' });

  const eventGuests = currentEvent ? (guestsByEventId?.[currentEvent.id] ?? guests.filter(guest => guest.event_id === currentEvent.id)) : [];
    const checkedInCount = eventGuests.filter(guest => guest.is_checked_in).length;

    const handleAddGuest = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentEvent) return;
      const newGuest = {
        id: Date.now().toString(),
        event_id: currentEvent.id,
        name: guestForm.name,
        email: guestForm.email,
        is_checked_in: false
      };
      addGuest(newGuest);
      setGuestForm({ name: '', email: '' });
      setShowAddGuest(false);
    };

    return (
      <div className="min-h-screen bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-32">
            <Loading size="lg" />
          </div>
        ) : !currentEvent && events.length === 0 ? (
          <div className="flex items-center justify-center h-full py-32 text-xl text-muted-foreground">Event not found</div>
        ) : !currentEvent ? (
          <div className="flex items-center justify-center h-full py-32">
            <Loading size="lg" />
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage('dashboard')}
                      className="mr-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <div>
                      <h1 className="text-2xl font-bold">{currentEvent.name}</h1>
                      <p className="text-muted-foreground">Event Management</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentPage('qr-scanner')}
                    className="btn-party"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR Code
                  </Button>
                </div>
              </div>
            </motion.header>
            {/* ...existing code... */}
          </>
        )}
      </div>
    );
  };