import React from "react";
import { ScrollView } from "react-native";
import { colors, spacing } from "../../theme/tokens";
import type { Project } from "../../types/database";
import LatestStatusCard from "./LatestStatusCard";
import AllNotesSection from "./AllNotesSection";
import AssignedNotesList from "../../components/AssignedNotesList";
import RaiseConsultationSection from "../../components/RaiseConsultationSection";

export default function OwnerDashboardScreen({ project }: { project: Project }) {
  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <LatestStatusCard project={project} />
      <AssignedNotesList project={project} />
      <AllNotesSection project={project} />
      <RaiseConsultationSection project={project} />
    </ScrollView>
  );
}
