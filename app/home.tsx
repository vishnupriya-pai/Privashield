import { Redirect } from 'expo-router';

/** Legacy route — send to main tabs after sign-in. */
export default function HomeScreen() {
  return <Redirect href="/(tabs)" />;
}
