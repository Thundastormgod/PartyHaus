// Quick test to verify sanitization fix
import { sanitizeObject, sanitizeForDisplay, sanitizeHtml } from './src/lib/validation.js';

console.log('=== Testing Event Name Sanitization Fix ===\n');

const testEvent = {
  name: "John's Birthday & Celebration",
  description: "Come join us for John's 30th birthday party!",
  location: "123 Main St. / Downtown",
  spotify_playlist_url: "https://spotify.com/playlist"
};

console.log('Original event:', testEvent);

// Old aggressive sanitization (for comparison)
console.log('\n--- Old Aggressive Sanitization ---');
const oldSanitized = {
  name: sanitizeHtml(testEvent.name),
  description: sanitizeHtml(testEvent.description),
  location: sanitizeHtml(testEvent.location)
};
console.log('Old result:', oldSanitized);

// New display sanitization
console.log('\n--- New Display Sanitization ---');
const newSanitized = sanitizeObject(testEvent, {
  displayFields: ['name', 'description', 'location'],
  useDisplaySanitization: false
});
console.log('New result:', newSanitized);

console.log('\n--- Display vs HTML Sanitization Comparison ---');
console.log('Display sanitized:', sanitizeForDisplay("John's Birthday & Party"));
console.log('HTML sanitized:', sanitizeHtml("John's Birthday & Party"));