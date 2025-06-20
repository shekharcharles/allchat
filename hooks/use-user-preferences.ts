import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserPreferences {
  id: string;
  userId: string;
  defaultModel: string;
  theme: string;
  language: string;

  // Visual preferences
  enableAnimations: boolean;
  enableSounds: boolean;
  compactMode: boolean;
  fontSize: string;
  chatBubbleStyle: string;

  // AI behavior preferences
  enableStreaming: boolean;
  maxTokens: number;
  temperature: number;
  enableAutoSave: boolean;

  // Notification preferences
  desktopNotifications: boolean;
  emailUpdates: boolean;

  // Privacy preferences
  shareAnalytics: boolean;
  saveConversations: boolean;

  createdAt: string;
  updatedAt: string;
}

export function useUserPreferences() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (status !== 'authenticated' || !session) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/user/preferences');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (status !== 'authenticated' || !session) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const updatedPreferences = await response.json();
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  };

  // Update default model specifically
  const updateDefaultModel = async (modelId: string) => {
    return updatePreferences({ defaultModel: modelId });
  };

  // Fetch preferences when session changes
  useEffect(() => {
    fetchPreferences();
  }, [session, status]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    updateDefaultModel,
    refetch: fetchPreferences,
  };
}
