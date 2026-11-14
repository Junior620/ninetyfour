import { NativeTabs } from "expo-router/native-tabs";
import { usePalette } from "@/ui/theme";

/** Main navigation of the cahier §02: Accueil, Effectif, Matchs, Terrain, Rapports. */
export default function TabsLayout() {
  const c = usePalette();
  return (
    <NativeTabs tintColor={c.accentText}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="effectif">
        <NativeTabs.Trigger.Icon sf="person.3.fill" md="groups" />
        <NativeTabs.Trigger.Label>Effectif</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matchs">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>Matchs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="terrain">
        <NativeTabs.Trigger.Icon sf="sportscourt.fill" md="sports_soccer" />
        <NativeTabs.Trigger.Label>Terrain</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rapports">
        <NativeTabs.Trigger.Icon sf="chart.bar.doc.horizontal.fill" md="analytics" />
        <NativeTabs.Trigger.Label>Rapports</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
