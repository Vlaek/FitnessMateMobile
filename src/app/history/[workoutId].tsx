import { useLocalSearchParams } from 'expo-router';
import { WorkoutDetailScreen } from '@/features/history/workout-detail-screen';
export default function WorkoutDetailRoute() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  return <WorkoutDetailScreen workoutId={workoutId} />;
}
