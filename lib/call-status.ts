// Runtime CallStatus value for components to use.
// Note: There is also an ambient CallStatus type declared in types/index.d.ts.
// Import this value where you need to compare or set statuses at runtime.

export const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  FINISHED: "FINISHED",
} as const;

export type CallStatusValue = typeof CallStatus[keyof typeof CallStatus];
