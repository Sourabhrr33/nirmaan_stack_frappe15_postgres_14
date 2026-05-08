// src/pages/projects/ProjectWorkReportTab.tsx
import React from "react";
import { Projects, ProjectZoneEntry } from "@/types/NirmaanStack/Projects";
import { FrappeDoc } from "frappe-react-sdk";
import type { KeyedMutator } from "swr";
import { MilestonesSummary } from "../Manpower-and-WorkMilestones/MilestonesSummary";
import { ProgressTrackingSettingsCard } from "./components/ProgressTrackingSettingsCard";

interface ProjectWorkReportTabProps {
    projectData: Projects;
    project_mutate: KeyedMutator<FrappeDoc<Projects>>;
    current_role: string;
}

interface ProjectsWithZones extends Projects {
    project_zones: ProjectZoneEntry[];
}

export const ProjectWorkReportTab: React.FC<ProjectWorkReportTabProps> = ({
    projectData,
    project_mutate,
    current_role,
}) => {
    const projectDataWithZones = projectData as ProjectsWithZones;
    const isMilestoneTrackingEnabled = Boolean(projectData.enable_project_milestone_tracking);

    return (
        <>
            <ProgressTrackingSettingsCard
                projectData={projectData}
                project_mutate={project_mutate}
                current_role={current_role}
            />

            {isMilestoneTrackingEnabled && Boolean(projectDataWithZones?.project_zones?.length) && (
                <MilestonesSummary
                    workReport={true}
                    projectIdForWorkReport={projectData?.name}
                />
            )}
        </>
    );
};
