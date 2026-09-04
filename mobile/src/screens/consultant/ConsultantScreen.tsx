import React, { useState } from "react";
import { ScrollView } from "react-native";
import { colors, spacing } from "../../theme/tokens";
import type { Project } from "../../types/database";
import VisitsSection from "./VisitsSection";
import CreateNoteSection from "./CreateNoteSection";
import PendingReviewSection from "./PendingReviewSection";
import ConsultationsSection from "./ConsultationsSection";

export default function ConsultantScreen({ project }: { project: Project }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <VisitsSection project={project} />
      <PendingReviewSection key={`pr-${refreshKey}`} project={project} />
      <ConsultationsSection key={`cs-${refreshKey}`} project={project} />
      <CreateNoteSection project={project} onCreated={() => setRefreshKey((k) => k + 1)} />
    </ScrollView>
  );
}
