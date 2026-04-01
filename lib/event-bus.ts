import { EventEmitter } from 'events'

// Global Event Emitter for Local Dev environment to enable true SSE streaming
// In serverless deployment (Vercel), this only works if publisher and subscriber
// happen to hit the same container instances. For a production serverless app,
// you would replace this with Redis Pub/Sub, Pusher, or Ably.

const globalForEventBus = globalThis as unknown as {
  __eventBus: EventEmitter | undefined
}

export const eventBus = globalForEventBus.__eventBus ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  globalForEventBus.__eventBus = eventBus
}
