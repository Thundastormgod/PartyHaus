import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Music, Plus, Users, LogOut } from 'lucide-react';
import format from 'date-fns/format';
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

  useEffect(() => {
  setIsLoading(false);
  }, []);

  const handleEventClick = async (event: any) => {
    try {
      await setCurrentEvent(event);
    } catch (e) {
      // ignore
    }
    setCurrentPage('event-management');
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
              <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
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
                onClick={() => handleEventClick(event)}
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {event.name}
                      </CardTitle>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          {format(new Date(event.event_date), 'PPP p')}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-accent" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <motion.div variants={pulseAnimation} animate="animate">
                      <Music className="h-6 w-6 text-primary" />
                    </motion.div>
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
