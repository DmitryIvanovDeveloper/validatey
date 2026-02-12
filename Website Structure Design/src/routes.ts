import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallback } from "./pages/AuthCallback";
import { ProjectsList } from "./pages/ProjectsList";
import { CreateProject } from "./pages/CreateProject";
import { ProjectOverview } from "./pages/ProjectOverview";
import { ProjectResearch } from "./pages/ProjectResearch";
import { ProjectReport } from "./pages/ProjectReport";
import { ProjectInvitations } from "./pages/ProjectInvitations";
import { ProjectScraper } from "./pages/ProjectScraper";
import { ProjectResponses } from "./pages/ProjectResponses";
import { ProjectProgress } from "./pages/ProjectProgress";
import { EditProject } from "./pages/EditProject";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminFeedback } from "./pages/AdminFeedback";
import { PublicSurvey } from "./pages/PublicSurvey";
import { NotFound } from "./pages/NotFound";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { ProjectLayout } from "./components/layouts/ProjectLayout";
import { AdminLayout } from "./components/layouts/AdminLayout";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      {
        index: true,
        Component: ProjectsList,
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            Component: ProjectsList,
          },
          {
            path: "new",
            Component: CreateProject,
          },
          {
            path: ":id",
            Component: ProjectLayout,
            children: [
              {
                index: true,
                Component: ProjectOverview,
              },
              {
                path: "research",
                Component: ProjectResearch,
              },
              {
                path: "report",
                Component: ProjectReport,
              },
              {
                path: "invitations",
                Component: ProjectInvitations,
              },
              {
                path: "scraper",
                Component: ProjectScraper,
              },
              {
                path: "responses",
                Component: ProjectResponses,
              },
              {
                path: "progress",
                Component: ProjectProgress,
              },
              {
                path: "edit",
                Component: EditProject,
              },
            ],
          },
        ],
      },
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          {
            path: "users",
            Component: AdminUsers,
          },
          {
            path: "feedback",
            Component: AdminFeedback,
          },
        ],
      },
    ],
  },
  {
    path: "/survey/:token",
    Component: PublicSurvey,
  },
  {
    path: "/survey/public/:slug",
    Component: PublicSurvey,
  },
  {
    path: "/s/:slug",
    Component: PublicSurvey,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
