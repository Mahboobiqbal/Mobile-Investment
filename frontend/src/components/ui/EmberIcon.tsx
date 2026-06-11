import React from 'react';
import { Text } from 'react-native';

/**
 * Simple inline icon helper to keep dashboard layout consistent.
 * (We will use unicode/emoji placeholders unless you provide SVG assets.)
 */
export default function EmberIcon({ label, color, size = 18 }: { label: string; color?: string; size?: number }) {
  return (
    <Text style={{ color, fontSize: size, fontWeight: '700' }} accessibilityLabel={label}>
      {label}
    </Text>
  );
}

