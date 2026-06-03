import { Redirect } from 'expo-router';

/** App entry: always start on the login screen. */
export default function Index() {
  return <Redirect href="/login" />;
}
