'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import SimplePeer from 'simple-peer';

const SEND_SIGNAL = gql`
  mutation SendSignal($to: ID!, $type: SignalingType!, $payload: String!) {
    sendSignal(to: $to, type: $type, payload: $payload) {
      id
      from
      to
      type
      payload
    }
  }
`;

const SIGNAL_SUBSCRIPTION = gql`
  subscription SignalReceived {
    signalReceived {
      id
      from
      to
      type
      payload
    }
  }
`;

interface SignalingMessage {
  id: string;
  from: string;
  to: string;
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'HANGUP';
  payload: string;
}

interface PeerConnectionOptions {
  userId: string;
  targetUserId: string;
  isInitiator?: boolean;
  onStream?: (stream: MediaStream) => void;
  onData?: (data: any) => void;
  onDisconnect?: () => void;
}

export function usePeerConnection({
  userId,
  targetUserId,
  isInitiator = false,
  onStream,
  onData,
  onDisconnect,
}: PeerConnectionOptions) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const client = useApolloClient();

  // Handle receiving signaling messages
  const handleSignalingMessage = useCallback((message: SignalingMessage) => {
    if (message.to !== userId) return;
    if (message.from !== targetUserId) return;

    try {
      const signal = JSON.parse(message.payload);

      if (message.type === 'HANGUP') {
        peerRef.current?.destroy();
        peerRef.current = null;
        setConnected(false);
        setConnecting(false);
        onDisconnect?.();
        return;
      }

      if (!peerRef.current && message.type === 'OFFER') {
        initializePeer(false, signal);
      } else if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    } catch (err) {
      console.error('Error handling signaling message:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [userId, targetUserId, onDisconnect]);

  // Initialize peer connection
  const initializePeer = useCallback(async (initiator: boolean, incomingSignal?: any) => {
    try {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      // Get user media if needed for video/audio
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      }

      const peer = new SimplePeer({
        initiator,
        stream: localStreamRef.current,
        trickle: true,
      });

      peer.on('signal', (data) => {
        const signalingType = initiator ? 'OFFER' : 'ANSWER';
        sendSignal(targetUserId, signalingType, JSON.stringify(data));
      });

      peer.on('connect', () => {
        setConnected(true);
        setConnecting(false);
      });

      peer.on('data', (data) => {
        onData?.(JSON.parse(data.toString()));
      });

      peer.on('stream', (stream) => {
        onStream?.(stream);
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setError(err);
        setConnected(false);
        setConnecting(false);
      });

      peer.on('close', () => {
        setConnected(false);
        setConnecting(false);
        onDisconnect?.();
      });

      peerRef.current = peer;

      if (incomingSignal) {
        peer.signal(incomingSignal);
      }

      setConnecting(true);
    } catch (err) {
      console.error('Error initializing peer:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize connection'));
      setConnecting(false);
    }
  }, [targetUserId, onData, onStream, onDisconnect]);

  // Send signaling message
  const sendSignal = useCallback(async (to: string, type: string, payload: string) => {
    try {
      await client.mutate({
        mutation: SEND_SIGNAL,
        variables: {
          to,
          type,
          payload,
        },
      });
    } catch (err) {
      console.error('Error sending signal:', err);
      setError(err instanceof Error ? err : new Error('Failed to send signal'));
    }
  }, [client]);

  // Set up signaling subscription
  useEffect(() => {
    const subscription = client.subscribe({
      query: SIGNAL_SUBSCRIPTION,
    }).subscribe({
      next: ({ data }) => {
        if (data?.signalReceived) {
          handleSignalingMessage(data.signalReceived);
        }
      },
      error: (err) => {
        console.error('Subscription error:', err);
        setError(err);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, handleSignalingMessage]);

  // Initialize connection if we're the initiator
  useEffect(() => {
    if (isInitiator) {
      initializePeer(true);
    }
  }, [isInitiator, initializePeer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        sendSignal(targetUserId, 'HANGUP', JSON.stringify({ type: 'hangup' }));
        peerRef.current.destroy();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [targetUserId, sendSignal]);

  // Expose functions to control the connection
  const sendData = useCallback((data: any) => {
    if (peerRef.current && connected) {
      peerRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [connected]);

  const disconnect = useCallback(() => {
    if (peerRef.current) {
      sendSignal(targetUserId, 'HANGUP', JSON.stringify({ type: 'hangup' }));
      peerRef.current.destroy();
      peerRef.current = null;
      setConnected(false);
      setConnecting(false);
    }
  }, [targetUserId, sendSignal]);

  const getLocalStream = useCallback(() => {
    return localStreamRef.current;
  }, []);

  return {
    connected,
    connecting,
    error,
    sendData,
    disconnect,
    getLocalStream,
  };
}