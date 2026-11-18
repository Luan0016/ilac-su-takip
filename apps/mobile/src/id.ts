import { getRandomBytes } from 'expo-crypto';
import { v7 } from 'uuid';

// React Native has no crypto.getRandomValues, so uuid gets its random bytes from expo-crypto.
export const newId = () => v7({ random: getRandomBytes(16) });
