import React from 'react';
import { Redirect } from 'expo-router';

export default function KeyboardWriteRedirect() {
  return <Redirect href={'/pages/writing' as any} />;
}
