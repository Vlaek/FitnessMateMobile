import { useLocalSearchParams } from 'expo-router';

import { ProgramEditorScreen } from '@/features/programs/editor/program-editor-screen';

export default function EditProgramRoute() {
  const { programId } = useLocalSearchParams<{ programId: string }>();

  return <ProgramEditorScreen programId={programId} />;
}
