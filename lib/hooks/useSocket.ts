import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/stores/auth";
import { useTenantStore } from "@/lib/stores/tenant";

export interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectOnTenantChange?: boolean;
  socketUrl?: string;
}

export interface SocketAuth {
  token: string | null;
  tenantId: string;
  userId: string;
  role: string;
  permissions?: string[];
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectOnTenantChange = true,
    socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { currentTenant } = useTenantStore();

  // Get auth token (you might want to get this from AuthManager instead)
  const getAuthToken = useCallback(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  }, []);

  // Create socket auth object
  const createSocketAuth = useCallback((): SocketAuth | null => {
    if (!user || !currentTenant) return null;

    return {
      token: getAuthToken(),
      tenantId: currentTenant.id,
      userId: user.id,
      role: user.role,
      permissions: user.permissions || [],
    };
  }, [user, currentTenant, getAuthToken]);

  // Connect to socket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const auth = createSocketAuth();
    if (!auth || !auth.token) return;

    console.log("Connecting to socket with tenant:", auth.tenantId);

    const socket = io(socketUrl, {
      auth,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to socket server", socket.id);
      // Join tenant-specific room
      socket.emit("join-tenant", auth.tenantId);
      // Join user-specific room
      socket.emit("join-user", auth.userId);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Tenant-specific events
    socket.on("tenant-switched", (newTenantId: string) => {
      console.log("Tenant switched on server:", newTenantId);
      if (newTenantId !== auth.tenantId) {
        // Handle tenant switch
        socket.emit("leave-tenant", auth.tenantId);
        socket.emit("join-tenant", newTenantId);
      }
    });

    return socket;
  }, [createSocketAuth, socketUrl]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Disconnecting from socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Reconnect socket
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Main effect: Handle connection based on auth and tenant state
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && currentTenant) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, currentTenant, autoConnect, connect, disconnect]);

  // Effect: Handle tenant changes
  useEffect(() => {
    if (
      reconnectOnTenantChange &&
      socketRef.current?.connected &&
      currentTenant
    ) {
      const auth = createSocketAuth();
      if (auth) {
        console.log("Tenant changed, updating socket rooms");
        // Leave old tenant room and join new one
        socketRef.current.emit("switch-tenant", auth.tenantId);
      }
    }
  }, [currentTenant, reconnectOnTenantChange, createSocketAuth]);

  // Socket utility methods
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit:", event);
    }
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.on(event, callback);
    },
    []
  );

  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      socketRef.current?.off(event, callback);
    },
    []
  );

  // Emit to specific tenant room
  const emitToTenant = useCallback(
    (event: string, data?: any) => {
      if (currentTenant) {
        emit(`tenant:${currentTenant.id}:${event}`, data);
      }
    },
    [emit, currentTenant]
  );

  // Check connection status
  const isConnected = socketRef.current?.connected || false;

  // Get socket ID
  const getSocketId = useCallback(() => {
    return socketRef.current?.id || null;
  }, []);

  return {
    // State
    socket: socketRef.current,
    isConnected,

    // Connection management
    connect,
    disconnect,
    reconnect,

    // Socket utilities
    emit,
    on,
    off,
    emitToTenant,
    getSocketId,
  };
}
