import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProjectsListScreen from "../screens/ProjectsListScreen";
import CreateProjectScreen from "../screens/CreateProjectScreen";
import ProjectScreen from "../screens/ProjectScreen";
import { colors } from "../theme/tokens";

export type AppStackParamList = {
  ProjectsList: undefined;
  CreateProject: undefined;
  Project: { projectId: string; projectName: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="ProjectsList" component={ProjectsListScreen} options={{ title: "مشاريعي" }} />
      <Stack.Screen name="CreateProject" component={CreateProjectScreen} options={{ title: "مشروع جديد" }} />
      <Stack.Screen
        name="Project"
        component={ProjectScreen}
        options={({ route }) => ({ title: route.params.projectName })}
      />
    </Stack.Navigator>
  );
}
