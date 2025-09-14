import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/    it('should send invitation email when guest is added', async () => {
      const user = userEvent.setup();
      
      render(<GuestList eventId="test-event-id" />);

      const addButton = screen.getByRole('button', { name: /add guest/i });
      await user.click(addButton);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);';
import { GuestList } from '@/components/GuestList';
import { usePartyStore } from '@/store/usePartyStore';
import { sendEmail } from '@/lib/email';

// Mock the email service
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  emailTemplates: {
    eventInvitation: vi.fn(() => ({
      to: 'test@example.com',
      subject: 'Test Event Invitation',
      html: '<p>Test email content</p>'
    }))
  }
}));

// Mock the store
vi.mock('@/store/usePartyStore', () => ({
  usePartyStore: vi.fn()
}));

// Mock the store with proper typing
const mockUsePartyStore = usePartyStore as unknown as Mock;

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  Trash2: () => <div data-testid="trash-icon">🗑</div>,
  Mail: () => <div data-testid="mail-icon">📧</div>,
  QrCode: () => <div data-testid="qr-icon">QR</div>,
  Copy: () => <div data-testid="copy-icon">📋</div>,
  X: () => <div data-testid="x-icon">✖</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: 'test-event-id' })
}));

// Mock QRCode component
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value}>QR Code</div>
  )
}));

const mockGuests = [
  {
    id: 'guest-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'pending' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'guest-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'checked_in' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockEvent = {
  id: 'test-event-id',
  name: 'Test Party',
  date: '2024-12-31T23:59:59Z',
  location: '123 Party Street',
  host_id: 'host-1',
  spotify_playlist_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockStoreState = {
  currentEvent: mockEvent,
  guests: mockGuests,
  isLoading: false,
  addGuest: vi.fn(),
  removeGuest: vi.fn(),
  updateGuestStatus: vi.fn(),
  fetchGuests: vi.fn(),
  setCurrentEvent: vi.fn(),
};

describe('Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePartyStore.mockReturnValue(mockStoreState);
    (sendEmail as Mock).mockResolvedValue({ success: true, data: { id: 'email-123' } });
  });

  describe('Guest Addition with Email Invitation', () => {
    it('should send invitation email when adding a new guest', async () => {
      const user = userEvent.setup();
      
      render(<GuestList eventId="test-event-id" />);

      // Click add guest button
      const addButton = screen.getByRole('button', { name: /add guest/i });
      await user.click(addButton);

      // Fill out the form
      const nameInput = screen.getByPlaceholderText(/guest name/i);
      const emailInput = screen.getByPlaceholderText(/guest email/i);
      
      await user.type(nameInput, 'New Guest');
      await user.type(emailInput, 'newguest@example.com');

      // Mock successful guest addition
      mockStoreState.addGuest.mockResolvedValueOnce({
        data: {
          id: 'new-guest-id',
          name: 'New Guest',
          email: 'newguest@example.com',
          status: 'pending'
        },
        error: null
      });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /add/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify guest was added to store
        expect(mockStoreState.addGuest).toHaveBeenCalledWith(
          'test-event-id',
          {
            name: 'New Guest',
            email: 'newguest@example.com'
          }
        );

        // Verify email was sent
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'newguest@example.com',
            subject: expect.stringContaining('Test Party'),
            html: expect.stringContaining('Test email content')
          })
        );
      });
    });

    it('should handle email sending errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock email sending failure
      (sendEmail as Mock).mockRejectedValueOnce(new Error('Email service unavailable'));
      
      render(<GuestList eventId="test-event-id" />);

      const addButton = screen.getByRole('button', { name: /add guest/i });
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText(/guest name/i);
      const emailInput = screen.getByPlaceholderText(/guest email/i);
      
      await user.type(nameInput, 'New Guest');
      await user.type(emailInput, 'newguest@example.com');

      mockStoreState.addGuest.mockResolvedValueOnce({
        data: {
          id: 'new-guest-id',
          name: 'New Guest',
          email: 'newguest@example.com',
          status: 'pending'
        },
        error: null
      });

      const submitButton = screen.getByRole('button', { name: /add/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Guest should still be added even if email fails
        expect(mockStoreState.addGuest).toHaveBeenCalled();
        // Email should have been attempted
        expect(sendEmail).toHaveBeenCalled();
      });
    });

    it('should prevent duplicate guest emails', async () => {
      const user = userEvent.setup();
      
      render(<GuestList eventId="test-event-id" />);

      const addButton = screen.getByRole('button', { name: /add guest/i });
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText(/guest name/i);
      const emailInput = screen.getByPlaceholderText(/guest email/i);
      
      // Try to add a guest with existing email
      await user.type(nameInput, 'Duplicate Guest');
      await user.type(emailInput, 'john@example.com'); // This email already exists

      const submitButton = screen.getByRole('button', { name: /add/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Should not add duplicate guest
        expect(mockStoreState.addGuest).not.toHaveBeenCalled();
        // Should not send email
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Test Email Functionality', () => {
    it('should send test email when test button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<GuestList eventId="test-event-id" />);

      // Find and click test email button
      const testButton = screen.getByRole('button', { name: /test email/i });
      await user.click(testButton);

      await waitFor(() => {
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'test@partyhaus.app',
            subject: expect.stringContaining('Test Party'),
            html: expect.any(String)
          })
        );
      });
    });
  });

  describe('Guest List Display', () => {
    it('should display existing guests correctly', () => {
      render(<GuestList eventId="test-event-id" />);

      // Check that guests are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should show guest status correctly', () => {
      render(<GuestList eventId="test-event-id" />);

      // John Doe should show as pending (not checked in)
      const johnStatus = screen.getByText('John Doe').closest('[data-testid="guest-item"]');
      expect(johnStatus).not.toHaveClass('opacity-50'); // Not checked in

      // Jane Smith should show as checked in
      const janeStatus = screen.getByText('Jane Smith').closest('[data-testid="guest-item"]');
      expect(janeStatus).toHaveClass('opacity-50'); // Checked in
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR codes for guest invitations', async () => {
      const user = userEvent.setup();
      
      render(<GuestList eventId="test-event-id" />);

      // Click on a guest to view QR code
      const guestItem = screen.getByText('John Doe');
      await user.click(guestItem);

      // Should show QR code dialog
      await waitFor(() => {
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
      });

      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode).toHaveAttribute('data-value', expect.stringContaining('guest-1'));
    });
  });
});