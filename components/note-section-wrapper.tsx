import { listNotesByCompanion } from "@/lib/actions/notes.action";
import NotesSection from "./notes-section";

interface NotesSectionWrapperProps {
  companionId: string;
  sessionId?: string;
  path: string;
}

const NotesSectionWrapper = async ({
  companionId,
  sessionId,
  path
}: NotesSectionWrapperProps) => {
  const notes = await listNotesByCompanion(companionId);

  return (
    <NotesSection
      companionId={companionId}
      sessionId={sessionId}
      path={path}
      initialNotes={notes}
    />
  );
};

export default NotesSectionWrapper;